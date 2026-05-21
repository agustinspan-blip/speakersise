import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSpeakers, getSpeakerById } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";
import { ShareButton } from "@/components/ShareButton";
import { SiteHeader } from "@/components/SiteHeader";
import { CompareCTA } from "@/components/CompareCTA";
import { ShuffleButton } from "@/components/ShuffleButton";
import { NavCTAs } from "@/components/NavCTAs";
import { SpeakerPicker } from "@/components/SpeakerPicker";
import { ReferenceSelect } from "@/components/ReferenceSelect";
import { BrandStrip } from "@/components/BrandStrip";
import { ScaleDisclaimer } from "@/components/ScaleDisclaimer";
import {
  getDictionary,
  isLocale,
  defaultLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const COLOR_A = "#2563eb";
const COLOR_B = "#ea580c";
/**
 * Comparator render height on desktop. Drives all pixel-space math —
 * the cabinet SVGs, the ruler, the side-by-side gaps. On mobile we
 * down-scale the whole rendered block with a CSS transform (see the
 * `[--cmp-scale]` variable wired below) so the comparator fits in a
 * portrait viewport without horizontal scroll, while keeping the
 * SSR-friendly fixed-pixel math intact.
 */
const DISPLAY_HEIGHT_PX = 560;
/** CSS-variable name carrying the responsive scale factor. */
const SCALE_VAR = "--cmp-scale";
const OVERLAY_B_OPACITY = 0.45;
const SIDE_BY_SIDE_GAP_PX = 40;
const RULER_WIDTH_PX = 54;

type ViewMode = "overlay" | "side";
const PERSON_HEIGHT_OPTIONS_CM = [160, 165, 170, 175, 180, 185, 190] as const;
type PersonHeightCm = (typeof PERSON_HEIGHT_OPTIONS_CM)[number];
// Width-to-height ratio of the silhouette's tight bounding box (incl.
// shoulders). The SVG viewBox is cropped flush against the silhouette so
// the figure stands exactly on the floor line.
const PERSON_ASPECT = 740 / 2595;

function parsePersonHeight(
  raw: string | undefined
): PersonHeightCm | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return PERSON_HEIGHT_OPTIONS_CM.includes(n as PersonHeightCm)
    ? (n as PersonHeightCm)
    : null;
}

function fmtPersonHeight(cm: number, locale: Locale): string {
  const m = (cm / 100).toFixed(2);
  const formatted = locale === "es" ? m.replace(".", ",") : m;
  return `${formatted} m`;
}

type CurrencyId =
  | "usd"
  | "eur"
  | "cny"
  | "cad"
  | "aud"
  | "hkd"
  | "sgd"
  | "inr"
  | "rub";

const CURRENCY_IDS: readonly CurrencyId[] = [
  "usd",
  "eur",
  "cny",
  "cad",
  "aud",
  "hkd",
  "sgd",
  "inr",
  "rub",
] as const;

interface Currency {
  id: CurrencyId;
  /** Short display label for the dropdown (e.g. "USD $100"). */
  shortLabel: string;
  /**
   * Real banknote dimensions in millimetres, rotated 90° (vertical layout)
   * so the long axis is the height and the short axis is the width — same
   * convention as the imagery on disk.
   */
  heightMm: number;
  widthMm: number;
  src: string;
}

const CURRENCIES: Record<CurrencyId, Currency> = {
  usd: { id: "usd", shortLabel: "USD $100", widthMm: 66.3, heightMm: 156.1, src: "/references/usd-100.jpg" },
  eur: { id: "eur", shortLabel: "EUR €100", widthMm: 82, heightMm: 147, src: "/references/eur-100.jpg" },
  cny: { id: "cny", shortLabel: "CNY ¥100", widthMm: 77, heightMm: 155, src: "/references/cny-100.svg" },
  cad: { id: "cad", shortLabel: "CAD $100", widthMm: 69.85, heightMm: 152.4, src: "/references/cad-100.png" },
  aud: { id: "aud", shortLabel: "AUD $100", widthMm: 65, heightMm: 158, src: "/references/aud-100.jpg" },
  hkd: { id: "hkd", shortLabel: "HKD $100", widthMm: 77, heightMm: 153, src: "/references/hkd-100.jpg" },
  sgd: { id: "sgd", shortLabel: "SGD $100", widthMm: 77, heightMm: 162, src: "/references/sgd-100.jpg" },
  inr: { id: "inr", shortLabel: "INR ₹100", widthMm: 66, heightMm: 142, src: "/references/inr-100.png" },
  rub: { id: "rub", shortLabel: "RUB ₽100", widthMm: 65, heightMm: 150, src: "/references/rub-100.jpg" },
};

