import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers } from "@/lib/speakers";
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
import { SponsorBanner } from "@/components/SponsorBanner";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { getCountrySummaries, type CountrySummary } from "@/lib/countries";

/**
 * Country directory — `/<locale>/countries` lists every country with
 * a brand in the catalog as a card grid. Acts as the navigational
 * hub for the per-country pages: pick a flag, jump to that country.
 *
 * Why this exists alongside the individual `/country/<code>` pages:
 * SEO benefits massively from each country having its own canonical
 * URL with country-specific metadata, but UX benefits from a single
 * entry point that surfaces "what countries are here". This page is
 * that entry point — every card links to the corresponding country
 * page, no JS filtering.
 */

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = getDictionary(raw);
  const summaries = getCountrySummaries();
  const brandCount = summaries.reduce((acc, c) => acc + c.brandCount, 0);
  const speakerCount = getAllSpeakers().length;
  return pageMetadata({
    locale: raw,
    path: "/countries",
    title: t.country.indexMetaTitle,
    description: t.country.indexMetaDescription
      .replace("{countryCount}", String(summaries.length))
      .replace("{brandCount}", String(brandCount))
      .replace("{speakerCount}", String(speakerCount)),
  });
}

export default async function CountriesPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const summaries = getCountrySummaries();
  const allBrands = Array.from(
    new Set(getAllSpeakers().map((s) => s.brand))
  ).sort();

  // CollectionPage + ItemList — surfaces the directory as a navigable
  // collection in search results. Each ListItem points at the
  // canonical per-country page so Google follows through.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.country.indexTitle,
    description: t.country.indexSubtitle,
    url: `${SITE_URL}/${locale}/countries`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: summaries.length,
      itemListElement: summaries.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${locale}/country/${c.key}`,
        name:
          (t.home.brandCountries as Record<string, string>)[c.key] ?? c.key,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <JsonLd data={collectionJsonLd} />
      <SiteHeader locale={locale} t={t} currentPath="countries" />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.country.indexTitle}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 max-w-2xl">
            {t.country.indexSubtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {summaries.map((c) => (
            <CountryCard key={c.key} country={c} locale={locale} t={t} />
          ))}
        </div>

        <SponsorBanner t={t} />
      </main>
      <BrandStrip brands={allBrands} locale={locale} t={t} />
    </div>
  );
}

function CountryCard({
  country,
  locale,
  t,
}: {
  country: CountrySummary;
  locale: Locale;
  t: Dictionary;
}) {
  const name =
    (t.home.brandCountries as Record<string, string>)[country.key] ??
    country.key;
  return (
    <Link
      href={`/${locale}/country/${country.key}`}
      className="group flex items-center gap-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white px-6 py-5 transition-colors hover:border-amber-500"
    >
      <span
        className="text-6xl leading-none select-none transition-transform group-hover:scale-110"
        aria-hidden
      >
        {country.flag}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-stone-900 truncate">{name}</p>
        <p className="mt-1 text-xs text-stone-500">
          {t.country.stats
            .replace("{brandCount}", String(country.brandCount))
            .replace("{speakerCount}", String(country.speakerCount))}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-wider text-stone-400 truncate">
          {country.brands.slice(0, 4).join(" · ")}
          {country.brands.length > 4 && " · …"}
        </p>
      </div>
    </Link>
  );
}
