import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers } from "@/lib/speakers";
import { BRAND_INFO, BRAND_LOGOS } from "@/lib/brands";
import type { Speaker } from "@/lib/types";
import {
  getDictionary,
  isLocale,
  locales,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { SiteHeader } from "@/components/SiteHeader";
import { BrandStrip } from "@/components/BrandStrip";
import { CompareCTA } from "@/components/CompareCTA";
import { SponsorBanner } from "@/components/SponsorBanner";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { getHeroBbox, heroZoomTransform } from "@/lib/hero-bboxes";
import {
  getActiveCountryKeys,
  getCountrySummaries,
  type CountrySummary,
} from "@/lib/countries";

/**
 * Country page — `/<locale>/country/<countryKey>` lists every brand
 * and speaker model in the catalog from a given country. Designed to
 * capture long-tail queries like "danish HiFi speakers" or "british
 * floorstanders" and to lean into the national-pride engagement loop
 * that drives forum and Reddit traffic.
 *
 * `countryKey` slugs (e.g. `denmark`, `uk`, `germany`) come from
 * BRAND_INFO.countryKey — adding a new country to that union grows
 * the static export automatically.
 */

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export async function generateStaticParams() {
  const keys = getActiveCountryKeys();
  return locales.flatMap((locale) =>
    keys.map((code) => ({ locale, code }))
  );
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: raw, code } = await params;
  if (!isLocale(raw)) return {};
  if (!getActiveCountryKeys().includes(code)) return {};

  const t = getDictionary(raw);
  const countryName =
    (t.home.brandCountries as Record<string, string>)[code] ?? code;
  const speakers = getAllSpeakers().filter(
    (s) => BRAND_INFO[s.brand]?.countryKey === code
  );
  const brandCount = new Set(speakers.map((s) => s.brand)).size;

  return pageMetadata({
    locale: raw,
    path: `/country/${code}`,
    title: t.country.metaTitle.replace("{country}", countryName),
    description: t.country.metaDescription
      .replace("{country}", countryName)
      .replace("{brandCount}", String(brandCount))
      .replace("{speakerCount}", String(speakers.length)),
  });
}