function parseCurrency(raw: string | undefined): CurrencyId | null {
  if (!raw) return null;
  return (CURRENCY_IDS as readonly string[]).includes(raw)
    ? (raw as CurrencyId)
    : null;
}

/**
 * Optical-media references — real circular objects that audiophiles can
 * eyeball faster than millimetres. `cd` is a Red Book audio CD (120 mm),
 * `vinyl` is a 12" LP (302 mm). Width = height since both are seen face-on.
 */
type DiscId = "cd" | "vinyl";
const DISC_IDS: readonly DiscId[] = ["cd", "vinyl"] as const;

interface Disc {
  id: DiscId;
  /** Translation key under `t.compare.discs.*` for the dropdown label. */
  labelKey: "cd" | "vinyl";
  /** Real diameter in millimetres (also used as both width and height). */
  diameterMm: number;
  src: string;
}

const DISCS: Record<DiscId, Disc> = {
  cd:    { id: "cd",    labelKey: "cd",    diameterMm: 120, src: "/references/cd.svg" },
  vinyl: { id: "vinyl", labelKey: "vinyl", diameterMm: 302, src: "/references/vinyl-lp.svg" },
};

function parseDisc(raw: string | undefined): DiscId | null {
  if (!raw) return null;
  return (DISC_IDS as readonly string[]).includes(raw)
    ? (raw as DiscId)
    : null;
}

function makeDiscReference(disc: Disc, label: string): Reference {
  return {
    heightMm: disc.diameterMm,
    widthMm: disc.diameterMm,
    src: disc.src,
    alt: label,
  };
}

interface Reference {
  /** True real-world dimensions in millimetres. */
  heightMm: number;
  widthMm: number;
  src: string;
  alt: string;
}

function makePersonReference(
  heightCm: PersonHeightCm,
  altLabel: string
): Reference {
  const heightMm = heightCm * 10;
  return {
    heightMm,
    widthMm: heightMm * PERSON_ASPECT,
    src: "/references/man.svg",
    alt: altLabel,
  };
}

function makeCurrencyReference(currency: Currency): Reference {
  return {
    heightMm: currency.heightMm,
    widthMm: currency.widthMm,
    src: currency.src,
    alt: currency.shortLabel,
  };
}

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  ) as [string, string][];
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

function compareHref(
  base: {
    a?: string;
    b?: string;
    view?: ViewMode;
    person?: PersonHeightCm | null;
    currency?: CurrencyId | null;
    disc?: DiscId | null;
  },
  locale: Locale
): string {
  return (
    `/${locale}/compare` +
    buildQuery({
      a: base.a,
      b: base.b,
      view: base.view === "overlay" ? "overlay" : undefined,
      person: base.person ? String(base.person) : undefined,
      currency: base.currency ?? undefined,
      disc: base.disc ?? undefined,
    })
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    a?: string;
    b?: string;
    view?: string;
    person?: string;
    currency?: string;
    disc?: string;
  }>;
}

