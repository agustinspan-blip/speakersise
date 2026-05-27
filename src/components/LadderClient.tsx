"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SpeakerType } from "@/lib/types";
import type { BandKey } from "@/lib/ladder-bands";
import { useUnits } from "@/lib/use-units";
import type { UnitSystem } from "@/lib/units";

/**
 * Client-side root of the HiFi ladder page. Owns two pieces of state:
 *   - the active tab (bookshelf | floorstander)
 *   - the user's current selection (up to 4 speaker ids)
 *
 * The actual band rendering is server-prepared and passed in as
 * plain data so the client bundle stays light: each entry already
 * knows its real-world dimensions and the band's pixel scale, so
 * rendering is just multiplying.
 */

const MAX_SELECTION = 4;
// One inch in mm — used to convert mm dimensions to inches for the
// user-selectable unit display and to space the inch ruler ticks.
const MM_PER_IN = 25.4;

/**
 * Local alias for the global UnitSystem — kept so the rest of this
 * file reads naturally and so swapping to a third unit (e.g. metric +
 * imperial + nautical) would only require touching one line.
 */
type Units = UnitSystem;

/** Convert a height in mm into the display string for the active unit. */
function formatHeight(heightMm: number, units: Units): string {
  if (units === "imperial") {
    return `${(heightMm / MM_PER_IN).toFixed(1)} in`;
  }
  return `${(heightMm / 10).toFixed(1)} cm`;
}

interface ClientSpeaker {
  id: string;
  brand: string;
  model: string;
  generation?: string;
  heightMm: number;
  widthMm: number;
  weightKg: number;
  impedanceOhm?: number;
  sensitivityDb?: number;
  driversSummary: string;
  countryCode: string;
  powerType: "active" | "passive" | "hybrid";
  front: string;
}

type PowerFilter = "all" | "active" | "passive" | "hybrid";

interface ClientBand {
  key: BandKey;
  type: SpeakerType;
  speakers: ClientSpeaker[];
}

// Visual pixels-per-millimetre per tab. Held constant within a tab so
// switching between sub-bands doesn't make a given speaker render at
// a different on-screen size. Floors use a smaller scale because the
// catalog reaches ~1.8 m and otherwise the tallest models would scroll
// off the band container vertically.
const SCALE_BY_TAB: Record<SpeakerType, number> = {
  bookshelf: 0.5,
  floorstander: 0.25,
};

type TabKey = SpeakerType;

const BAND_LABEL_KEY: Record<BandKey, keyof Dictionary["ladder"]> = {
  "compact-bookshelf": "bandCompactBookshelf",
  "larger-bookshelf": "bandLargerBookshelf",
  "mid-floor": "bandMidFloor",
  "tall-floor": "bandTallFloor",
};

// Default band per tab — the smaller one of the pair, per spec.
const DEFAULT_BAND_FOR_TAB: Record<SpeakerType, BandKey> = {
  bookshelf: "compact-bookshelf",
  floorstander: "mid-floor",
};