export default async function CountryPage({ params }: Props) {
  const { locale: raw, code } = await params;
  if (!isLocale(raw)) notFound();
  if (!getActiveCountryKeys().includes(code)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const countryName =
    (t.home.brandCountries as Record<string, string>)[code] ?? code;
  const all = getAllSpeakers();
  // Brands tied to this country, then their speakers. Sorted brands
  // alphabetically for the directory; speakers grouped by brand within
  // each section so the page reads as "catalog by maker".
  const brandsForCountry = Object.entries(BRAND_INFO)
    .filter(([, info]) => info.countryKey === code)
    .map(([brand]) => brand)
    .sort();
  const speakersForCountry = all
    .filter((s) => BRAND_INFO[s.brand]?.countryKey === code)
    .sort((a, b) => {
      if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
      return a.model.localeCompare(b.model);
    });
  const flag = brandsForCountry.length
    ? BRAND_INFO[brandsForCountry[0]].countryFlag
    : "";

  // All catalog brands (live + planned) for the footer marquee.
  const allBrands = Array.from(new Set(all.map((s) => s.brand))).sort();

  // ItemList schema — surfaces the per-country directory in Google
  // search results so a query like "danish HiFi" can match the page
  // directly. Capped at 50 entries per Google's typical render limit.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `HiFi speakers from ${countryName} on TrueScale`,
    numberOfItems: speakersForCountry.length,
    itemListElement: speakersForCountry.slice(0, 50).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/${locale}/speaker/${s.id}`,
      name: `${s.brand} ${s.model}`,
    })),
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <JsonLd data={itemListJsonLd} />
      <SiteHeader locale={locale} t={t} currentPath="countries" />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12 space-y-12">
        <CountryHero
          flag={flag}
          countryName={countryName}
          brandCount={brandsForCountry.length}
          speakerCount={speakersForCountry.length}
          t={t}
        />

        {brandsForCountry.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              {t.country.brandsHeading.replace("{country}", countryName)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {brandsForCountry.map((brand) => (
                <BrandCard
                  key={brand}
                  brand={brand}
                  locale={locale}
                  speakerCount={
                    speakersForCountry.filter((s) => s.brand === brand).length
                  }
                  t={t}
                />
              ))}
            </div>
          </section>
        )}

        {/*
          Cross-country nav strip lives between the brands and speakers
          sections — same vertical rhythm as the rest of the page,
          easy to reach without scrolling to the very bottom.
        */}
        <OtherCountriesNav
          currentCode={code}
          summaries={getCountrySummaries()}
          locale={locale}
          t={t}
        />

        {speakersForCountry.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              {t.country.speakersHeading}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {speakersForCountry.map((s) => (
                <SpeakerCard key={s.id} speaker={s} locale={locale} />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-sm text-stone-500">{t.country.noSpeakers}</p>
        )}

        <SponsorBanner t={t} />
      </main>
      <BrandStrip brands={allBrands} locale={locale} t={t} />
      <CompareCTA locale={locale} t={t} mode="to-compare4" />
    </div>
  );
}

function OtherCountriesNav({
  currentCode,
  summaries,
  locale,
  t,
}: {
  currentCode: string;
  summaries: CountrySummary[];
  locale: Locale;
  t: Dictionary;
}) {
  const others = summaries.filter((c) => c.key !== currentCode);
  if (others.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
        {t.country.otherCountriesHeading}
      </h2>
      <div className="flex flex-wrap gap-2">
        {others.map((c) => {
          const name =
            (t.home.brandCountries as Record<string, string>)[c.key] ?? c.key;
          return (
            <Link
              key={c.key}
              href={`/${locale}/country/${c.key}`}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs hover:border-amber-500 transition-colors"
              title={name}
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="text-stone-700 dark:text-stone-200">{name}</span>
              <span className="text-stone-400">{c.speakerCount}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CountryHero({
  flag,
  countryName,
  brandCount,
  speakerCount,
  t,
}: {
  flag: string;
  countryName: string;
  brandCount: number;
  speakerCount: number;
  t: Dictionary;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white px-8 py-12 sm:px-12 sm:py-16">
      <div className="flex items-center gap-6 flex-wrap">
        <span
          className="text-8xl sm:text-9xl leading-none select-none"
          aria-hidden
        >
          {flag}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700 font-medium">
            {t.country.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900">
            {countryName}
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            {t.country.stats
              .replace("{brandCount}", String(brandCount))
              .replace("{speakerCount}", String(speakerCount))}
          </p>
        </div>
      </div>
    </section>
  );
}

function BrandCard({
  brand,
  locale,
  speakerCount,
  t,
}: {
  brand: string;
  locale: Locale;
  speakerCount: number;
  t: Dictionary;
}) {
  const logo = BRAND_LOGOS[brand];
  return (
    <Link
      href={`/${locale}?brand=${encodeURIComponent(brand)}`}
      className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white px-4 py-5 transition-colors hover:border-amber-500"
    >
      {logo ? (
        <span
          className={`${logo.stripHeightClass} w-auto inline-flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
        >
          {/*
            No `dark:invert` here: the card stays `bg-white` in both
            colour modes, so inverting the (black) logo would paint it
            white-on-white and make it vanish. The monochrome mark
            reads correctly against the white card in dark mode as-is.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={brand}
            width={logo.width}
            height={logo.height}
            className="h-full w-auto object-contain"
          />
        </span>
      ) : (
        <span className="text-sm font-medium text-stone-700">{brand}</span>
      )}
      <span className="text-[11px] text-stone-500">
        {t.country.speakerCount.replace("{n}", String(speakerCount))}
      </span>
    </Link>
  );
}

function SpeakerCard({ speaker, locale }: { speaker: Speaker; locale: Locale }) {
  const img = speaker.images.hero ?? speaker.images.front;
  // Apply a bbox-aware zoom so heros with lots of empty space around
  // the cabinet (Dynaudio Confidence line, etc.) crop in tight.
  // Speakers that already fill their image stay at scale 1.
  const bbox = speaker.images.hero ? getHeroBbox(speaker.id) : null;
  const zoom = bbox
    ? heroZoomTransform(bbox, 4 / 5, { targetFill: 0.95, maxZoom: 1.6 })
    : null;
  return (
    <Link
      href={`/${locale}/speaker/${speaker.id}`}
      className="group flex flex-col gap-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white p-3 transition-colors hover:border-amber-500"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-stone-50">
        {img && (
          /*
            Inline `transform` controls the per-speaker zoom and would
            collide with Tailwind's `group-hover:scale-...` (inline
            style always wins over class). Dropping the hover scale
            here — the card still telegraphs interactivity via the
            border-colour change in the parent link.
          */
          <Image
            src={img}
            alt={`${speaker.brand} ${speaker.model}`}
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            style={
              zoom
                ? { transform: zoom.transform, transformOrigin: zoom.transformOrigin }
                : undefined
            }
          />
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-stone-500">
          {speaker.brand}
        </p>
        <p className="text-sm font-medium text-stone-900 leading-tight">
          {speaker.model}
          {speaker.generation && (
            <span className="ml-1 text-stone-400 font-normal">
              {speaker.generation}
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {(speaker.dimensions.heightMm / 10).toFixed(1)} cm
        </p>
      </div>
    </Link>
  );
}