/**
 * Per-comparison Open Graph metadata. WhatsApp / Twitter / Slack will
 * unfurl shared links into a card that uses our dynamic OG image, which
 * shows both selected speakers side-by-side at true scale. The image
 * itself lives at /api/og/compare and reads `a`/`b` from the URL query.
 */
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<import("next").Metadata> {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const a = sp.a ? getSpeakerById(sp.a) : undefined;
  const b = sp.b ? getSpeakerById(sp.b) : undefined;

  // Title & description fall back to a generic compare card when ids
  // are missing or invalid — matches the OG image's GenericCard branch.
  const haveBoth = !!a && !!b;
  const title = haveBoth
    ? `${a.brand} ${a.model} vs ${b.brand} ${b.model} · TrueScale`
    : "TrueScale · Compare speakers at true scale";
  const description = haveBoth
    ? `Side-by-side at true scale: ${a.dimensions.heightMm} mm vs ${b.dimensions.heightMm} mm tall. Compare dimensions, drivers, and frequency response.`
    : "Compare two HiFi speakers side-by-side at true scale, with optional human and banknote references.";

  // Build the OG image URL — only pass a/b through (the image doesn't
  // care about view/person/currency). Use a relative URL; the platform
  // resolves it against metadataBase configured in the root layout.
  const qs = new URLSearchParams();
  if (sp.a) qs.set("a", sp.a);
  if (sp.b) qs.set("b", sp.b);
  const qsStr = qs.toString();
  const ogUrl = `/api/og/compare${qsStr ? `?${qsStr}` : ""}`;

  // hreflang: same compare URL per locale, preserving a/b ids so each
  // language variant points at the same comparison.
  const comparePath = `/compare${qsStr ? `?${qsStr}` : ""}`;
  const canonical = `${SITE_URL}/${raw}${comparePath}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${SITE_URL}/${l}${comparePath}`;
  }
  languages["x-default"] = `${SITE_URL}/${defaultLocale}${comparePath}`;
  const alternateLocale = locales
    .filter((l) => l !== raw)
    .map((l) => (l === "es" ? "es_AR" : "en_US"));

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      locale: raw === "es" ? "es_AR" : "en_US",
      alternateLocale,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const sp = await searchParams;
  const speakers = getAllSpeakers();
  const a = sp.a ? getSpeakerById(sp.a) : undefined;
  const b = sp.b ? getSpeakerById(sp.b) : undefined;
  // Track ids that were provided in the URL but don't exist in the catalog.
  // These get surfaced in an inline error so users don't lose context after
  // bookmarking a stale or mistyped link.
  const unknownIds: string[] = [];
  if (sp.a && !a) unknownIds.push(sp.a);
  if (sp.b && !b) unknownIds.push(sp.b);
  // Default to side-by-side. Overlay only when explicitly requested.
  const view: ViewMode = sp.view === "overlay" ? "overlay" : "side";
  const personHeight = parsePersonHeight(sp.person);
  const currency = parseCurrency(sp.currency);
  const disc = parseDisc(sp.disc);

  // Build the active reference list from the user selections.
  const refs: Reference[] = [];
  if (personHeight) refs.push(makePersonReference(personHeight, t.compare.refMan));
  if (currency) refs.push(makeCurrencyReference(CURRENCIES[currency]));
  if (disc) refs.push(makeDiscReference(DISCS[disc], t.compare.discs[DISCS[disc].labelKey]));

  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  // ShuffleButton needs the catalog bucketed by type so it can pick a
  // same-type random pair on the client without re-parsing all speakers.
  // Compute once on the server, pass down as a small JSON payload.
  const idsByType = {
    bookshelf: speakers.filter((s) => s.type === "bookshelf").map((s) => s.id),
    floorstander: speakers.filter((s) => s.type === "floorstander").map((s) => s.id),
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col pb-24 sm:pb-0">
      <SiteHeader locale={locale} t={t} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10 space-y-10">
        <NavCTAs locale={locale} t={t} />
        <form
          method="get"
          className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        >
          <input type="hidden" name="view" value={view} />
          <SpeakerPicker
            name="a"
            label={t.compare.speakerA}
            pickBrandLabel={t.compare.pickBrand}
            pickTypeLabel={t.compare.pickType}
            pickSpeakerLabel={t.compare.pickSpeaker}
            bookshelfLabel={t.catalog.bookshelf}
            floorstanderLabel={t.catalog.floorstander}
            options={speakers}
            selected={a?.id}
          />
          <SpeakerPicker
            name="b"
            label={t.compare.speakerB}
            pickBrandLabel={t.compare.pickBrand}
            pickTypeLabel={t.compare.pickType}
            pickSpeakerLabel={t.compare.pickSpeaker}
            bookshelfLabel={t.catalog.bookshelf}
            floorstanderLabel={t.catalog.floorstander}
            options={speakers}
            selected={b?.id}
          />
          {/*
            The two SpeakerPicker columns are fieldsets with a `legend`
            above their first select, so visually their dropdowns sit
            ~20 px below the cell top. Wrap the action row in a div with
            an invisible spacer that mirrors the legend's height + bottom
            margin — that way the buttons align with the brand select
            automatically, no magic mt-[Npx] to drift if the legend's
            text-size or spacing changes.
          */}
          <div>
            <span
              aria-hidden
              className="block text-xs font-medium mb-1 invisible select-none"
            >
              &nbsp;
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition-colors text-sm font-medium w-full sm:w-auto"
              >
                {t.compare.compareButton}
              </button>
              <ShuffleButton
                locale={locale}
                t={t}
                target="compare"
                count={2}
                idsByType={idsByType}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </form>

        {unknownIds.length > 0 && (
          <div
            role="alert"
            className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            <p>
              <span className="font-medium">{t.compare.unknownIds}</span>{" "}
              <code className="font-mono text-[0.85em]">
                {unknownIds.join(", ")}
              </code>
            </p>
            <p className="mt-1 text-amber-800/80 dark:text-amber-300/80">
              {t.compare.unknownIdsHint}
            </p>
          </div>
        )}

        {a && b ? (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <ViewTabs
                a={a}
                b={b}
                active={view}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                locale={locale}
                t={t}
              />
              <ShareButton t={t} />
            </div>
            <ReferencePickers
              a={a}
              b={b}
              view={view}
              personHeight={personHeight}
              currency={currency}
              disc={disc}
              locale={locale}
              t={t}
            />
            {view === "side" ? (
              <FrontSideBySide
                a={a}
                b={b}
                refs={refs}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                locale={locale}
                t={t}
              />
            ) : (
              <FrontOverlay
                a={a}
                b={b}
                refs={refs}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                locale={locale}
                t={t}
              />
            )}
            <ScaleDisclaimer t={t} />
            <SpecsComparison a={a} b={b} t={t} />
          </>
        ) : (
          <p className="text-sm text-stone-500">{t.compare.pickTwo}</p>
        )}
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />

      <CompareCTA locale={locale} t={t} mode="to-compare4" />
    </div>
  );
}

