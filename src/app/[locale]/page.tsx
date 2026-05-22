import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers, getAllSpeakersByRecency } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";
import {
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { BrandStrip } from "@/components/BrandStrip";
import { CatalogInsights } from "@/components/CatalogInsights";
import { CatalogList } from "@/components/CatalogList";
import { CompareCTA } from "@/components/CompareCTA";
import { DidYouKnow } from "@/components/DidYouKnow";
import { NavCTAs } from "@/components/NavCTAs";
import { SideViewBadge } from "@/components/SideViewBadge";
import { SiteHeader } from "@/components/SiteHeader";
import { TopFive } from "@/components/TopFive";
import { getPopularSpeakers } from "@/lib/popularity";
import { computeStats } from "@/lib/stats";
import { TRIVIA } from "@/lib/trivia";
import {
  BRAND_LOGOS,
  BRAND_INFO,
  getBrandTheme,
  type BrandTheme,
} from "@/lib/brands";

type SortKey =
  | "brand"
  | "model-asc"
  | "model-desc"
  | "newest"
  | "oldest";

const FEATURED_COUNT = 9;
const SHOW_MORE_STEP = 6;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Tiny seedable PRNG (mulberry32). Returns a function yielding numbers in
// [0, 1). Used so featured-speaker order is stable per week instead of
// reshuffling on every server render — without this the home page changes
// between two clicks of "back" and the user loses their visual anchor.
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle that biases toward the start of the list. Items at index 0 (most
// recent) have the highest probability of landing in the top-N selection.
// Uses the Efraimidis–Spirakis weighted reservoir method:
//   key_i = U_i ^ (1 / w_i), keep the top-N by key
//
// The PRNG is seeded fresh every server render so the catalog rotation
// feels genuinely random across visits, while still keeping the recency
// bias so newly-added speakers surface more often.
function pickWeightedRecent(speakers: Speaker[], count: number): Speaker[] {
  const decay = 0.85;
  const seed = (Math.random() * 0x1_0000_0000) | 0;
  const rand = mulberry32(seed);
  const keyed = speakers.map((s, i) => {
    const weight = Math.pow(decay, i);
    const u = rand();
    const key = Math.pow(u, 1 / weight);
    return { s, key };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map((k) => k.s);
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    brand?: string;
    type?: string;
    country?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = getDictionary(raw);
  const sp = await searchParams;
  const all = getAllSpeakers();
  const brand = sp.brand;
  const isKnownBrand = brand && BRAND_INFO[brand] !== undefined;

  // When the user is filtering by a known brand (and only by brand),
  // surface a brand-specific title/description so per-brand shares unfurl
  // distinctly. Search/type/sort filters fall back to the generic title —
  // they're transient query state, not stable shareable URLs.
  if (isKnownBrand && !sp.q && !sp.type && !sp.sort) {
    const count = all.filter((s) => s.brand === brand).length;
    return pageMetadata({
      locale: raw,
      // Brand-filtered home is the same canonical resource per locale —
      // include `?brand=` so hreflang URLs point at matching variants.
      path: `?brand=${encodeURIComponent(brand)}`,
      title: t.meta.brandHomeTitle.replace("{brand}", brand),
      description: t.meta.brandHomeDescription
        .replace("{brand}", brand)
        .replace("{count}", String(count)),
    });
  }

  const brandCount = new Set(all.map((s) => s.brand)).size;
  return pageMetadata({
    locale: raw,
    path: "",
    title: t.meta.homeTitle,
    description: t.meta.homeDescription.replace(
      "{brandCount}",
      String(brandCount)
    ),
  });
}

export default async function Home({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const sp = await searchParams;

  const all = getAllSpeakers();
  const brands = Array.from(new Set(all.map((s) => s.brand))).sort();
  // Unique countries present in the catalog, paired (countryCode, label).
  // Sorted by localized label so the dropdown reads naturally per locale.
  const countries = Array.from(
    new Map(
      all
        .map((s) => BRAND_INFO[s.brand])
        .filter((info): info is NonNullable<typeof info> => Boolean(info))
        .map((info) => [
          info.countryCode,
          {
            code: info.countryCode,
            label: t.home.brandCountries[info.countryKey],
            flag: info.countryFlag,
          },
        ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  const q = (sp.q ?? "").trim().toLowerCase();
  const brand = sp.brand ?? "";
  const type = sp.type ?? "";
  const country = sp.country ?? "";
  // Default sort depends on context: brand pages (a single brand filter
  // applied) always start sorted A→Z by model so the line-up reads as a
  // proper catalog. The unfiltered home falls back to "brand" — and below
  // that branch is upgraded to a per-request shuffle.
  const isBrandFiltered = Boolean(brand) && !q && !type && !country;
  const sort: SortKey = isSortKey(sp.sort)
    ? sp.sort
    : isBrandFiltered
      ? "model-asc"
      : "brand";
  const hasFilters = Boolean(q || brand || type || country);
  // Sort filter is part of the URL, but the user passively viewing "brand"
  // (default) shouldn't suppress the featured shuffle.
  const userSorted = sort !== "brand" && Boolean(sp.sort);
  const showFeatured = !hasFilters && !userSorted;

  let displayed: Speaker[];
  if (showFeatured) {
    // No filters → produce the FULL list in recency-weighted shuffle order
    // so the client-side CatalogList can reveal more on demand.
    displayed = pickWeightedRecent(
      getAllSpeakersByRecency(),
      all.length
    );
  } else {
    let filtered = all;
    if (q) {
      filtered = filtered.filter((s) =>
        [s.brand, s.model, s.series, s.generation, s.type]
          .filter((x): x is string => Boolean(x))
          .some((x) => x.toLowerCase().includes(q))
      );
    }
    if (brand) filtered = filtered.filter((s) => s.brand === brand);
    if (country) {
      filtered = filtered.filter(
        (s) => BRAND_INFO[s.brand]?.countryCode === country
      );
    }
    if (type) {
      // The Type dropdown carries both physical type (bookshelf/floorstander)
      // and power type (active/passive) — branch on which axis was picked.
      if (type === "active" || type === "passive") {
        filtered = filtered.filter((s) => s.powerType === type);
      } else {
        filtered = filtered.filter((s) => s.type === type);
      }
    }
    // Recency ranking by file mtime — built once and passed into sortSpeakers
    // so the "newest"/"oldest" sorts don't have to re-stat the data dir.
    const recencyRank = new Map(
      getAllSpeakersByRecency().map((s, i) => [s.id, i])
    );
    displayed = sortSpeakers(filtered, sort, recencyRank);
  }

  // QuickFacts stats are deterministic — the trivia rotation happens
  // client-side inside the carousel (which seeds itself on mount).
  const catalogStats = computeStats(all);

  // Pick a featured speaker for the editorial hero (the most recent one with
  // a hero image, falling back to the first displayed).
  const heroSpeaker =
    displayed.find((s) => s.images.hero) ??
    all.find((s) => s.images.hero) ??
    displayed[0];

  // Show a brand-themed view when the user is filtering by a single brand
  // (no search query, no type filter).
  const brandPageMode = Boolean(brand) && !q && !type;
  const theme = brandPageMode ? getBrandTheme(brand) : getBrandTheme(null);
  // Random featured speaker from the active brand for the brand hero.
  // Falls back to `null` when the brand has no catalog entries yet —
  // BrandHero then renders the brand metadata without a featured speaker.
  const brandHeroSpeaker = brandPageMode
    ? displayed.find((s) => s.images.hero) ?? displayed[0] ?? null
    : null;

  return (
    <div className={`min-h-screen ${theme.pageBg} flex flex-col`}>
      <SiteHeader locale={locale} t={t} />

      <main className="flex-1">
        {showFeatured && heroSpeaker && (
          <Hero
            speaker={heroSpeaker}
            locale={locale}
            t={t}
            theme={theme}
          />
        )}
        {brandPageMode && (
          <BrandHero
            brand={brand}
            speaker={brandHeroSpeaker}
            speakerCount={displayed.length}
            locale={locale}
            t={t}
            theme={theme}
          />
        )}

        {/*
          Below the hero: full-width Catalog Insights row followed by
          the rotating Did You Know trivia. Both only render on the
          unfiltered home — brand-filtered or search-filtered views
          stay focused on their own catalog.
        */}
        {showFeatured && (
          <>
            <CatalogInsights stats={catalogStats} locale={locale} t={t} />
            <DidYouKnow trivia={TRIVIA} locale={locale} t={t} />
          </>
        )}

        {/* "Most-searched" Top 5s — only on the unfiltered home, where
            they act as a quick-pick / discovery aid above the full grid.
            Hidden on filtered or brand views to keep those focused. */}
        {showFeatured && (
          <TopFive
            bookshelf={getPopularSpeakers("bookshelf")}
            floorstander={getPopularSpeakers("floorstander")}
            locale={locale}
            t={t}
          />
        )}

        <div className="mx-auto max-w-6xl px-6 pt-6 pb-16 space-y-12">
          <Filters
            brands={brands}
            countries={countries}
            q={q}
            brand={brand}
            type={type}
            country={country}
            sort={sort}
            t={t}
            theme={theme}
          />

          <section id="catalog" className="space-y-8">
            <div className="flex items-baseline justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.2em] ${theme.accentEyebrow} font-medium`}
                >
                  {showFeatured ? t.catalog.featured : t.catalog.search}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  {showFeatured ? (
                    <>
                      {displayed.length}{" "}
                      <span className="text-stone-400 font-normal">
                        {t.catalog.ofTotal} {all.length}{" "}
                        {t.catalog.speakerPlural}
                      </span>
                    </>
                  ) : (
                    <>
                      {displayed.length}{" "}
                      {displayed.length === 1
                        ? t.catalog.speakerSingular
                        : t.catalog.speakerPlural}
                      {displayed.length !== all.length && (
                        <span className="text-stone-400 font-normal">
                          {" "}
                          {t.catalog.ofTotal} {all.length}
                        </span>
                      )}
                    </>
                  )}
                </h2>
              </div>
              {hasFilters && (
                <Link
                  href={`/${locale}`}
                  className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline-offset-4 hover:underline"
                >
                  {t.catalog.clearFilters}
                </Link>
              )}
            </div>

            {displayed.length === 0 ? (
              <p className="py-16 text-center text-sm text-stone-500">
                {t.catalog.noResults}
              </p>
            ) : showFeatured ? (
              <CatalogList
                initialCount={FEATURED_COUNT}
                step={SHOW_MORE_STEP}
                showMoreLabel={t.catalog.showMore}
                theme={theme}
              >
                {displayed.map((s) => (
                  <SpeakerCard
                    key={s.id}
                    speaker={s}
                    locale={locale}
                    theme={theme}
                    t={t}
                  />
                ))}
              </CatalogList>
            ) : (
              <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((s) => (
                  <SpeakerCard
                    key={s.id}
                    speaker={s}
                    locale={locale}
                    theme={theme}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />

      <CompareCTA locale={locale} t={t} />
    </div>
  );
}

function Hero({
  speaker,
  locale,
  t,
  theme,
}: {
  speaker: Speaker;
  locale: Locale;
  t: Dictionary;
  theme: BrandTheme;
}) {
  const img = speaker.images.hero ?? speaker.images.front;
  return (
    // No bottom border here — the divider moved down so it sits after
    // the Catalog Insights row, visually grouping the hero and the
    // insights as one block above the rest of the home page.
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background: `radial-gradient(60% 60% at 75% 30%, ${theme.glowColor}, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${theme.accentEyebrow} font-medium`}
          >
            {t.home.heroEyebrow}
          </p>
          <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-stone-900 dark:text-stone-50">
            {t.home.heroTitle}{" "}
            <span className={`italic font-normal ${theme.accentTitle}`}>
              {t.home.heroTitleAccent}
            </span>{" "}
            {t.home.heroTitleTail}
          </h1>
          <p className="mt-6 text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
            {t.home.heroSubtitle}
          </p>
          {/* Primary CTAs: paired TrueScale + TechSpecs. Default amber
              theme on the unfiltered catalog. The Catalog Insights row
              + "Browse the catalog ↓" link sit below the hero (outside
              this component) instead of inside the left column, so the
              hero stays focused on the headline + image. */}
          <NavCTAs locale={locale} t={t} className="mt-8" />
        </div>

        <Link
          href={`/${locale}/speaker/${speaker.id}`}
          className="group relative block aspect-[4/5] lg:aspect-auto lg:h-[400px] overflow-hidden rounded-2xl bg-white"
        >
          {img && (
            <Image
              src={img}
              alt={`${speaker.brand} ${speaker.model}`}
              fill
              className="object-contain p-8 pb-20 transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
          )}
          {speaker.images.side && <SideViewBadge t={t} />}
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500">
                {speaker.brand}
              </p>
              <p className="text-base font-medium text-stone-900 dark:text-stone-100">
                {speaker.model}
                {speaker.generation && (
                  <span className="ml-1 text-stone-400 font-normal">
                    {speaker.generation}
                  </span>
                )}
              </p>
            </div>
            <span
              className={`${theme.accentArrow} text-xl transition-transform group-hover:translate-x-1`}
            >
              →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

function BrandHero({
  brand,
  speaker,
  speakerCount,
  locale,
  t,
  theme,
}: {
  brand: string;
  speaker: Speaker | null;
  speakerCount: number;
  locale: Locale;
  t: Dictionary;
  theme: BrandTheme;
}) {
  const img = speaker ? speaker.images.hero ?? speaker.images.front : null;
  const logo = BRAND_LOGOS[brand];
  const info = BRAND_INFO[brand];
  const countryName = info ? t.home.brandCountries[info.countryKey] : null;
  const description = info
    ? t.home.brandDescriptions[info.descriptionKey]
    : null;
  return (
    <section className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background: `radial-gradient(70% 70% at 75% 30%, ${theme.glowColor}, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${theme.accentEyebrow} font-medium`}
          >
            {t.home.brandHeroEyebrow}
          </p>
          {logo ? (
            <div className="mt-6 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={brand}
                width={logo.width}
                height={logo.height}
                className={`${logo.heroHeightClass} w-auto object-contain ${
                  logo.darkInvert !== false ? "dark:invert" : ""
                }`}
              />
            </div>
          ) : (
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-stone-900 dark:text-stone-50">
              {brand}
            </h1>
          )}
          {info && countryName && (
            <p
              className="mt-5 inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"
              aria-label={`${countryName}, ${t.home.founded} ${info.foundedYear}`}
            >
              <span aria-hidden className="text-2xl leading-none">
                {info.countryFlag}
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {countryName}
              </span>
              <span className="text-stone-400">·</span>
              <span>
                {t.home.founded} {info.foundedYear}
              </span>
            </p>
          )}
          {description && (
            <p className="mt-5 text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
              {description}
            </p>
          )}
          {info && (
            <p className="mt-3">
              <a
                href={info.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-sm font-medium ${theme.accentTitle} hover:underline underline-offset-4`}
              >
                {t.home.officialSite}
                <span aria-hidden>↗</span>
              </a>
            </p>
          )}
          <p className="mt-6 text-sm text-stone-500 dark:text-stone-500">
            <span
              className={`text-2xl font-semibold tracking-tight ${theme.accentTitle} mr-2 align-middle`}
            >
              {speakerCount}
            </span>
            <span className="align-middle">{t.home.brandHeroSubtitle}</span>
          </p>
          {/* Paired primary CTAs in the brand's accent colour, so the
              page reads as cohesive (logo + theme + buttons all match). */}
          <NavCTAs locale={locale} t={t} className="mt-8" />
          <a
            href="#catalog"
            className="mt-5 inline-block text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline-offset-4 hover:underline"
          >
            {t.home.brandHeroExploreCta} ↓
          </a>
        </div>

        {speaker && img ? (
          <Link
            href={`/${locale}/speaker/${speaker.id}`}
            className="group relative block aspect-[4/5] lg:aspect-auto lg:h-[520px] overflow-hidden rounded-2xl bg-white"
          >
            <Image
              src={img}
              alt={`${speaker.brand} ${speaker.model}`}
              fill
              className="object-contain p-10 pb-24 transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 520px"
              priority
            />
            {speaker.images.side && <SideViewBadge t={t} />}
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500">
                  {speaker.brand}
                </p>
                <p className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {speaker.model}
                  {speaker.generation && (
                    <span className="ml-1 text-stone-400 font-normal">
                      {speaker.generation}
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`${theme.accentArrow} text-xl transition-transform group-hover:translate-x-1`}
              >
                →
              </span>
            </div>
          </Link>
        ) : (
          // Empty-state placeholder for brands that have a page but no
          // catalog entries yet (e.g. Wharfedale before its first import).
          // Mirrors the dimensions of the speaker card so the hero layout
          // doesn't collapse.
          <div className="relative aspect-[4/5] lg:aspect-auto lg:h-[520px] overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white/40 dark:bg-stone-900/40 flex items-center justify-center px-8 text-center">
            <p className="text-sm font-medium tracking-wide text-stone-500 dark:text-stone-400">
              {t.home.brandHeroEmpty}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function isSortKey(x: string | undefined): x is SortKey {
  return (
    x === "brand" ||
    x === "model-asc" ||
    x === "model-desc" ||
    x === "newest" ||
    x === "oldest"
  );
}

function sortSpeakers(
  list: Speaker[],
  key: SortKey,
  recencyRank?: Map<string, number>
): Speaker[] {
  const sorted = [...list];
  switch (key) {
    case "model-asc":
      sorted.sort((a, b) => a.model.localeCompare(b.model));
      break;
    case "model-desc":
      sorted.sort((a, b) => b.model.localeCompare(a.model));
      break;
    case "newest":
      // Lower rank index = more recent (getAllSpeakersByRecency returns
      // newest first). Speakers missing from the map sink to the bottom.
      sorted.sort(
        (a, b) =>
          (recencyRank?.get(a.id) ?? Infinity) -
          (recencyRank?.get(b.id) ?? Infinity)
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          (recencyRank?.get(b.id) ?? -Infinity) -
          (recencyRank?.get(a.id) ?? -Infinity)
      );
      break;
    default:
      sorted.sort((a, b) => {
        if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
        return a.model.localeCompare(b.model);
      });
  }
  return sorted;
}

function Filters({
  brands,
  countries,
  q,
  brand,
  type,
  country,
  sort,
  t,
  theme,
}: {
  brands: string[];
  countries: { code: string; label: string; flag: string }[];
  q: string;
  brand: string;
  type: string;
  country: string;
  sort: SortKey;
  t: Dictionary;
  theme: BrandTheme;
}) {
  const inputClass =
    "w-full h-11 px-4 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors";
  return (
    <form
      method="get"
      className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_repeat(4,1fr)_auto] items-center"
    >
      <input
        type="text"
        name="q"
        defaultValue={q}
        placeholder={t.catalog.searchPlaceholder}
        aria-label={t.catalog.search}
        className={inputClass}
      />
      <select
        name="brand"
        defaultValue={brand}
        aria-label={t.catalog.brand}
        className={inputClass}
      >
        <option value="">{t.catalog.allBrands}</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select
        name="type"
        defaultValue={type}
        aria-label={t.catalog.type}
        className={inputClass}
      >
        <option value="">{t.catalog.allTypes}</option>
        <option value="bookshelf">{t.catalog.bookshelf}</option>
        <option value="floorstander">{t.catalog.floorstander}</option>
        <option value="active">{t.specs.active}</option>
        <option value="passive">{t.specs.passive}</option>
      </select>
      <select
        name="country"
        defaultValue={country}
        aria-label={t.catalog.country}
        className={inputClass}
      >
        <option value="">{t.catalog.allCountries}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={sort}
        aria-label={t.catalog.sortBy}
        className={inputClass}
      >
        <option value="brand">{t.catalog.sortBrand}</option>
        <option value="model-asc">{t.catalog.sortModelAsc}</option>
        <option value="model-desc">{t.catalog.sortModelDesc}</option>
        <option value="newest">{t.catalog.sortNewest}</option>
        <option value="oldest">{t.catalog.sortOldest}</option>
      </select>
      <button
        type="submit"
        className={`h-11 px-6 rounded-full ${theme.ctaBg} text-white transition-colors text-sm font-medium whitespace-nowrap`}
      >
        {t.catalog.apply}
      </button>
    </form>
  );
}

function SpeakerCard({
  speaker: s,
  locale,
  theme,
  t,
}: {
  speaker: Speaker;
  locale: Locale;
  theme: BrandTheme;
  t: Dictionary;
}) {
  const imgSrc = s.images.hero ?? s.images.front;
  const logo = BRAND_LOGOS[s.brand];
  return (
    <li>
      <Link
        href={`/${locale}/speaker/${s.id}`}
        className="group block h-full"
      >
        {imgSrc && (
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white transition-shadow duration-300 group-hover:shadow-[0_20px_50px_-12px_rgba(28,25,23,0.18)]">
            <Image
              src={imgSrc}
              alt={`${s.brand} ${s.model}`}
              fill
              className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {s.images.side && <SideViewBadge t={t} size="sm" />}
          </div>
        )}
        <div className="pt-4 px-1">
          <div className="flex items-center h-[60px]">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.src}
                alt={s.brand}
                width={logo.width}
                height={logo.height}
                className={`${logo.heightClass} w-auto object-contain ${
                  logo.darkInvert !== false ? "dark:invert" : ""
                }`}
              />
            ) : (
              <span className="text-xs uppercase tracking-wide text-stone-500">
                {s.brand}
              </span>
            )}
          </div>
          <p
            className={`mt-2 font-medium text-stone-900 dark:text-stone-100 ${theme.accentHover} transition-colors`}
          >
            {s.brand} — {s.model}
            {s.generation && (
              <span className="ml-1 text-stone-400 font-normal">
                {s.generation}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
            {t.catalog[s.type]} · {t.specs[s.powerType]}
          </p>
        </div>
      </Link>
    </li>
  );
}
