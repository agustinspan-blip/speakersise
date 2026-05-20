import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

/**
 * Helper for building per-page Next.js Metadata objects consistently.
 * Each page's `generateMetadata()` constructs its own title/description
 * (often locale-aware and data-driven) and passes them here so the
 * OpenGraph + Twitter shapes — plus the bilingual `alternates.languages`
 * (hreflang) — stay uniform across the site.
 */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  es: "es_AR",
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  ogImage,
}: {
  locale: Locale;
  /**
   * Page path without the locale prefix, with a leading slash for sub-pages
   * and `""` for the locale home. Used to build canonical + hreflang URLs.
   * Examples: `""`, `"/brands"`, `"/speaker/monitor-audio-bronze-100-7g"`.
   */
  path: string;
  title: string;
  description: string;
  /**
   * Optional OG/Twitter card image. Pass a *relative* URL — Next.js
   * resolves it against `metadataBase` set in the root layout, so
   * crawlers see absolute URLs rooted at the deployed origin.
   * When omitted, OG falls back to a text-only "summary" Twitter card.
   */
  ogImage?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
}): Metadata {
  const canonical = `${SITE_URL}/${locale}${path}`;
  // hreflang map: one entry per supported locale plus `x-default` so Google
  // has a fallback for users whose language doesn't match any of ours.
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${defaultLocale}${path}`;

  const alternateLocale = locales
    .filter((l) => l !== locale)
    .map((l) => OG_LOCALE[l]);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      locale: OG_LOCALE[locale],
      alternateLocale,
      // Only emit width/height when the caller explicitly knows them.
      // Falsely defaulting to 1200×630 for arbitrary speaker photos
      // misleads crawlers; omitting lets them infer from the image itself.
      images: ogImage
        ? [
            {
              url: ogImage.url,
              ...(ogImage.width !== undefined ? { width: ogImage.width } : {}),
              ...(ogImage.height !== undefined ? { height: ogImage.height } : {}),
              alt: ogImage.alt ?? title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage.url] : undefined,
    },
  };
}