function ViewTabs({
  a,
  b,
  active,
  personHeight,
  currency,
  disc,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  active: ViewMode;
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  locale: Locale;
  t: Dictionary;
}) {
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "overlay", label: t.compare.tabOverlay },
    { key: "side", label: t.compare.tabSide },
  ];
  return (
    <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800">
      {tabs.map((tab) => {
        const href = compareHref(
          {
            a: a.id,
            b: b.id,
            view: tab.key,
            person: personHeight,
            currency,
            disc,
          },
          locale
        );
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-amber-600 text-stone-900 dark:border-amber-500 dark:text-stone-100"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function swapHref(
  a: Speaker,
  b: Speaker,
  view: ViewMode,
  personHeight: PersonHeightCm | null,
  currency: CurrencyId | null,
  disc: DiscId | null,
  locale: Locale
): string {
  return compareHref(
    {
      a: b.id,
      b: a.id,
      view,
      person: personHeight,
      currency,
      disc,
    },
    locale
  );
}

function FrontOverlay({
  a,
  b,
  refs,
  personHeight,
  currency,
  disc,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  refs: Reference[];
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  locale: Locale;
  t: Dictionary;
}) {
  // A reference (person/banknote) can be taller than the speakers; when so,
  // it dominates the shared scale and visually shrinks the speakers — the
  // intended "see how small the speaker is next to a person" effect.
  const maxHeightMm = Math.max(
    a.dimensions.heightMm,
    b.dimensions.heightMm,
    ...refs.map((r) => r.heightMm)
  );
  const maxWidthMm = Math.max(a.dimensions.widthMm, b.dimensions.widthMm);
  const scale = DISPLAY_HEIGHT_PX / maxHeightMm;
  const overlayBlockPx = maxWidthMm * scale + 48;
  const refsTotalPx = refs.reduce(
    (acc, r) => acc + r.widthMm * scale + SIDE_BY_SIDE_GAP_PX,
    0
  );
  const contentWidthPx = overlayBlockPx + refsTotalPx;
  const totalWidthPx = contentWidthPx + RULER_WIDTH_PX;
  const swap = swapHref(a, b, "overlay", personHeight, currency, disc, locale);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {t.compare.headingOverlay}
        </h2>
        <Legend a={a} b={b} />
      </div>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white p-3 sm:p-6 overflow-x-auto">
        {/*
          Responsive scaler: on mobile (<sm) the entire fixed-pixel
          comparator is visually scaled to ~60% via CSS transform, with
          the wrapper's calc-based width/height shrinking the reserved
          layout box to match. On sm+ the variable resolves to 1 and the
          transform/calcs collapse to no-ops. Keeps the SSR math intact
          while making the block fit on a 360-414 px portrait viewport.
        */}
        <div
          className="mx-auto [--cmp-scale:0.62] sm:[--cmp-scale:1]"
          style={{
            width: `calc(${totalWidthPx}px * var(${SCALE_VAR}))`,
            height: `calc(${DISPLAY_HEIGHT_PX}px * var(${SCALE_VAR}))`,
          }}
        >
        <div
          className="relative flex items-end origin-top-left"
          style={{
            height: `${DISPLAY_HEIGHT_PX}px`,
            width: `${totalWidthPx}px`,
            transform: `scale(var(${SCALE_VAR}))`,
          }}
        >
          <Ruler maxHeightMm={maxHeightMm} scale={scale} />
          <div
            className="flex items-end"
            style={{
              height: `${DISPLAY_HEIGHT_PX}px`,
              width: `${contentWidthPx}px`,
              gap: `${SIDE_BY_SIDE_GAP_PX}px`,
            }}
          >
            <div
              className="relative shrink-0"
              style={{
                height: `${DISPLAY_HEIGHT_PX}px`,
                width: `${overlayBlockPx}px`,
              }}
            >
              <Link href={swap} aria-label={t.compare.swapAriaLabel} title={t.compare.swapTitle}>
                <SpeakerCabinet
                  speaker={a}
                  scale={scale}
                  opacity={1}
                  outlineColor={COLOR_A}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                    cursor: "pointer",
                  }}
                />
              </Link>
              <Link href={swap} aria-label={t.compare.swapAriaLabel} title={t.compare.swapTitle}>
                <SpeakerCabinet
                  speaker={b}
                  scale={scale}
                  opacity={OVERLAY_B_OPACITY}
                  outlineColor={COLOR_B}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    cursor: "pointer",
                  }}
                />
              </Link>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-stone-300 dark:bg-stone-700"
              />
            </div>
            {refs.map((r, i) => (
              <ReferenceItem key={i} reference={r} scale={scale} />
            ))}
          </div>
        </div>
        </div>
        <p className="mt-4 text-xs text-stone-500 text-center">
          {t.compare.swapHint} · {t.compare.referenceHeight} {maxHeightMm} mm (
          {(maxHeightMm / 10).toFixed(1)} cm) · 1 mm = {scale.toFixed(2)} px
        </p>
      </div>
    </section>
  );
}

