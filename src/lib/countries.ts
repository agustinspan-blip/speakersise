import { BRAND_INFO } from "@/lib/brands";
import { getAllSpeakers } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";

/**
 * Per-country summary used by the `/<locale>/countries` index and
 * by the cross-country navigation footer on each country page.
 *
 * `key` is the BRAND_INFO.countryKey slug (e.g. `denmark`, `uk`) and
 * also the URL segment under `/country/`. `flag` is the unicode flag
 * emoji, copied from the first brand we encounter for the country.
 */
export interface CountrySummary {
  key: string;
  flag: string;
  /** Brands tied to this country, alphabetical. */
  brands: string[];
  /** Speakers from this country, in any consistent order. */
  speakers: Speaker[];
  brandCount: number;
  speakerCount: number;
}

/**
 * Build the canonical country list, sorted by speaker count
 * descending — countries with rich catalogues lead the grid, with
 * the long tail underneath. Within the tail, ties break by name
 * alphabetically.
 *
 * Only countries that have at least one brand in BRAND_INFO are
 * returned; "planned" countries with no live brand aren't useful as
 * landing pages.
 */
export function getCountrySummaries(): CountrySummary[] {
  const all = getAllSpeakers();
  // Group brands by country first.
  const byCountry = new Map<
    string,
    { brands: Set<string>; flag: string }
  >();
  for (const [brand, info] of Object.entries(BRAND_INFO)) {
    const entry =
      byCountry.get(info.countryKey) ??
      { brands: new Set<string>(), flag: info.countryFlag };
    entry.brands.add(brand);
    byCountry.set(info.countryKey, entry);
  }

  // Then collect speakers per country in one pass over the catalog.
  const speakersByCountry = new Map<string, Speaker[]>();
  for (const s of all) {
    const key = BRAND_INFO[s.brand]?.countryKey;
    if (!key) continue;
    const list = speakersByCountry.get(key) ?? [];
    list.push(s);
    speakersByCountry.set(key, list);
  }

  const summaries: CountrySummary[] = [];
  for (const [key, { brands, flag }] of byCountry) {
    const speakers = speakersByCountry.get(key) ?? [];
    summaries.push({
      key,
      flag,
      brands: Array.from(brands).sort(),
      speakers,
      brandCount: brands.size,
      speakerCount: speakers.length,
    });
  }

  summaries.sort((a, b) => {
    if (a.speakerCount !== b.speakerCount)
      return b.speakerCount - a.speakerCount;
    return a.key.localeCompare(b.key);
  });
  return summaries;
}

/**
 * Just the country keys, in the same sort order as `getCountrySummaries`.
 * Used by `generateStaticParams` for the country pages and by the
 * sitemap.
 */
export function getActiveCountryKeys(): string[] {
  return getCountrySummaries().map((c) => c.key);
}
