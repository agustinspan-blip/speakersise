/**
 * Catalog-level statistics computed at request time from the speaker
 * data + brand registry. Drives the QuickFacts section on the home
 * page (and could power future "by the numbers" surfaces too).
 *
 * Everything here is deterministic — same catalog state in, same
 * numbers out. The "feels fresh" rotation is handled by the trivia
 * carousel inside QuickFacts; these stats stay rock-steady so visitors
 * can quote them.
 */

import type { Speaker } from "@/lib/types";
import { BRAND_INFO } from "@/lib/brands";

export interface CatalogStats {
  totalSpeakers: number;
  totalBookshelves: number;
  totalFloorstanders: number;
  totalBrands: number;
  totalCountries: number;
  /**
   * Number of distinct same-type 2-speaker comparisons possible across
   * the catalog: C(bookshelves, 2) + C(floorstanders, 2). Mirrors the
   * "Shuffle" feature's type-coherence guard (never mixes types).
   */
  sameTypeComparisons2: number;
  oldestBrandYear: number;
  oldestBrandName: string;
  newestBrandYear: number;
  newestBrandName: string;
  /** Country with the most distinct brands in the live catalog. */
  countryWithMostBrands: {
    countryKey: string;
    countryFlag: string;
    brandCount: number;
  };
}

/** Binomial coefficient C(n, 2) = n * (n - 1) / 2. */
function choose2(n: number): number {
  return (n * (n - 1)) / 2;
}

export function computeStats(speakers: Speaker[]): CatalogStats {
  const bookshelves = speakers.filter((s) => s.type === "bookshelf").length;
  const floorstanders = speakers.filter((s) => s.type === "floorstander").length;

  const brandsInCatalog = Array.from(new Set(speakers.map((s) => s.brand)));
  const liveBrandInfo = brandsInCatalog
    .map((b) => ({ name: b, info: BRAND_INFO[b] }))
    .filter((x): x is { name: string; info: NonNullable<typeof BRAND_INFO[string]> } =>
      Boolean(x.info)
    );

  // Founded-year extremes — fall back gracefully if no brand info exists.
  const byYear = [...liveBrandInfo].sort(
    (a, b) => a.info.foundedYear - b.info.foundedYear
  );
  const oldest = byYear[0];
  const newest = byYear[byYear.length - 1];

  // Brands per country (using BRAND_INFO.countryKey + countryFlag).
  const brandsByCountry: Record<string, { count: number; flag: string }> = {};
  for (const { info } of liveBrandInfo) {
    const k = info.countryKey;
    if (!brandsByCountry[k]) {
      brandsByCountry[k] = { count: 0, flag: info.countryFlag };
    }
    brandsByCountry[k].count += 1;
  }
  const topCountry = Object.entries(brandsByCountry).sort(
    ([, a], [, b]) => b.count - a.count
  )[0];

  const totalCountries = Object.keys(brandsByCountry).length;

  return {
    totalSpeakers: speakers.length,
    totalBookshelves: bookshelves,
    totalFloorstanders: floorstanders,
    totalBrands: brandsInCatalog.length,
    totalCountries,
    sameTypeComparisons2: choose2(bookshelves) + choose2(floorstanders),
    oldestBrandYear: oldest?.info.foundedYear ?? 0,
    oldestBrandName: oldest?.name ?? "—",
    newestBrandYear: newest?.info.foundedYear ?? 0,
    newestBrandName: newest?.name ?? "—",
    countryWithMostBrands: {
      countryKey: topCountry?.[0] ?? "uk",
      countryFlag: topCountry?.[1].flag ?? "",
      brandCount: topCountry?.[1].count ?? 0,
    },
  };
}