function FrontSideBySide({
  a,
  b,
  refs,
  personHeight,
  currency,
  disc,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  refs: Reference[];
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  locale: Locale;
  t: Dictionary;
}) {
  const maxHeightMm = Math.max(
    a.dimensions.heightMm,
    b.dimensions.heightMm,
    ...refs.map((r) => r.heightMm)
  );
  const scale = DISPLAY_HEIGHT_PX / maxHeightMm;
  const widthsMm =
    a.dimensions.widthMm +
    b.dimensions.widthMm +
    refs.reduce((acc, r) => acc + r.widthMm, 0);
  const itemCount = 2 + refs.length;
  const contentWidthPx =
    widthsMm * scale + SIDE_BY_SIDE_GAP_PX * (itemCount - 1) + 48;
  const totalWidthPx = contentWidthPx + RULER_WIDTH_PX;
  const swap = swapHref(a, b, "side", personHeight, currency, disc, locale);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {t.compare.headingSide}
        </h2>
        <Legend a={a} b={b} />
      </div>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white p-3 sm:p-6 overflow-x-auto">
        {/* Same responsive scaler as the Overlay view — see the comment
            block in the Overlay branch for the rationale. */}
        <div
          className="mx-auto [--cmp-scale:0.62] sm:[--cmp-scale:1]"
          style={{
            width: `calc(${totalWidthPx}px * var(${SCALE_VAR}))`,
            height: `calc(${DISPLAY_HEIGHT_PX}px * var(${SCALE_VAR}))`,
          }}
        >
        <div
          className="relative flex items-end origin-top-left"
          style={{
            height: `${DISPLAY_HEIGHT_PX}px`,
            width: `${totalWidthPx}px`,
            transform: `scale(var(${SCALE_VAR}))`,
          }}
        >
          <Ruler maxHeightMm={maxHeightMm} scale={scale} />
          <div
            className="relative flex items-end justify-center"
            style={{
              height: `${DISPLAY_HEIGHT_PX}px`,
              width: `${contentWidthPx}px`,
              gap: `${SIDE_BY_SIDE_GAP_PX}px`,
            }}
          >
            <Link href={swap} title={t.compare.swapTitle}>
              <SpeakerCabinet
                speaker={a}
                scale={scale}
                opacity={1}
                outlineColor={COLOR_A}
                style={{ cursor: "pointer" }}
              />
            </Link>
            <Link href={swap} title={t.compare.swapTitle}>
              <SpeakerCabinet
                speaker={b}
                scale={scale}
                opacity={1}
                outlineColor={COLOR_B}
                style={{ cursor: "pointer" }}
              />
            </Link>
            {refs.map((r, i) => (
              <ReferenceItem key={i} reference={r} scale={scale} />
            ))}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-stone-300 dark:bg-stone-700"
            />
          </div>
        </div>
        </div>
        <p className="mt-4 text-xs text-stone-500 text-center">
          {t.compare.swapHint} · {t.compare.referenceHeight} {maxHeightMm} mm (
          {(maxHeightMm / 10).toFixed(1)} cm) · 1 mm = {scale.toFixed(2)} px
        </p>
      </div>
    </section>
  );
}

