/**
 * Sponsors registry. Drop entries here when a partnership exists; the
 * <SponsorBanner /> component picks one at random per render and shows it
 * in the reserved slot above the catalog grid (and above the brand-page
 * model grid). When the array is empty, the component renders the
 * dashed-border placeholder used to advertise availability.
 *
 * Each entry should declare a name, an image URL (square or 3:1 ratio),
 * the destination href (where the click sends the user), and an optional
 * short tagline shown beneath the image. `darkInvert` mirrors the brand-
 * logo convention: true (default) inverts the asset in dark mode for
 * monochrome wordmarks; false preserves the original colours.
 */

export interface Sponsor {
  /** Display name — used as the image alt and shown beneath the asset. */
  name: string;
  /** Path under `/public` (e.g. `/sponsors/acme.png`) or full URL. */
  imageSrc: string;
  /** Click target. External URLs open in a new tab automatically. */
  href: string;
  /** Optional short tagline (~6 words). Rendered below the name. */
  tagline?: string;
  /** Set to false to preserve original colours in dark mode. */
  darkInvert?: boolean;
}

/**
 * Active sponsors. Keep this list short — the banner cycles through them
 * one at a time so a long list dilutes per-sponsor impressions.
 */
export const SPONSORS: Sponsor[] = [];

/**
 * Returns one sponsor chosen at random, or `null` when none are active.
 * Random selection runs on the server per render, so each page load
 * shows a different sponsor; the surface itself is server-rendered so
 * the choice is stable for the duration of any single navigation.
 */
export function pickSponsor(): Sponsor | null {
  if (SPONSORS.length === 0) return null;
  return SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
}
