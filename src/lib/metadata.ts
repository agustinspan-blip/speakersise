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

/**
 * Site-wide fallback OG card. Used whenever a page doesn't pass an
 * explicit `ogImage` — covers the home, brands, contact, support and
 * compare4 surfaces so every share unfurls with a branded preview
 * instead of the platform's "no image found" empty state.
 *
 * Asset lives at `/public/og-default.png` (1200×630, ~90 KB).
 */
const DEFAULT_OG_IMAGE = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: "TrueScale — compare HiFi speakers at true scale",
} as const;

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

  // Pick the OG asset to use: the caller's explicit `ogImage` when set
  // (speaker detail uses the speaker's hero photo), otherwise the
  // site-wide default card so no share unfurls without an image.
  const effectiveOg = ogImage
    ? {
        url: ogImage.url,
        width: ogImage.width,
        height: ogImage.height,
        alt: ogImage.alt ?? title,
      }
    : { ...DEFAULT_OG_IMAGE, alt: DEFAULT_OG_IMAGE.alt };

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
      images: [
        {
          url: effectiveOg.url,
          ...(effectiveOg.width !== undefined
            ? { width: effectiveOg.width }
            : {}),
          ...(effectiveOg.height !== undefined
            ? { height: effectiveOg.height }
            : {}),
          alt: effectiveOg.alt,
        },
      ],
    },
    twitter: {
      // We always have an image now (either caller-provided or default),
      // so the larger Twitter card layout is always the right shape.
      card: "summary_large_image",
      title,
      description,
      images: [effectiveOg.url],
    },
  };
}
