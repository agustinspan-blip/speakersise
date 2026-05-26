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
import { JsonLd } from "@/components/JsonLd";
import { UnitsToggle } from "@/components/UnitsToggle";
import {
  getDictionary,
  isLocale,
  defaultLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import {
  formatDriverSizeMm,
  formatLengthMm,
  formatWeightKg,
  parseUnits,
  type UnitSystem,
} from "@/lib/units";

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

type ViewMode = "overlay" | "side" | "profile";
/**
 * Within the Profile view, the user can choose how the two overlaid
 * cabinets line up horizontally. Mirrors the carsized.com pattern.
 * Convention for our side photos (Paradigm Founder line): the speaker
 * faces left, so the *front* of the cabinet is the LEFT edge of the
 * image and the *back* is the right edge.
 */
type ProfileAlign = "sideBySide" | "front" | "center" | "back";
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
    align?: ProfileAlign;
    person?: PersonHeightCm | null;
    currency?: CurrencyId | null;
    disc?: DiscId | null;
    units?: UnitSystem;
    /** When true, append `present=1` so internal links keep the user
     *  inside presentation mode while they switch tabs, swap, etc. */
    present?: boolean;
  },
  locale: Locale
): string {
  return (
    `/${locale}/compare` +
    buildQuery({
      a: base.a,
      b: base.b,
      // Serialize any non-default view ("overlay" or "profile"); leave
      // "side" out of the URL since it's the implicit fallback the
      // server applies when `view` is missing or invalid.
      view: base.view && base.view !== "side" ? base.view : undefined,
      // Same trick for `align`: only serialise when explicitly non-default
      // (default is "sideBySide") so the URL stays minimal.
      align:
        base.view === "profile" && base.align && base.align !== "sideBySide"
          ? base.align
          : undefined,
      person: base.person ? String(base.person) : undefined,
      currency: base.currency ?? undefined,
      disc: base.disc ?? undefined,
      // Only serialise when imperial — metric is the implicit default,
      // mirroring the same "omit defaults" pattern used by `view`/`align`.
      units: base.units === "imperial" ? "imperial" : undefined,
      present: base.present ? "1" : undefined,
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
    align?: string;
    person?: string;
    currency?: string;
    disc?: string;
    units?: string;
    present?: string;
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
  // The profile view (side images of each cabinet rendered at true scale
  // using `depthMm` as the horizontal axis) is only enabled when both
  // selected speakers carry an `images.side` asset. Today only the
  // Paradigm Founder line ships with side photography; the tab is hidden
  // entirely for any other pair so the UI doesn't tease an unavailable
  // mode.
  const profileAvailable = Boolean(a?.images.side && b?.images.side);
  // Default to side-by-side. Overlay or profile only when explicitly
  // requested AND (for profile) when both speakers can render in that mode.
  const view: ViewMode =
    sp.view === "overlay"
      ? "overlay"
      : sp.view === "profile" && profileAvailable
        ? "profile"
        : "side";
  // Profile alignment — defaults to side-by-side (no overlap); only
  // honoured when the active view is profile.
  const align: ProfileAlign =
    sp.align === "front" ||
    sp.align === "back" ||
    sp.align === "center"
      ? sp.align
      : "sideBySide";
  const personHeight = parsePersonHeight(sp.person);
  const currency = parseCurrency(sp.currency);
  const disc = parseDisc(sp.disc);
  const units = parseUnits(sp.units);
  // Presentation mode: a `?present=1` flag strips the page down to
  // just the comparator visualisation — useful for HiFi-store demos
  // or YouTube reviews where the SiteHeader, picker form, specs
  // table and footer chrome would crowd the frame.
  const presentMode = sp.present === "1";

  // Build the active reference list from the user selections.
  const refs: Reference[] = [];
  if (personHeight) refs.push(makePersonReference(personHeight, t.compare.refMan));
  if (currency) refs.push(makeCurrencyReference(CURRENCIES[currency]));
  if (disc) refs.push(makeDiscReference(DISCS[disc], t.compare.discs[DISCS[disc].labelKey]));

  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  // ShuffleButton needs the catalog bucketed by type so it can pick a
  // same-type random pair on the client without re-parsing all speakers.
  // Compute once on the server, pass down as a small JSON payload.
  // The hybrid bucket today carries just two models (Paradigm Persona 9H
  // + Founder 120H) so Shuffle there only ever yields that one pair —
  // intentional: hybrids are physically different beasts and shouldn't
  // be mixed with regular floorstanders in a same-type comparison.
  const idsByType = {
    bookshelf: speakers.filter((s) => s.type === "bookshelf").map((s) => s.id),
    floorstander: speakers.filter((s) => s.type === "floorstander").map((s) => s.id),
    hybrid: speakers.filter((s) => s.type === "hybrid").map((s) => s.id),
  };

  // Compare-page structured data. When both speakers are selected we
  // emit a BreadcrumbList (Home → Compare → "A vs B") plus an ItemList
  // wrapping minimal Product references — the per-speaker pages carry
  // the full Product schema, this just lets Google connect the dots.
  const compareJsonLd =
    a && b
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "TrueScale",
                  item: `${SITE_URL}/${locale}`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Compare",
                  item: `${SITE_URL}/${locale}/compare`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: `${a.brand} ${a.model} vs ${b.brand} ${b.model}`,
                },
              ],
            },
            {
              "@type": "ItemList",
              name: `${a.brand} ${a.model} vs ${b.brand} ${b.model}`,
              numberOfItems: 2,
              itemListElement: [a, b].map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Product",
                  name: `${s.brand} ${s.model}`,
                  brand: { "@type": "Brand", name: s.brand },
                  url: `${SITE_URL}/${locale}/speaker/${s.id}`,
                },
              })),
            },
          ],
        }
      : null;

  // In presentation mode we strip the site chrome (header, footer, CTA
  // floater) plus the picker form, specs table and disclaimer — only
  // the comparator visualisation plus a compact ViewTabs row stays.
  // A floating Exit pill sits top-right with the inverse URL so the
  // user can return to the regular view with one click.
  const exitPresentHref = compareHref(
    {
      a: a?.id,
      b: b?.id,
      view,
      align,
      person: personHeight,
      currency,
      disc,
      units,
      present: false,
    },
    locale
  );
  const enterPresentHref = compareHref(
    {
      a: a?.id,
      b: b?.id,
      view,
      align,
      person: personHeight,
      currency,
      disc,
      units,
      present: true,
    },
    locale
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {compareJsonLd && <JsonLd data={compareJsonLd} />}
      {!presentMode && <SiteHeader locale={locale} t={t} />}

      <main
        className={
          presentMode
            ? "flex-1 mx-auto max-w-6xl w-full px-6 py-6 space-y-6"
            : "flex-1 mx-auto max-w-6xl w-full px-6 py-10 space-y-10"
        }
      >
        {presentMode && (
          // Floating exit pill — top-right, semi-transparent so it
          // doesn't compete with the comparator for attention.
          <Link
            href={exitPresentHref}
            className="fixed top-4 right-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-stone-900/85 dark:bg-stone-100/85 text-white dark:text-stone-900 px-4 py-2 text-xs font-medium backdrop-blur shadow-lg hover:bg-stone-900 dark:hover:bg-stone-100 transition-colors"
            aria-label={t.compare.exitPresentation}
            title={t.compare.exitPresentation}
          >
            <ExitFullscreenIcon />
            {t.compare.exitPresentation}
          </Link>
        )}
        {!presentMode && <NavCTAs locale={locale} t={t} />}
        {!presentMode && (
        <form
          method="get"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <input type="hidden" name="view" value={view} />
          {/* Preserve the units selection when the form is re-submitted
              via the Compare button (default omitted to keep URLs short). */}
          {units !== "metric" && (
            <input type="hidden" name="units" value={units} />
          )}
          <SpeakerPicker
            name="a"
            label={t.compare.speakerA}
            pickBrandLabel={t.compare.pickBrand}
            pickTypeLabel={t.compare.pickType}
            pickSpeakerLabel={t.compare.pickSpeaker}
            typeLabels={{
              bookshelf: t.catalog.bookshelf,
              floorstander: t.catalog.floorstander,
              hybrid: t.catalog.hybrid,
            }}
            sideViewLabel={t.detail.sideViewAvailable}
            options={speakers}
            selected={a?.id}
          />
          <SpeakerPicker
            name="b"
            label={t.compare.speakerB}
            pickBrandLabel={t.compare.pickBrand}
            pickTypeLabel={t.compare.pickType}
            pickSpeakerLabel={t.compare.pickSpeaker}
            typeLabels={{
              bookshelf: t.catalog.bookshelf,
              floorstander: t.catalog.floorstander,
              hybrid: t.catalog.hybrid,
            }}
            sideViewLabel={t.detail.sideViewAvailable}
            options={speakers}
            selected={b?.id}
          />
          {/*
            Action row sits below the speaker pickers, spanning the full
            width on sm+. Visual style matches /compare4 verbatim so the
            two comparator pages feel like one product.
          */}
          <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              className="h-10 px-5 rounded-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition-colors text-sm font-medium"
            >
              {t.compare.compareButton}
            </button>
            <ShuffleButton
              locale={locale}
              t={t}
              target="compare"
              count={2}
              idsByType={idsByType}
            />
          </div>
        </form>
        )}

        {!presentMode && unknownIds.length > 0 && (
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
                units={units}
                present={presentMode}
                locale={locale}
                t={t}
              />
              {!presentMode && (
                <div className="flex items-center gap-3">
                  <Link
                    href={enterPresentHref}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                    aria-label={t.compare.enterPresentation}
                    title={t.compare.enterPresentation}
                  >
                    <EnterFullscreenIcon />
                    {t.compare.enterPresentation}
                  </Link>
                  <ShareButton t={t} />
                </div>
              )}
            </div>
            {/*
              Reference pickers (person / banknote / disc) only make sense
              for the front views — in profile the references aren't
              rendered alongside the cabinets, so the form would dangle
              with no visible effect on the diagram. In presentation mode
              they're also suppressed so the demo stays focused on the
              comparator block.
            */}
            {view !== "profile" && !presentMode && (
              <ReferencePickers
                a={a}
                b={b}
                view={view}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                units={units}
                present={presentMode}
                locale={locale}
                t={t}
              />
            )}
            {view === "overlay" && (
              <FrontOverlay
                a={a}
                b={b}
                refs={refs}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                units={units}
                present={presentMode}
                locale={locale}
                t={t}
              />
            )}
            {view === "side" && (
              <FrontSideBySide
                a={a}
                b={b}
                refs={refs}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                units={units}
                present={presentMode}
                locale={locale}
                t={t}
              />
            )}
            {view === "profile" && (
              <ProfileOverlay
                a={a}
                b={b}
                align={align}
                personHeight={personHeight}
                currency={currency}
                disc={disc}
                units={units}
                present={presentMode}
                locale={locale}
                t={t}
              />
            )}
            {!presentMode && <ScaleDisclaimer t={t} />}
            {!presentMode && (
            <SpecsComparison
              a={a}
              b={b}
              t={t}
              units={units}
              metricHref={compareHref(
                { a: a.id, b: b.id, view, align, person: personHeight, currency, disc, units: "metric" },
                locale
              )}
              imperialHref={compareHref(
                { a: a.id, b: b.id, view, align, person: personHeight, currency, disc, units: "imperial" },
                locale
              )}
            />
            )}
          </>
        ) : (
          <p className="text-sm text-stone-500">{t.compare.pickTwo}</p>
        )}
      </main>

      {!presentMode && <BrandStrip brands={brands} locale={locale} t={t} />}

      {!presentMode && <CompareCTA locale={locale} t={t} mode="to-compare4" />}
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
  units,
  present,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  active: ViewMode;
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  units: UnitSystem;
  present: boolean;
  locale: Locale;
  t: Dictionary;
}) {
  const profileAvailable = Boolean(a.images.side && b.images.side);
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "overlay", label: t.compare.tabOverlay },
    { key: "side", label: t.compare.tabSide },
  ];
  // Only add the Profile tab when both speakers can render in profile —
  // mixing a profile cabinet with a flat front placeholder would be
  // worse UX than not offering the mode at all.
  if (profileAvailable) {
    tabs.push({ key: "profile", label: t.compare.tabProfile });
  }
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
            units,
            present,
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
  units: UnitSystem,
  present: boolean,
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
      units,
      present,
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
  units,
  present,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  refs: Reference[];
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  units: UnitSystem;
  present: boolean;
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
  const swap = swapHref(a, b, "overlay", personHeight, currency, disc, units, present, locale);

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
          className="mx-auto [--cmp-scale:0.5] sm:[--cmp-scale:1]"
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
          <Ruler maxHeightMm={maxHeightMm} scale={scale} units={units} />
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
          {t.compare.swapHint} · {t.compare.referenceHeight}{" "}
          {units === "imperial"
            ? `${(maxHeightMm / 25.4).toFixed(1)} in · 1 in = ${(scale * 25.4).toFixed(2)} px`
            : `${maxHeightMm} mm (${(maxHeightMm / 10).toFixed(1)} cm) · 1 mm = ${scale.toFixed(2)} px`}
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
  units,
  present,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  refs: Reference[];
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  units: UnitSystem;
  present: boolean;
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
  const swap = swapHref(a, b, "side", personHeight, currency, disc, units, present, locale);

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
          className="mx-auto [--cmp-scale:0.5] sm:[--cmp-scale:1]"
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
          <Ruler maxHeightMm={maxHeightMm} scale={scale} units={units} />
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
          {t.compare.swapHint} · {t.compare.referenceHeight}{" "}
          {units === "imperial"
            ? `${(maxHeightMm / 25.4).toFixed(1)} in · 1 in = ${(scale * 25.4).toFixed(2)} px`
            : `${maxHeightMm} mm (${(maxHeightMm / 10).toFixed(1)} cm) · 1 mm = ${scale.toFixed(2)} px`}
        </p>
      </div>
    </section>
  );
}