function ReferencePickers({
  a,
  b,
  view,
  personHeight,
  currency,
  disc,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  view: ViewMode;
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  locale: Locale;
  t: Dictionary;
}) {
  // Pre-compute hrefs server-side: client component can only receive plain
  // serialisable props (functions can't cross the boundary).
  const personOptions = [
    {
      value: "",
      label: t.compare.refPersonOff,
      href: compareHref(
        { a: a.id, b: b.id, view, person: null, currency, disc },
        locale
      ),
    },
    ...PERSON_HEIGHT_OPTIONS_CM.map((cm) => ({
      value: String(cm),
      label: `${t.compare.refMan} — ${fmtPersonHeight(cm, locale)}`,
      href: compareHref(
        { a: a.id, b: b.id, view, person: cm, currency, disc },
        locale
      ),
    })),
  ];
  const currencyOptions = [
    {
      value: "",
      label: t.compare.refCurrencyOff,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency: null, disc },
        locale
      ),
    },
    ...CURRENCY_IDS.map((id) => ({
      value: id,
      label: CURRENCIES[id].shortLabel,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency: id, disc },
        locale
      ),
    })),
  ];
  const discOptions = [
    {
      value: "",
      label: t.compare.refDiscOff,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency, disc: null },
        locale
      ),
    },
    ...DISC_IDS.map((id) => ({
      value: id,
      label: t.compare.discs[DISCS[id].labelKey],
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency, disc: id },
        locale
      ),
    })),
  ];

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <span className="text-xs uppercase tracking-wider text-stone-500 self-center">
        {t.compare.references}
      </span>
      <ReferenceSelect
        label={t.compare.personLabel}
        currentValue={personHeight ? String(personHeight) : ""}
        options={personOptions}
      />
      <ReferenceSelect
        label={t.compare.currencyLabel}
        currentValue={currency ?? ""}
        options={currencyOptions}
      />
      <ReferenceSelect
        label={t.compare.discLabel}
        currentValue={disc ?? ""}
        options={discOptions}
      />
    </div>
  );
}