export function LadderClient({
  bands,
  brandFlags,
  locale,
  t,
}: {
  bands: ClientBand[];
  brandFlags: Record<string, { flag: string; countryName: string }>;
  locale: Locale;
  t: Dictionary;
}) {
  const [tab, setTab] = useState<TabKey>("bookshelf");
  // Within a tab, only one band is visible at a time. Default to the
  // smaller band of the active tab; users switch via the sub-selector.
  const [activeBand, setActiveBand] = useState<BandKey>(
    DEFAULT_BAND_FOR_TAB.bookshelf
  );
  // Stored as an array so iteration order = selection order, which
  // determines slot assignment in the compare URLs.
  const [selected, setSelected] = useState<string[]>([]);
  // Metric by default — matches the rest of the site. Persisted to
  // localStorage so a flip here is remembered on /compare, /compare4
  // and any other page that reads the same hook.
  const { units, setUnits } = useUnits();
  // Hover tooltip — anchored to the hovered slot's bounding rect via
  // a portal so it can render outside the scroll container's clipping
  // box. Holds the active speaker plus the slot's screen rect; both
  // are nulled out on mouse leave.
  const [hovered, setHovered] = useState<{
    speaker: ClientSpeaker;
    rect: DOMRect;
  } | null>(null);
  // The portal needs a real DOM root, which doesn't exist during SSR.
  // Track mount so we only attempt to portal client-side and avoid
  // hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Filters: all default to "no filter" so the page lands with every
  // speaker visible. They live alongside the band selector and apply
  // to the currently visible band only.
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [powerFilter, setPowerFilter] = useState<PowerFilter>("all");

  // Switching tabs always resets the sub-band to that tab's default
  // (the smaller one) so users don't end up on a "tall" sub-band
  // they didn't explicitly choose after switching tabs. Filters
  // also reset — they're per-band by design.
  function switchTab(next: TabKey) {
    setTab(next);
    setActiveBand(DEFAULT_BAND_FOR_TAB[next]);
    setBrandFilter("");
    setCountryFilter(new Set());
    setPowerFilter("all");
  }

  const tabBands = useMemo(
    () => bands.filter((b) => b.type === tab),
    [bands, tab]
  );
  const visibleBand = useMemo(
    () => tabBands.find((b) => b.key === activeBand) ?? tabBands[0],
    [tabBands, activeBand]
  );
  // Lists of brands / countries present in the active band drive the
  // filter UI — there's no point offering "Wharfedale" as an option
  // if the active band has zero Wharfedale entries. Computed off the
  // raw band so the user can dial filters back to "all" cleanly.
  // The tallest rendered speaker across *every* band, in pixels. Used
  // as a fixed card height so the Bookshelf and Floorstanding ladders
  // share the same box size (the user asked for both to match the
  // largest one) instead of each shrinking to its own tallest model.
  // Computed off the full band sets (not the filtered view) so the box
  // doesn't resize as filters change.
  const maxVisualPx = useMemo(() => {
    let max = 0;
    for (const b of bands) {
      if (b.speakers.length === 0) continue;
      const scale = SCALE_BY_TAB[b.type];
      const tallestMm = Math.max(...b.speakers.map((s) => s.heightMm));
      max = Math.max(max, tallestMm * scale);
    }
    return max;
  }, [bands]);

  const availableBrands = useMemo(() => {
    if (!visibleBand) return [];
    return Array.from(new Set(visibleBand.speakers.map((s) => s.brand))).sort();
  }, [visibleBand]);
  const availableCountries = useMemo(() => {
    if (!visibleBand) return [];
    const codes = new Set<string>();
    for (const s of visibleBand.speakers) if (s.countryCode) codes.add(s.countryCode);
    return Array.from(codes).sort();
  }, [visibleBand]);

  // Applied filters → the list of speakers actually rendered. Each
  // filter falls through when set to its "no filter" sentinel so the
  // common case (no filters) is a no-op.
  const filteredSpeakers = useMemo(() => {
    if (!visibleBand) return [];
    return visibleBand.speakers.filter((s) => {
      if (brandFilter && s.brand !== brandFilter) return false;
      if (countryFilter.size > 0 && !countryFilter.has(s.countryCode))
        return false;
      if (powerFilter !== "all" && s.powerType !== powerFilter) return false;
      return true;
    });
  }, [visibleBand, brandFilter, countryFilter, powerFilter]);

  // Reset filters when changing the visible band so the user doesn't
  // land on an empty band because their previous filters don't match
  // anything in the new one.
  function changeActiveBand(next: BandKey) {
    setActiveBand(next);
    setBrandFilter("");
    setCountryFilter(new Set());
    setPowerFilter("all");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev; // hard cap
      return [...prev, id];
    });
  }

  function clear() {
    setSelected([]);
  }

  return (
    <>
      <Tabs active={tab} onChange={switchTab} t={t} />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <BandSelector
          bands={tabBands}
          active={activeBand}
          onChange={changeActiveBand}
          t={t}
        />
        <UnitsToggle units={units} onChange={setUnits} t={t} />
      </div>
      <FilterBar
        brands={availableBrands}
        brandFilter={brandFilter}
        onBrandFilter={setBrandFilter}
        countries={availableCountries}
        countryFilter={countryFilter}
        onCountryToggle={(code) =>
          setCountryFilter((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
          })
        }
        powerFilter={powerFilter}
        onPowerFilter={setPowerFilter}
        brandFlags={brandFlags}
        t={t}
      />
      {/*
        Reserve breathing room below the bands only when the CompareDock
        is on screen — otherwise it would push the SponsorBanner that
        follows on the page far below the ladder for no reason. When no
        speakers are selected the dock isn't rendered, so a small
        `pb-2` keeps the visual rhythm tight against whatever comes
        next in the page.
      */}
      <div className={selected.length > 0 ? "pb-32" : "pb-2"}>
        {!visibleBand || filteredSpeakers.length === 0 ? (
          <p className="text-sm text-stone-500">{t.ladder.emptyTab}</p>
        ) : (
          <Band
            band={visibleBand}
            speakers={filteredSpeakers}
            containerPx={maxVisualPx}
            brandFlags={brandFlags}
            selected={selected}
            onToggle={toggle}
            onHover={(speaker, rect) => setHovered({ speaker, rect })}
            onHoverEnd={() => setHovered(null)}
            units={units}
            t={t}
          />
        )}
      </div>
      {mounted && hovered &&
        createPortal(
          <HoverTooltip speaker={hovered.speaker} rect={hovered.rect} t={t} />,
          document.body
        )}
      <CompareDock
        selected={selected}
        // Look up the speaker objects across all bands so the dock can
        // render thumbnails regardless of which tab they came from.
        allSpeakers={useAllSpeakers(bands)}
        onClear={clear}
        onRemove={(id) =>
          setSelected((prev) => prev.filter((x) => x !== id))
        }
        locale={locale}
        t={t}
      />
    </>
  );
}

