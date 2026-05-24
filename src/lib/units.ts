/**
 * Unit-system helpers for the comparator. The catalog stores every
 * physical measurement in metric (mm + kg) because that's what
 * manufacturer spec sheets use; this module renders those raw numbers
 * in either metric (default) or imperial form depending on the user's
 * choice, surfaced via the `?units=imperial` URL param so the
 * selection is bookmarkable and survives shared links.
 *
 * Only the speaker comparator pages (`/compare`, `/compare4`) honour
 * the toggle today. Other pages — speaker detail, OG images, JSON-LD
 * — keep metric so search engines and unfurls always see the
 * canonical units.
 */

export const UNIT_SYSTEMS = ["metric", "imperial"] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];
export const defaultUnitSystem: UnitSystem = "metric";

/**
 * Coerce an arbitrary URL string into a known {@link UnitSystem}. We
 * accept the literal `"imperial"`; anything else (including missing or
 * malformed values) collapses to `"metric"` so a bogus param can never
 * brick the page.
 */
export function parseUnits(raw: string | undefined | null): UnitSystem {
  return raw === "imperial" ? "imperial" : "metric";
}

const MM_PER_IN = 25.4;
const LB_PER_KG = 2.20462262185;

/** Format a numeric value, trimming a trailing `.0` to keep "165 mm"
 *  style integers tidy while still allowing fractional output ("6.5 in"). */
function fmt(n: number, decimals: number): string {
  const rounded = Number(n.toFixed(decimals));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

/**
 * Cabinet dimensions (height/width/depth) are stored in mm. In imperial
 * mode we show one decimal place — typical cabinets are ~200–500 mm so
 * inches end up in the 7.9–19.7 range where a single decimal is the
 * sweet spot between precision and readability.
 */
export function formatLengthMm(mm: number, units: UnitSystem): string {
  if (units === "imperial") return `${fmt(mm / MM_PER_IN, 1)} in`;
  return `${mm} mm`;
}

/**
 * Driver cone diameters share the same conversion as cabinet lengths
 * but get their own entry point so we can tweak the precision later
 * (e.g. drop to nearest 0.5 in for marketing-style "6.5 in" labels)
 * without disturbing the cabinet path.
 */
export function formatDriverSizeMm(mm: number, units: UnitSystem): string {
  return formatLengthMm(mm, units);
}

/**
 * Cabinet weight is stored in kg. Imperial shows pounds with one decimal
 * (typical cabinets are 5–60 kg → 11–132 lb, where 0.1 lb resolution
 * still feels honest for shipping/handling purposes).
 */
export function formatWeightKg(kg: number, units: UnitSystem): string {
  if (units === "imperial") return `${fmt(kg * LB_PER_KG, 1)} lb`;
  return `${kg} kg`;
}