function ReferenceItem({
  reference,
  scale,
}: {
  reference: Reference;
  scale: number;
}) {
  const widthPx = reference.widthMm * scale;
  const heightPx = reference.heightMm * scale;
  return (
    <div
      className="shrink-0 relative"
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
      }}
      aria-label={reference.alt}
      title={reference.alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reference.src}
        alt={reference.alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

function Ruler({
  maxHeightMm,
  scale,
}: {
  maxHeightMm: number;
  scale: number;
}) {
  const stepMm = maxHeightMm > 800 ? 200 : maxHeightMm > 400 ? 100 : 50;
  const marks: number[] = [];
  for (let mm = 0; mm <= maxHeightMm + 1; mm += stepMm) marks.push(mm);

  return (
    <div
      aria-hidden
      className="relative shrink-0 text-[10px] text-stone-500"
      style={{
        width: `${RULER_WIDTH_PX}px`,
        height: `${DISPLAY_HEIGHT_PX}px`,
      }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-px bg-stone-300 dark:bg-stone-700"
        aria-hidden
      />
      {marks.map((mm) => {
        const bottomPx = mm * scale;
        return (
          <div
            key={mm}
            className="absolute right-0 flex items-center gap-1"
            style={{ bottom: `${bottomPx - 6}px` }}
          >
            <span className="tabular-nums whitespace-nowrap pr-1">
              {mm / 10} cm
            </span>
            <span
              className="inline-block h-px bg-stone-400 dark:bg-stone-600"
              style={{ width: "6px" }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SpeakerCabinet({
  speaker,
  scale,
  opacity = 1,
  outlineColor,
  style,
}: {
  speaker: Speaker;
  scale: number;
  opacity?: number;
  outlineColor: string;
  style?: React.CSSProperties;
}) {
  const widthPx = speaker.dimensions.widthMm * scale;
  const heightPx = speaker.dimensions.heightMm * scale;
  const src = speaker.images.front ?? speaker.images.hero;
  if (!src) return null;
  return (
    <div
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        opacity,
        outline: `1.5px solid ${outlineColor}`,
        outlineOffset: "0px",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${speaker.brand} ${speaker.model} front view`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
        }}
      />
    </div>
  );
}

function Legend({ a, b }: { a: Speaker; b: Speaker }) {
  return (
    <div className="flex gap-4 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ backgroundColor: COLOR_A, opacity: 0.5 }}
          aria-hidden
        />
        <span className="font-medium" style={{ color: COLOR_A }}>
          A
        </span>
        <span className="text-stone-500">
          {a.brand} {a.model}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ backgroundColor: COLOR_B, opacity: 0.5 }}
          aria-hidden
        />
        <span className="font-medium" style={{ color: COLOR_B }}>
          B
        </span>
        <span className="text-stone-500">
          {b.brand} {b.model}
        </span>
      </span>
    </div>
  );
}

function SpecsComparison({
  a,
  b,
  t,
}: {
  a: Speaker;
  b: Speaker;
  t: Dictionary;
}) {
  const fmtRange = (r: { min?: number; max: number }, unit: string) =>
    r.min !== undefined ? `${r.min}–${r.max} ${unit}` : `${r.max} ${unit}`;
  const fmtDrivers = (s: Speaker) =>
    s.drivers
      .map(
        (d) =>
          `${d.quantity ?? 1}× ${d.sizeMm > 0 ? `${d.sizeMm} mm ` : ""}${d.role}${d.material ? ` (${d.material})` : ""}`
      )
      .join(", ");

  const extLink = (url: string, text: string) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline dark:text-blue-400 break-all"
    >
      {text} ↗
    </a>
  );
  const manufacturerLink = (s: Speaker) => {
    try {
      const origin = new URL(s.sourceUrl).origin;
      const host = new URL(origin).hostname.replace(/^www\./, "");
      return extLink(origin, host);
    } catch {
      return "—";
    }
  };

  type Row = [string, React.ReactNode, React.ReactNode, number?, number?];
  const rows: Row[] = [
    [
      t.specs.model,
      `${a.brand} ${a.model}${a.generation ? ` ${a.generation}` : ""}`,
      `${b.brand} ${b.model}${b.generation ? ` ${b.generation}` : ""}`,
    ],
    [
      t.specs.height,
      `${a.dimensions.heightMm} mm`,
      `${b.dimensions.heightMm} mm`,
      a.dimensions.heightMm,
      b.dimensions.heightMm,
    ],
    [
      t.specs.width,
      `${a.dimensions.widthMm} mm`,
      `${b.dimensions.widthMm} mm`,
      a.dimensions.widthMm,
      b.dimensions.widthMm,
    ],
    [
      t.specs.depth,
      `${a.dimensions.depthMm} mm`,
      `${b.dimensions.depthMm} mm`,
      a.dimensions.depthMm,
      b.dimensions.depthMm,
    ],
    [
      t.specs.weight,
      `${a.dimensions.weightKg} kg`,
      `${b.dimensions.weightKg} kg`,
      a.dimensions.weightKg,
      b.dimensions.weightKg,
    ],
    [t.specs.enclosure, a.enclosure ?? "—", b.enclosure ?? "—"],
    [t.specs.drivers, fmtDrivers(a), fmtDrivers(b)],
    [
      t.specs.frequencyLow,
      `${a.frequencyResponseHz.min ?? "—"} Hz`,
      `${b.frequencyResponseHz.min ?? "—"} Hz`,
      a.frequencyResponseHz.min !== undefined ? -a.frequencyResponseHz.min : undefined,
      b.frequencyResponseHz.min !== undefined ? -b.frequencyResponseHz.min : undefined,
    ],
    [
      t.specs.frequencyHigh,
      `${a.frequencyResponseHz.max} Hz`,
      `${b.frequencyResponseHz.max} Hz`,
      a.frequencyResponseHz.max,
      b.frequencyResponseHz.max,
    ],
    [
      t.specs.sensitivity,
      a.sensitivityDb ? `${a.sensitivityDb} dB` : "—",
      b.sensitivityDb ? `${b.sensitivityDb} dB` : "—",
      a.sensitivityDb,
      b.sensitivityDb,
    ],
    [
      t.specs.impedance,
      a.impedanceOhm ? `${a.impedanceOhm} Ω` : "—",
      b.impedanceOhm ? `${b.impedanceOhm} Ω` : "—",
    ],
    [
      t.specs.recommendedAmp,
      a.recommendedAmpW ? fmtRange(a.recommendedAmpW, "W") : "—",
      b.recommendedAmpW ? fmtRange(b.recommendedAmpW, "W") : "—",
      a.recommendedAmpW?.max,
      b.recommendedAmpW?.max,
    ],
    [t.specs.manufacturer, manufacturerLink(a), manufacturerLink(b)],
    [
      t.specs.productPage,
      extLink(a.sourceUrl, t.specs.openProductPage),
      extLink(b.sourceUrl, t.specs.openProductPage),
    ],
  ];

  const diffClass = (mine?: number, other?: number, isLarger?: boolean) => {
    if (
      typeof mine !== "number" ||
      typeof other !== "number" ||
      mine === other
    )
      return "";
    const amLarger = mine > other;
    return amLarger === isLarger
      ? "font-semibold bg-emerald-50 dark:bg-emerald-950/40"
      : "text-stone-500";
  };

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-stone-600 dark:text-stone-400">
        {t.specs.title}
      </h2>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-900/50 text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-2 text-left font-medium w-40"></th>
              <th className="px-4 py-2 text-left font-medium">
                <span style={{ color: COLOR_A }}>A</span>
              </th>
              <th className="px-4 py-2 text-left font-medium border-l border-stone-100 dark:border-stone-800">
                <span style={{ color: COLOR_B }}>B</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, av, bv, na, nb]) => (
              <tr
                key={label}
                className="border-t border-stone-100 dark:border-stone-800"
              >
                <th className="px-4 py-3 text-left font-normal text-stone-500">
                  {label}
                </th>
                <td className={`px-4 py-3 ${diffClass(na, nb, true)}`}>{av}</td>
                <td
                  className={`px-4 py-3 border-l border-stone-100 dark:border-stone-800 ${diffClass(nb, na, true)}`}
                >
                  {bv}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-2 text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
          {t.specs.diffNote}
        </p>
      </div>
    </section>
  );
}
