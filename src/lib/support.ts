/**
 * Configuration for the donations / support page.
 *
 * To activate real donations:
 *   1. Create a Ko-fi account at https://ko-fi.com (free) and pick a handle.
 *   2. Replace `KOFI_HANDLE` below with your handle.
 *   3. The buttons on /support already point at the right URLs.
 *
 * Until then the buttons link to the public Ko-fi homepage so nothing 404s.
 */

export const KOFI_HANDLE = ""; // e.g. "agustin-hifisise"

export const KOFI_URL = KOFI_HANDLE
  ? `https://ko-fi.com/${KOFI_HANDLE}`
  : "https://ko-fi.com";

/** Build a Ko-fi URL with a pre-selected amount in USD. */
export function kofiAmountUrl(amountUsd: number): string {
  // Ko-fi accepts an `amount` query parameter on the standalone donation page.
  // The handle path `/<handle>?ko_pay_amount=<n>` works once the account exists.
  if (!KOFI_HANDLE) return KOFI_URL;
  return `${KOFI_URL}?ko_pay_amount=${amountUsd}`;
}

export interface DonationTier {
  /** Translation key under `support.tier*` */
  labelKey: "Coffee" | "CD" | "Record";
  /** Translation key under `support.tier*Blurb` */
  blurbKey: "CoffeeBlurb" | "CDBlurb" | "RecordBlurb";
  amountUsd: number;
  /** Fallback emoji when no `iconSrc` is set, or for very small renders. */
  emoji: string;
  /**
   * Optional image asset (PNG/SVG under /public). When set, the support
   * page renders the image instead of the emoji — used for tiers where
   * Unicode lacks a faithful glyph (e.g. vinyl records).
   */
  iconSrc?: string;
}

/** Donation tiers shown on the support page. */
export const DONATION_TIERS: DonationTier[] = [
  { labelKey: "Coffee", blurbKey: "CoffeeBlurb", amountUsd: 5, emoji: "☕" },
  { labelKey: "CD", blurbKey: "CDBlurb", amountUsd: 15, emoji: "💿" },
  // Unicode has no real vinyl glyph, so render a custom SVG illustration.
  // The emoji is kept as a screen-reader / fallback hint only.
  {
    labelKey: "Record",
    blurbKey: "RecordBlurb",
    amountUsd: 40,
    emoji: "🎶",
    iconSrc: "/icons/vinyl.svg",
  },
];

/**
 * Public roadmap rendered on the support page. Keep entries in priority order
 * (top of the list = next thing to ship). Edit this list freely as the
 * project evolves; the support page reflects it automatically.
 *
 * Kept short on purpose: visitors don't need a backlog, they need to see
 * the next 3-4 things worth waiting for. Shipped items get removed from
 * here and replaced by the actual catalog/feature.
 */
export type RoadmapStatus = "next" | "soon" | "later";

/** Translation keys under `t.support.roadmapItems.*`. */
export type RoadmapTitleKey =
  | "klipsch"
  | "soonBrandsA"
  | "soonBrandsB"
  | "speakerWhereToBuy"
  | "trueHiFi";

export interface RoadmapItem {
  titleKey: RoadmapTitleKey;
  status: RoadmapStatus;
}

export const ROADMAP: RoadmapItem[] = [
  { titleKey: "klipsch", status: "next" },
  { titleKey: "soonBrandsA", status: "soon" },
  { titleKey: "soonBrandsB", status: "soon" },
  { titleKey: "speakerWhereToBuy", status: "later" },
  { titleKey: "trueHiFi", status: "later" },
];
