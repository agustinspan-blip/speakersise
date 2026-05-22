import type { MetadataRoute } from "next";
import { getAllSpeakers } from "@/lib/speakers";
import { BRAND_INFO } from "@/lib/brands";
import { locales, defaultLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { getStrategicPairSlugs } from "@/lib/compare-pairs";

/**
 * Sitemap auto-generated from the catalog. Next.js 16 reads this file at
 * build time (and on demand for ISR) and exposes the result at
 * `/sitemap.xml`. The output covers, per page:
 *   - Home (`/<locale>`) and brand-filtered home (`/<locale>?brand=<Brand>`)
 *   - `/<locale>/brands`, `/support`, `/compare`, `/compare4`, `/contact`
 *   - One entry per speaker at `/<locale>/speaker/<id>`
 *
 * Each entry is emitted **once per page (in the default locale)**, with
 * the other locales attached via `alternates.languages`. This is the
 * shape Google expects for bilingual sites — it merges the variants into
 * a single canonical record rather than treating them as duplicates.
 *
 * `lastModified` defaults to build time; if a per-speaker `updatedAt`
 * field is added later, plug it in here.
 */

type Entry = MetadataRoute.Sitemap[number];

function withAlternates(
  path: string,
  base: Omit<Entry, "url" | "alternates">
): Entry {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  return {
    url: `${SITE_URL}/${defaultLocale}${path}`,
    alternates: { languages },
    ...base,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const speakers = getAllSpeakers();
  const liveBrands = Object.keys(BRAND_INFO);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    withAlternates("", { lastModified: now, changeFrequency: "weekly", priority: 1.0 }),
    withAlternates("/brands", { lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
    withAlternates("/compare", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    withAlternates("/compare4", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    withAlternates("/contact", { lastModified: now, changeFrequency: "yearly", priority: 0.4 }),
    withAlternates("/support", { lastModified: now, changeFrequency: "monthly", priority: 0.5 }),
  ];

  // Brand-filtered home — one URL per live brand. Crawlers treat these
  // as distinct from the unfiltered home thanks to the `?brand=` query.
  for (const brand of liveBrands) {
    entries.push(
      withAlternates(`?brand=${encodeURIComponent(brand)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );
  }

  // One entry per speaker detail page.
  for (const s of speakers) {
    entries.push(
      withAlternates(`/speaker/${s.id}`, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    );
  }

  // Pre-rendered long-tail compare URLs (/compare/<a>-vs-<b>). These
  // exist for high-recognition same-type / cross-brand pairs only —
  // see `lib/compare-pairs.ts` for the curated list. Each entry gets
  // both locale variants via the standard hreflang shape, same as the
  // speaker pages.
  for (const slug of getStrategicPairSlugs()) {
    entries.push(
      withAlternates(`/compare/${slug}`, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      })
    );
  }

  return entries;
}
