import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Paired call-to-action: TrueScale (2-way at-scale comparator) + TrueSpecs
 * (4-way photo+specs grid). Used in the home/brand hero and on the speaker
 * detail page — the user lands on the same two-button block whichever entry
 * point they came through.
 *
 * Each button carries a small Lucide-style icon so the two products read
 * as distinct affordances at a glance: a ruler for TrueScale (real-size
 * comparison) and a 2×2 table for TrueSpecs (spec sheet for up to 4 units).
 *
 * Colour is always amber sitewide so these read as the site's primary
 * product surface, independent of any brand colour theme present on the
 * page (Dali red, Monitor Audio black, etc. don't bleed into them).
 *
 * `prefillId`, when set, adds `?a=<id>` to both targets so a user clicking
 * either button arrives with this speaker pre-selected as the first slot.
 */
export function NavCTAs({
  locale,
  t,
  prefillId,
  className,
}: {
  locale: Locale;
  t: Dictionary;
  /** Speaker id to pre-select as the first slot on both targets. */
  prefillId?: string;
  /** Extra layout classes for the wrapper (margin, alignment, etc.). */
  className?: string;
}) {
  const ctaBg =
    "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400";

  const compareHref = prefillId
    ? `/${locale}/compare?a=${prefillId}`
    : `/${locale}/compare`;
  const compare4Href = prefillId
    ? `/${locale}/compare4?a=${prefillId}`
    : `/${locale}/compare4`;

  const buttonCls = `h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full ${ctaBg} text-white text-sm font-medium transition-colors`;
  // Caption: bumped contrast a step (stone-700 / stone-300) so the legend
  // doesn't read as "noise" next to the CTA. Was stone-600 / stone-400.
  const captionCls =
    "mt-2 text-xs text-stone-700 dark:text-stone-300 leading-snug";

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 max-w-xl ${className ?? ""}`}
    >
      <div>
        <Link href={compareHref} className={buttonCls}>
          <RulerIcon />
          {t.nav.compareCta}
        </Link>
        <p className={captionCls}>{t.home.trueScaleDesc}</p>
      </div>
      <div>
        <Link href={compare4Href} className={buttonCls}>
          <TableIcon />
          {t.nav.techSpecs}
        </Link>
        <p className={captionCls}>{t.home.techSpecsDesc}</p>
      </div>
    </div>
  );
}

/* ---------- Inline icons (Lucide-style, 16×16, currentColor) ---------- */

function RulerIcon() {
  // Diagonal ruler with notch marks — reads as "measure / true scale".
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z" />
      <path d="m7.5 10.5 2 2" />
      <path d="m10.5 7.5 2 2" />
      <path d="m13.5 4.5 2 2" />
      <path d="m4.5 13.5 2 2" />
    </svg>
  );
}

function TableIcon() {
  // 2×2 grid — reads as "table of specs across multiple speakers".
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18" />
      <path d="M12 3v18" />
    </svg>
  );
}