/**
 * Profile view — both cabinets overlaid in profile at true scale, with a
 * three-way alignment selector (front / centre / back). Convention: side
 * photos in this catalogue face left, so the front of the cabinet is the
 * LEFT edge of the image and the back is the RIGHT edge.
 *
 *   - front   → both speakers share their front baffle line (visualises
 *               how far back each cabinet extends from the listening
 *               position)
 *   - centre  → neutral comparison, both centred on the same vertical
 *   - back    → both share their rear baffle line (the typical HiFi setup
 *               with speakers against a wall — useful to see how far one
 *               protrudes vs the other into the room)
 *
 * No reference items rendered here: person/banknote/disc references are
 * calibrated against `widthMm`-style horizontal extents and don't add
 * real information in a depth comparison.
 */
function ProfileOverlay({
  a,
  b,
  align,
  personHeight,
  currency,
  disc,
  units,
  present,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  align: ProfileAlign;
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  units: UnitSystem;
  present: boolean;
  locale: Locale;
  t: Dictionary;
}) {
  const maxHeightMm = Math.max(a.dimensions.heightMm, b.dimensions.heightMm);
  const scale = DISPLAY_HEIGHT_PX / maxHeightMm;
  const scaledDepthA = a.dimensions.depthMm * scale;
  const scaledDepthB = b.dimensions.depthMm * scale;
  const isSideBySide = align === "sideBySide";
  // Container width depends on layout:
  //  - side-by-side: both depths laid out horizontally + gap + padding
  //  - overlay (front/center/back): width = deeper of the two + 48 px
  const overlayBlockPx = isSideBySide
    ? scaledDepthA + scaledDepthB + SIDE_BY_SIDE_GAP_PX + 48
    : Math.max(scaledDepthA, scaledDepthB) + 48;
  const totalWidthPx = overlayBlockPx + RULER_WIDTH_PX;
  const swap = swapHref(a, b, "profile", personHeight, currency, disc, units, present, locale);

  // Compute X offset (within the 48 px-padded overlay block) for each
  // cabinet given the chosen align mode. 24 px = half the breathing room.
  function computeLeft(scaledDepth: number): number {
    switch (align) {
      case "front":
        // Both fronts aligned → left edge of image (front-facing left in
        // our convention) sits at x = 24.
        return 24;
      case "back":
        // Both backs aligned → right edge of image at containerWidth - 24.
        return overlayBlockPx - 24 - scaledDepth;
      default:
        // Centred on the overlay block.
        return (overlayBlockPx - scaledDepth) / 2;
    }
  }
  // `aLeft`/`bLeft` are only consumed by the overlaid layout; in
  // side-by-side mode we fall through to a flex row instead.
  const aLeft = isSideBySide ? 0 : computeLeft(scaledDepthA);
  const bLeft = isSideBySide ? 0 : computeLeft(scaledDepthB);

  // Build the URLs for the three align-mode buttons so each tap is a
  // shareable bookmark, exactly like the view tabs.
  function alignHref(next: ProfileAlign): string {
    return compareHref(
      {
        a: a.id,
        b: b.id,
        view: "profile",
        align: next,
        person: personHeight,
        currency,
        disc,
        units,
        present,
      },
      locale
    );
  }

  const alignTabs: Array<{
    key: ProfileAlign;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "sideBySide",
      label: t.compare.alignSideBySide,
      icon: <AlignSideBySideIcon />,
    },
    {
      key: "front",
      label: t.compare.alignFront,
      icon: <AlignFrontIcon />,
    },
    {
      key: "center",
      label: t.compare.alignCenter,
      icon: <AlignCenterIcon />,
    },
    {
      key: "back",
      label: t.compare.alignBack,
      icon: <AlignBackIcon />,
    },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {t.compare.headingProfile}
        </h2>
        <Legend a={a} b={b} />
      </div>

      {/* Three-way alignment selector. Each tap navigates with ?align=…,
          so the chosen mode is preserved in the URL and shareable. */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-md border border-stone-300 dark:border-stone-700 overflow-hidden">
          {alignTabs.map((tab) => {
            const isActive = tab.key === align;
            return (
              <Link
                key={tab.key}
                href={alignHref(tab.key)}
                aria-label={tab.label}
                title={tab.label}
                className={`inline-flex items-center justify-center h-9 w-12 transition-colors ${
                  isActive
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {tab.icon}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white p-3 sm:p-6 overflow-x-auto">
        <div
          className="mx-auto [--cmp-scale:0.5] sm:[--cmp-scale:1]"
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
            <Ruler maxHeightMm={maxHeightMm} scale={scale} units={units} />
            {isSideBySide ? (
              /*
                Side-by-side profile: both cabinets laid out next to each
                other at true depth scale, no overlap, both at full opacity.
                Default Profile view — easier to read individual silhouettes
                than the overlaid modes below.
              */
              <div
                className="relative flex items-end justify-center"
                style={{
                  height: `${DISPLAY_HEIGHT_PX}px`,
                  width: `${overlayBlockPx}px`,
                  gap: `${SIDE_BY_SIDE_GAP_PX}px`,
                }}
              >
                <Link href={swap} title={t.compare.swapTitle}>
                  <SpeakerCabinet
                    speaker={a}
                    scale={scale}
                    view="profile"
                    opacity={1}
                    outlineColor={COLOR_A}
                    style={{ cursor: "pointer" }}
                  />
                </Link>
                <Link href={swap} title={t.compare.swapTitle}>
                  <SpeakerCabinet
                    speaker={b}
                    scale={scale}
                    view="profile"
                    opacity={1}
                    outlineColor={COLOR_B}
                    style={{ cursor: "pointer" }}
                  />
                </Link>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-stone-300 dark:bg-stone-700"
                />
              </div>
            ) : (
              <div
                className="relative"
                style={{
                  height: `${DISPLAY_HEIGHT_PX}px`,
                  width: `${overlayBlockPx}px`,
                }}
              >
                {/*
                  Both cabinets occupy the same overlay block. A is at full
                  opacity behind, B at the OVERLAY_B_OPACITY in front, so the
                  reader can see A's silhouette through B and judge the
                  relative depth at a glance.
                */}
                <Link href={swap} aria-label={t.compare.swapAriaLabel} title={t.compare.swapTitle}>
                  <SpeakerCabinet
                    speaker={a}
                    scale={scale}
                    view="profile"
                    opacity={1}
                    outlineColor={COLOR_A}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: `${aLeft}px`,
                      zIndex: 1,
                      cursor: "pointer",
                    }}
                  />
                </Link>
                <Link href={swap} aria-label={t.compare.swapAriaLabel} title={t.compare.swapTitle}>
                  <SpeakerCabinet
                    speaker={b}
                    scale={scale}
                    view="profile"
                    opacity={OVERLAY_B_OPACITY}
                    outlineColor={COLOR_B}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: `${bLeft}px`,
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
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-stone-500 text-center">
          {t.compare.swapHint} · {t.compare.referenceHeight}{" "}
          {units === "imperial"
            ? `${(maxHeightMm / 25.4).toFixed(1)} in · 1 in = ${(scale * 25.4).toFixed(2)} px`
            : `${maxHeightMm} mm (${(maxHeightMm / 10).toFixed(1)} cm) · 1 mm = ${scale.toFixed(2)} px`}
        </p>
      </div>
    </section>
  );
}

/* ---------- Profile alignment icons (Lucide-style, 16×16) ----------
 * Each icon shows two rectangles + a guideline indicating where the
 * alignment edge sits. Matches Lucide's `align-horizontal-justify-*`
 * family, scaled to 16 px for the toolbar.
 */

function AlignSideBySideIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="6" height="14" x="3" y="5" rx="2" />
      <rect width="6" height="14" x="15" y="5" rx="2" />
    </svg>
  );
}

function AlignFrontIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="6" height="14" x="6" y="5" rx="2" />
      <rect width="6" height="10" x="16" y="7" rx="2" />
      <path d="M2 2v20" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="6" height="14" x="2" y="5" rx="2" />
      <rect width="6" height="10" x="16" y="7" rx="2" />
      <path d="M12 2v20" />
    </svg>
  );
}

function AlignBackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="6" height="14" x="2" y="5" rx="2" />
      <rect width="6" height="10" x="12" y="7" rx="2" />
      <path d="M22 2v20" />
    </svg>
  );
}

function EnterFullscreenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7V3h4" />
      <path d="M21 7V3h-4" />
      <path d="M3 17v4h4" />
      <path d="M21 17v4h-4" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 3v4H3" />
      <path d="M17 3v4h4" />
      <path d="M7 21v-4H3" />
      <path d="M17 21v-4h4" />
    </svg>
  );
}

function ReferencePickers({
  a,
  b,
  view,
  personHeight,
  currency,
  disc,
  units,
  present,
  locale,
  t,
}: {
  a: Speaker;
  b: Speaker;
  view: ViewMode;
  personHeight: PersonHeightCm | null;
  currency: CurrencyId | null;
  disc: DiscId | null;
  units: UnitSystem;
  present: boolean;
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
        { a: a.id, b: b.id, view, person: null, currency, disc, units, present },
        locale
      ),
    },
    ...PERSON_HEIGHT_OPTIONS_CM.map((cm) => ({
      value: String(cm),
      label: `${t.compare.refMan} — ${fmtPersonHeight(cm, locale)}`,
      href: compareHref(
        { a: a.id, b: b.id, view, person: cm, currency, disc, units, present },
        locale
      ),
    })),
  ];
  const currencyOptions = [
    {
      value: "",
      label: t.compare.refCurrencyOff,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency: null, disc, units, present },
        locale
      ),
    },
    ...CURRENCY_IDS.map((id) => ({
      value: id,
      label: CURRENCIES[id].shortLabel,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency: id, disc, units, present },
        locale
      ),
    })),
  ];
  const discOptions = [
    {
      value: "",
      label: t.compare.refDiscOff,
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency, disc: null, units, present },
        locale
      ),
    },
    ...DISC_IDS.map((id) => ({
      value: id,
      label: t.compare.discs[DISCS[id].labelKey],
      href: compareHref(
        { a: a.id, b: b.id, view, person: personHeight, currency, disc: id, units, present },
        locale
      ),
    })),
  ];

  return (
    <div className="flex items-end gap-3 flex-wrap">
      {/*
        On mobile the label takes the full row (basis-full) so the three
        controls stack neatly below it as a labelled group; on sm+ it
        reverts to its natural width and sits in-line with the controls.
      */}
      <span className="basis-full sm:basis-auto text-xs uppercase tracking-wider text-stone-500 sm:self-center">
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
  units,
}: {
  maxHeightMm: number;
  scale: number;
  units: UnitSystem;
}) {
  // Pick a tick step + label suited to the active unit system. Metric
  // steps follow the original 50/100/200 mm ladder (snaps to even cm).
  // Imperial steps are chosen so the ladder lands on round inch values
  // (3/6/12 in) — for a typical 1700 mm floorstander (~67 in) that
  // yields six labels (0/12/24/36/48/60); for a 380 mm bookshelf
  // (~15 in) five labels (0/3/6/9/12/15).
  const stepMm =
    units === "imperial"
      ? maxHeightMm > 762 // ~30 in
        ? 304.8 // 12 in
        : maxHeightMm > 381 // ~15 in
          ? 152.4 // 6 in
          : 76.2 // 3 in
      : maxHeightMm > 800
        ? 200
        : maxHeightMm > 400
          ? 100
          : 50;
  const marks: number[] = [];
  for (let mm = 0; mm <= maxHeightMm + 1; mm += stepMm) marks.push(mm);
  const label = (mm: number) =>
    units === "imperial" ? `${Math.round(mm / 25.4)} in` : `${mm / 10} cm`;

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
              {label(mm)}
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
  view = "front",
}: {
  speaker: Speaker;
  scale: number;
  opacity?: number;
  outlineColor: string;
  style?: React.CSSProperties;
  /**
   * Which face of the cabinet to render. `front` uses `images.front` +
   * `dimensions.widthMm`; `profile` uses `images.side` + `dimensions.depthMm`
   * so the cabinet draws at true depth on the horizontal axis.
   */
  view?: "front" | "profile";
}) {
  const isProfile = view === "profile";
  const widthMm = isProfile
    ? speaker.dimensions.depthMm
    : speaker.dimensions.widthMm;
  const widthPx = widthMm * scale;
  const heightPx = speaker.dimensions.heightMm * scale;
  const src = isProfile
    ? speaker.images.side
    : (speaker.images.front ?? speaker.images.hero);
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
        alt={`${speaker.brand} ${speaker.model} ${isProfile ? "side" : "front"} view`}
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
  units,
  metricHref,
  imperialHref,
}: {
  a: Speaker;
  b: Speaker;
  t: Dictionary;
  units: UnitSystem;
  metricHref: string;
  imperialHref: string;
}) {
  const fmtRange = (r: { min?: number; max: number }, unit: string) =>
    r.min !== undefined ? `${r.min}–${r.max} ${unit}` : `${r.max} ${unit}`;
  const fmtDrivers = (s: Speaker) =>
    s.drivers
      .map(
        (d) =>
          `${d.quantity ?? 1}× ${d.sizeMm > 0 ? `${formatDriverSizeMm(d.sizeMm, units)} ` : ""}${d.role}${d.material ? ` (${d.material})` : ""}`
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
      formatLengthMm(a.dimensions.heightMm, units),
      formatLengthMm(b.dimensions.heightMm, units),
      a.dimensions.heightMm,
      b.dimensions.heightMm,
    ],
    [
      t.specs.width,
      formatLengthMm(a.dimensions.widthMm, units),
      formatLengthMm(b.dimensions.widthMm, units),
      a.dimensions.widthMm,
      b.dimensions.widthMm,
    ],
    [
      t.specs.depth,
      formatLengthMm(a.dimensions.depthMm, units),
      formatLengthMm(b.dimensions.depthMm, units),
      a.dimensions.depthMm,
      b.dimensions.depthMm,
    ],
    [
      t.specs.weight,
      formatWeightKg(a.dimensions.weightKg, units),
      formatWeightKg(b.dimensions.weightKg, units),
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {t.specs.title}
        </h2>
        <UnitsToggle
          current={units}
          metricHref={metricHref}
          imperialHref={imperialHref}
          label={t.specs.units}
          metricLabel={t.specs.unitsMetric}
          imperialLabel={t.specs.unitsImperial}
        />
      </div>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        {/*
          `table-fixed` makes the browser use the first row's column
          widths verbatim and split any remaining width equally between
          unsized columns — so the two data columns (A and B) end up
          identical instead of wider/narrower based on cell content.
        */}
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-900/50 text-xs uppercase tracking-wide text-stone-500">
              {/*
                Mobile-tuned column widths: the label column shrinks
                from w-40 (160 px) to w-24 (96 px) so the two data
                columns each gain ~32 px of usable width — enough to
                stop most spec values (drivers, enclosure) from
                wrapping to 6+ lines on a portrait phone.
              */}
              <th className="px-2 sm:px-4 py-2 text-left font-medium w-24 sm:w-40"></th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium">
                <span style={{ color: COLOR_A }}>A</span>
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium border-l border-stone-100 dark:border-stone-800">
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
                <th className="px-2 sm:px-4 py-3 text-left font-normal text-xs sm:text-sm text-stone-500">
                  {label}
                </th>
                <td className={`px-2 sm:px-4 py-3 ${diffClass(na, nb, true)}`}>{av}</td>
                <td
                  className={`px-2 sm:px-4 py-3 border-l border-stone-100 dark:border-stone-800 ${diffClass(nb, na, true)}`}
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