function useAllSpeakers(bands: ClientBand[]): Map<string, ClientSpeaker> {
  return useMemo(() => {
    const map = new Map<string, ClientSpeaker>();
    for (const b of bands) for (const s of b.speakers) map.set(s.id, s);
    return map;
  }, [bands]);
}

function Tabs({
  active,
  onChange,
  t,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  t: Dictionary;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "bookshelf", label: t.ladder.tabBookshelf },
    { key: "floorstander", label: t.ladder.tabFloorstander },
  ];
  return (
    <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-amber-600 text-stone-900 dark:border-amber-500 dark:text-stone-100"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function UnitsToggle({
  units,
  onChange,
  t,
}: {
  units: Units;
  onChange: (u: Units) => void;
  t: Dictionary;
}) {
  const options: { key: Units; label: string }[] = [
    { key: "metric", label: t.ladder.unitsCm },
    { key: "imperial", label: t.ladder.unitsIn },
  ];
  return (
    <div
      className="inline-flex items-center gap-2 text-xs"
      aria-label={t.ladder.unitsLabel}
    >
      <span className="uppercase tracking-wider text-stone-500">
        {t.ladder.unitsLabel}
      </span>
      <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 overflow-hidden">
        {options.map((opt) => {
          const isActive = opt.key === units;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                isActive
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterBar({
  brands,
  brandFilter,
  onBrandFilter,
  countries,
  countryFilter,
  onCountryToggle,
  powerFilter,
  onPowerFilter,
  brandFlags,
  t,
}: {
  brands: string[];
  brandFilter: string;
  onBrandFilter: (b: string) => void;
  countries: string[];
  countryFilter: Set<string>;
  onCountryToggle: (code: string) => void;
  powerFilter: PowerFilter;
  onPowerFilter: (p: PowerFilter) => void;
  brandFlags: Record<string, { flag: string; countryName: string }>;
  t: Dictionary;
}) {
  // Build a code → flag emoji + country name lookup from the brand
  // info; we only need country metadata for the chips, but BRAND_INFO
  // is keyed by brand, so collapse the duplicates here.
  const flagsByCountry = new Map<string, { flag: string; name: string }>();
  for (const brand of Object.keys(brandFlags)) {
    const info = brandFlags[brand];
    // The component receives flag+countryName but not the code. Look
    // it up from countries in the band (which only includes the codes
    // present). We don't have a code→flag map directly; rather than
    // plumb it through, fall back to "" and skip the chip if it's not
    // in the lookup we build below.
    void info;
  }
  // Quick way to recover code → flag: scan provided countries and try
  // to match against any brandFlags entry that uses that code as
  // country. Since `brandFlags` doesn't carry the code, we can't
  // reverse-map cleanly — instead, fall back to rendering the chip
  // with just the code if the flag isn't found.
  return (
    <div className="flex items-center gap-3 gap-y-2 flex-wrap text-xs">
      <span className="uppercase tracking-wider text-stone-500">
        {t.ladder.filtersLabel}
      </span>
      {/* Brand: a plain native select keeps the markup light. The
          first option is the "all" sentinel; selecting an empty value
          drops the filter. */}
      <label className="inline-flex items-center gap-2">
        <span className="text-stone-500">{t.ladder.brandFilter}</span>
        <select
          value={brandFilter}
          onChange={(e) => onBrandFilter(e.target.value)}
          className="h-7 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 px-2 pr-7 text-xs hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          <option value="">{t.ladder.filterAll}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      {/* Country chips. Toggle-style; multi-select. We need a code →
          flag map; pull it ad-hoc from the brandFlags by finding any
          speaker brand whose country matches. */}
      {countries.length > 0 && (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          <span className="text-stone-500">{t.ladder.countryFilter}</span>
          {countries.map((code) => {
            const flag = flagForCode(code);
            const isActive = countryFilter.has(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => onCountryToggle(code)}
                aria-pressed={isActive}
                title={code.toUpperCase()}
                className={`inline-flex items-center justify-center h-7 w-9 rounded-full border text-base transition-colors ${
                  isActive
                    ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40"
                    : "border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {flag ?? code.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
      {/* Power type — small segmented control. */}
      <div className="inline-flex items-center gap-2">
        <span className="text-stone-500">{t.ladder.powerFilter}</span>
        <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 overflow-hidden">
          {(["all", "passive", "active", "hybrid"] as const).map((key) => {
            const isActive = key === powerFilter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPowerFilter(key)}
                className={`px-3 py-1 font-medium transition-colors ${
                  isActive
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {
                  {
                    all: t.ladder.filterAll,
                    active: t.ladder.powerActive,
                    passive: t.ladder.powerPassive,
                    hybrid: t.ladder.powerHybrid,
                  }[key]
                }
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Country-code → flag emoji lookup. The page-level `brandFlags` map
 * is keyed by brand name (not country code), so we maintain a parallel
 * code map here. Add new countries as the catalog grows.
 */
/**
 * Country-code → flag emoji lookup. Codes are the ISO 3166-1 alpha-2
 * values stored on each brand (e.g. `GB`, `DK`, `US`). We build the
 * flag from the regional-indicator codepoint pair so any future ISO
 * country works without touching this file.
 */
function flagForCode(code: string): string | null {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  const first = upper.charCodeAt(0);
  const second = upper.charCodeAt(1);
  // Valid A-Z range, then offset into the regional-indicator block.
  if (first < 65 || first > 90 || second < 65 || second > 90) return null;
  return String.fromCodePoint(0x1f1e6 + (first - 65), 0x1f1e6 + (second - 65));
}

function BandSelector({
  bands,
  active,
  onChange,
  t,
}: {
  bands: ClientBand[];
  active: BandKey;
  onChange: (k: BandKey) => void;
  t: Dictionary;
}) {
  return (
    <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 overflow-hidden text-xs">
      {bands.map((band) => {
        const isActive = band.key === active;
        return (
          <button
            key={band.key}
            type="button"
            onClick={() => onChange(band.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              isActive
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            {t.ladder[BAND_LABEL_KEY[band.key]]}
            <span className="ml-2 text-[10px] opacity-70">
              {band.speakers.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Band({
  band,
  speakers,
  containerPx,
  brandFlags,
  selected,
  onToggle,
  onHover,
  onHoverEnd,
  units,
  t,
}: {
  band: ClientBand;
  /**
   * Already-filtered list of speakers to render. Separate from
   * `band.speakers` so the band's "max speaker height" used for the
   * vertical scale stays anchored to the full set — filtering down
   * to a handful of shorter speakers shouldn't squish the ruler.
   */
  speakers: ClientSpeaker[];
  /**
   * Fixed pixel height of the visual area, shared by every band so
   * the Bookshelf and Floorstanding cards match (= the tallest
   * rendered speaker across all bands). Speakers and the ruler are
   * bottom-aligned inside it, leaving headroom above the shorter
   * bands rather than shrinking their box.
   */
  containerPx: number;
  brandFlags: Record<string, { flag: string; countryName: string }>;
  selected: string[];
  onToggle: (id: string) => void;
  onHover: (speaker: ClientSpeaker, rect: DOMRect) => void;
  onHoverEnd: () => void;
  units: Units;
  t: Dictionary;
}) {
  // Both tabs use the same vertical ruler as the reference — the ruler
  // ticks honour the cm/in toggle and scale with the band.
  const scale = SCALE_BY_TAB[band.type];
  // The rendered visual height is the shared `containerPx` so both
  // ladders share a box size; the ruler fills it (its tick count
  // derives from `containerPx / scale`), and speakers sit on the
  // shared floor at their true heights.
  const visualPx = containerPx;
  // Reference column width: just the ruler content (RULER_WIDTH) plus
  // ReferenceSlot's `pl-6 pr-2` inner padding (32 px). Kept tight so
  // the ruler doesn't eat half the viewport on a narrow phone — the
  // old `LABEL_MIN_WIDTH` floor was a leftover from the bill reference.
  const refSlotWidth = RULER_WIDTH + 24 + 8;

  return (
    <section>
      {/*
        Two-column layout, flex siblings:
          - left column = reference (bill or ruler), fixed width, never
            scrolls
          - right column = horizontally scrolling speaker row
        The previous attempts (sticky inside flex, absolute sibling on
        top of the scroll area) either lost the anchor past a certain
        speaker count or hid the scrollbar's left half. Splitting the
        layout into two real flex columns avoids both problems: the
        scrollbar lives only on the right column so it's fully visible,
        and the reference is structural (not absolute) so it can't drop
        away mid-scroll.
      */}
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white flex items-stretch">
        <div
          className="shrink-0 bg-white pt-6 pb-6 border-r border-stone-100"
          style={{ width: refSlotWidth }}
        >
          <RulerReference
            scale={scale}
            visualPx={visualPx}
            units={units}
            type={band.type}
            t={t}
          />
        </div>
        <div className="flex-1 min-w-0 overflow-x-auto ladder-scroll">
          <div className="flex items-stretch gap-6 pl-6 pr-6 pt-6 pb-6">
            {speakers.map((s) => (
              <Entry
                key={s.id}
                speaker={s}
                scale={scale}
                visualPx={visualPx}
                flag={brandFlags[s.brand]?.flag}
                countryName={brandFlags[s.brand]?.countryName}
                isSelected={selected.includes(s.id)}
                canSelect={selected.length < MAX_SELECTION}
                onToggle={() => onToggle(s.id)}
                onHover={onHover}
                onHoverEnd={onHoverEnd}
                units={units}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const LABEL_MIN_WIDTH = 140;
// On-screen width of the vertical ruler (tick marks + their cm/in
// labels). The reference column is sized to this plus padding.
const RULER_WIDTH = 56;

function RulerReference({
  scale,
  visualPx,
  units,
  type,
  t,
}: {
  scale: number;
  visualPx: number;
  units: Units;
  type: SpeakerType;
  t: Dictionary;
}) {
  // Vertical ruler at the band's pixels-per-mm scale. Tick density is
  // tuned per tab so the ruler stays readable:
  //   - Bookshelf bands use a smaller scale range (~20-70 cm) and the
  //     band's 0.5 px/mm is dense enough to label every 5 cm without
  //     crowding.
  //   - Floor bands cover 80-180 cm at 0.25 px/mm — labelling every
  //     5 cm there would smush the text, so we keep the previous
  //     "major every 20 cm, minor every 10 cm unlabelled" pattern.
  const SLOT_WIDTH = RULER_WIDTH;
  const denseLabels = type === "bookshelf";
  // Step between labelled ticks in mm. cm modes are round metric
  // values; inch modes use 2"/10" steps to mirror those visually.
  const majorStepMm = denseLabels
    ? units === "metric"
      ? 50 // 5 cm
      : 2 * MM_PER_IN // 2 in
    : units === "metric"
      ? 200 // 20 cm
      : 10 * MM_PER_IN; // 10 in
  // Minor ticks only exist in the floor (non-dense) pattern.
  const minorStepMm = denseLabels
    ? null
    : units === "metric"
      ? 100 // 10 cm minor between 20 cm majors
      : 5 * MM_PER_IN; // 5 in minor between 10 in majors
  const maxMm = visualPx / scale;

  const majorTicks: number[] = [];
  for (let mm = 0; mm <= maxMm + 0.5; mm += majorStepMm) majorTicks.push(mm);
  const minorTicks: number[] = [];
  if (minorStepMm !== null) {
    for (let mm = minorStepMm; mm <= maxMm + 0.5; mm += majorStepMm) {
      minorTicks.push(mm); // first minor halfway between major lines
    }
  }

  function labelFor(mm: number): string {
    if (units === "imperial") {
      // Show one decimal for non-integer inch counts (avoids "5\" 5\"")
      const inches = mm / MM_PER_IN;
      return Number.isInteger(inches)
        ? `${inches}"`
        : `${inches.toFixed(1)}"`;
    }
    return `${Math.round(mm / 10)} cm`;
  }

  return (
    <ReferenceSlot
      label={t.ladder.referenceRulerLabel}
      ariaLabel={t.ladder.referenceRulerLabel}
      slotWidth={SLOT_WIDTH}
      visualPx={visualPx}
    >
      {/*
        The ruler is drawn at the same pixel height as the speakers
        next to it (`visualPx`), with ticks growing from the floor
        upward. Inline SVG keeps it crisp and easy to colour-match
        against the page palette.
      */}
      <div
        style={{ width: RULER_WIDTH, height: visualPx }}
        className="relative text-stone-400"
        aria-hidden
      >
        <div className="absolute right-0 top-0 bottom-0 w-px bg-stone-300" />
        {minorTicks.map((mm) => {
          const bottom = mm * scale;
          return (
            <span
              key={`min-${mm}`}
              className="absolute right-0 h-px bg-stone-300"
              style={{ bottom, width: 6 }}
            />
          );
        })}
        {majorTicks.map((mm) => {
          const bottom = mm * scale;
          return (
            <div
              key={`maj-${mm}`}
              className="absolute right-0 flex items-center gap-1"
              style={{ bottom: bottom - 6 }}
            >
              <span className="tabular-nums whitespace-nowrap text-[10px] pr-1">
                {labelFor(mm)}
              </span>
              <span className="h-px bg-stone-400" style={{ width: 10 }} />
            </div>
          );
        })}
      </div>
    </ReferenceSlot>
  );
}

/**
 * Shared scaffold for the reference column at the left of every band.
 * Pins the children to the bottom of an image-area whose height matches
 * the rest of the band (`visualPx`), then prints the label below — same
 * skeleton as the speaker entries so the floor line lands identically.
 */
function ReferenceSlot({
  children,
  label,
  ariaLabel,
  slotWidth,
  visualPx,
}: {
  children: React.ReactNode;
  label: string;
  ariaLabel: string;
  slotWidth: number;
  visualPx: number;
}) {
  // ReferenceSlot is now nested inside the band's absolute reference
  // column (see Band) so it no longer needs its own sticky / z-index
  // / background. `pl-6 pr-2` provides the visual breathing space
  // between the rounded card edge and the bill/ruler content.
  return (
    <div
      className="flex flex-col items-center pl-6 pr-2"
      style={{ width: slotWidth + 24 + 8 }}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <div
        className="flex items-end justify-center"
        style={{ width: slotWidth, height: visualPx }}
      >
        {children}
      </div>
      <span
        className="mt-3 text-[10px] uppercase tracking-wider text-stone-400 whitespace-nowrap"
        style={{ width: slotWidth, textAlign: "center" }}
      >
        {label}
      </span>
    </div>
  );
}

function Entry({
  speaker,
  scale,
  visualPx,
  flag,
  countryName,
  isSelected,
  canSelect,
  onToggle,
  onHover,
  onHoverEnd,
  units,
  t,
}: {
  speaker: ClientSpeaker;
  scale: number;
  visualPx: number;
  flag?: string;
  countryName?: string;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: () => void;
  onHover: (speaker: ClientSpeaker, rect: DOMRect) => void;
  onHoverEnd: () => void;
  units: Units;
  t: Dictionary;
}) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  function fireHover() {
    if (!slotRef.current) return;
    onHover(speaker, slotRef.current.getBoundingClientRect());
  }
  // Real-world dimensions × band scale = pixel size for the front
  // image. The thumbnail keeps its true aspect ratio so a slim
  // satellite reads as slim and a chunky monitor reads as chunky.
  const heightPx = speaker.heightMm * scale;
  const widthPx = Math.max(40, speaker.widthMm * scale);
  // Slot grows with the cabinet's footprint so wide models don't
  // overlap their neighbours. Falls back to a minimum width so slim
  // speakers' labels stay readable.
  const slotWidth = Math.max(LABEL_MIN_WIDTH, widthPx);
  const heightLabel = formatHeight(speaker.heightMm, units);
  const disabled = !isSelected && !canSelect;

  return (
    <div
      ref={slotRef}
      className="shrink-0 flex flex-col items-center"
      style={{ width: slotWidth }}
      onMouseEnter={fireHover}
      onMouseLeave={onHoverEnd}
      onFocus={fireHover}
      onBlur={onHoverEnd}
    >
      {/*
        Image area: fixed height = the band's tallest visual element.
        The button inside is bottom-aligned, so its bottom edge lands
        on the same Y line as every other slot's image bottom — that's
        the "floor" the ladder stands on.
      */}
      <div
        className="flex items-end justify-center w-full"
        style={{ height: visualPx }}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={isSelected}
          title={
            disabled
              ? t.ladder.selectionFull
              : `${speaker.brand} ${speaker.model}`
          }
          className={`relative block rounded-sm transition-all ${
            isSelected
              ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white"
              : "ring-1 ring-transparent hover:ring-stone-300"
          } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          style={{ width: widthPx, height: heightPx }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={speaker.front}
            alt={`${speaker.brand} ${speaker.model}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
          {isSelected && (
            <span
              aria-hidden
              className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold shadow"
            >
              ✓
            </span>
          )}
        </button>
      </div>
      <div className="mt-3 text-center w-full">
        <div className="flex items-center justify-center gap-1.5">
          {flag && (
            <span
              className="text-base leading-none"
              aria-label={countryName}
              title={countryName}
            >
              {flag}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider text-stone-500 truncate">
            {speaker.brand}
          </span>
        </div>
        <div
          className="mt-0.5 text-xs font-medium text-stone-900 leading-tight break-words"
          style={{ minHeight: "2.5em" }}
        >
          {speaker.model}
          {speaker.generation && (
            <span className="ml-1 font-normal text-stone-500">
              {speaker.generation}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-col items-center gap-0">
          <span className="text-sm font-semibold text-stone-900">
            {heightLabel}
          </span>
          <span className="text-[11px] text-stone-500">
            {speaker.weightKg} kg
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Portal-rendered hover tooltip. Positioned with `position: fixed`
 * based on the hovered slot's screen rect, so it always escapes the
 * ladder's scroll container clipping box. Computes its X to stay
 * inside the viewport for entries near the left/right edges.
 */
function HoverTooltip({
  speaker,
  rect,
  t,
}: {
  speaker: ClientSpeaker;
  rect: DOMRect;
  t: Dictionary;
}) {
  const lines: { label: string; value: string }[] = [];
  if (speaker.driversSummary)
    lines.push({ label: t.ladder.tooltipDrivers, value: speaker.driversSummary });
  if (speaker.impedanceOhm !== undefined)
    lines.push({
      label: t.ladder.tooltipImpedance,
      value: `${speaker.impedanceOhm} Ω`,
    });
  if (speaker.sensitivityDb !== undefined)
    lines.push({
      label: t.ladder.tooltipSensitivity,
      value: `${speaker.sensitivityDb} dB`,
    });
  lines.push({
    label: t.ladder.tooltipWeight,
    value: `${speaker.weightKg} kg`,
  });

  const TOOLTIP_WIDTH = 224;
  const MARGIN = 8;
  // Anchor X to the slot's horizontal centre, then clamp so the
  // tooltip never spills outside the viewport on either edge.
  const centerX = rect.left + rect.width / 2;
  const viewportW =
    typeof window !== "undefined" ? window.innerWidth : 1024;
  const leftClamped = Math.max(
    MARGIN,
    Math.min(
      centerX - TOOLTIP_WIDTH / 2,
      viewportW - TOOLTIP_WIDTH - MARGIN
    )
  );
  // Drop the tooltip above the slot when there's room; otherwise
  // anchor it below (gives speakers near the top of the viewport a
  // sane fallback).
  const SPACE_ABOVE = rect.top;
  const placeAbove = SPACE_ABOVE >= 110;
  const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
  const transformY = placeAbove ? "translateY(-100%)" : "translateY(0)";

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-md bg-stone-900 px-3 py-2 text-[11px] leading-snug font-normal text-white shadow-lg"
      style={{
        left: leftClamped,
        top,
        width: TOOLTIP_WIDTH,
        transform: transformY,
      }}
    >
      <div className="font-semibold mb-1">
        {speaker.brand} {speaker.model}
      </div>
      {lines.map((line) => (
        <div key={line.label} className="flex justify-between gap-2">
          <span className="text-stone-400">{line.label}</span>
          <span className="text-right">{line.value}</span>
        </div>
      ))}
    </div>
  );
}

function CompareDock({
  selected,
  allSpeakers,
  onClear,
  onRemove,
  locale,
  t,
}: {
  selected: string[];
  allSpeakers: Map<string, ClientSpeaker>;
  onClear: () => void;
  onRemove: (id: string) => void;
  locale: Locale;
  t: Dictionary;
}) {
  if (selected.length === 0) return null;

  // Routing rules:
  //   - 2 selected → show both TrueScale (/compare) and TrueSpecs
  //     (/compare4); the visual comparator only handles a 2-way pair,
  //     so it's the "scale" CTA. /compare4 also accepts 2 ids and
  //     becomes the specs-heavy alternative.
  //   - 3-4 selected → only TrueSpecs; /compare can't render more
  //     than two cabinets without a redesign, so the visual button
  //     disappears entirely.
  //   - 1 selected → both buttons disabled, the user needs another.
  const trueScaleHref =
    selected.length === 2
      ? `/${locale}/compare?a=${encodeURIComponent(selected[0])}&b=${encodeURIComponent(selected[1])}`
      : null;
  const trueSpecsHref = (() => {
    if (selected.length < 2) return null;
    const slots = ["a", "b", "c", "d"];
    const qs = selected
      .map((id, i) => `${slots[i]}=${encodeURIComponent(id)}`)
      .join("&");
    return `/${locale}/compare4?${qs}`;
  })();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {selected.map((id) => {
            const s = allSpeakers.get(id);
            if (!s) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 dark:bg-stone-800 pl-2 pr-1 py-1 text-xs"
              >
                <span className="text-stone-700 dark:text-stone-200">
                  {s.brand} {s.model}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  aria-label="remove"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-xs px-3 py-1.5 rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            {t.ladder.clearSelection}
          </button>
          {trueScaleHref && (
            <Link
              href={trueScaleHref}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-colors text-sm font-medium"
            >
              {t.nav.compareCta}
            </Link>
          )}
          {trueSpecsHref ? (
            <Link
              href={trueSpecsHref}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition-colors text-sm font-medium"
            >
              {t.nav.techSpecs}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-stone-300 text-white text-sm font-medium cursor-not-allowed"
            >
              {t.nav.techSpecs}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
