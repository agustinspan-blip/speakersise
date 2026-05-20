import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Persistent floating call-to-action surfaced on every page so the user
 * always has a one-click path into the comparator tools. Replaces the role
 * the header used to play before TrueScale/TrueSpecs were pulled out of it.
 *
 *   - `mode="both"` (default): two pills side by side — TrueScale + TrueSpecs.
 *     Use on every page **except** the two compare pages themselves.
 *   - `mode="to-compare4"`: single pill linking to /compare4. Use on /compare.
 *   - `mode="to-compare"`: single pill linking to /compare. Use on /compare4.
 *
 * Layout: fixed bottom-right on desktop (floats over content with a soft
 * shadow); full-width bottom bar on mobile so the touch targets are easy
 * to reach. Both viewports respect the iOS safe-area inset.
 *
 * Note about overlap: pages that show this should reserve ~80 px of bottom
 * padding on `<main>` for mobile so the floater doesn't cover the last
 * line of content. The wrapping `<div>` in each page already handles this
 * via the `pb-28 sm:pb-0` modifier added during the redesign.
 */
export function CompareCTA({
  locale,
  t,
  mode = "both",
  prefillId,
}: {
  locale: Locale;
  t: Dictionary;
  mode?: "both" | "to-compare4" | "to-compare";
  /** Speaker id to pre-select as the first slot on the targets. */
  prefillId?: string;
}) {
  const pillBg =
    "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400";
  const pillCls = `inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full ${pillBg} text-white text-sm font-medium shadow-lg shadow-amber-900/20 transition-colors whitespace-nowrap`;

  const compareHref = prefillId
    ? `/${locale}/compare?a=${prefillId}`
    : `/${locale}/compare`;
  const compare4Href = prefillId
    ? `/${locale}/compare4?a=${prefillId}`
    : `/${locale}/compare4`;

  const trueScalePill = (
    <Link href={compareHref} className={pillCls}>
      <RulerIcon />
      <span>{t.nav.compareCta}</span>
    </Link>
  );
  const trueSpecsPill = (
    <Link href={compare4Href} className={pillCls}>
      <TableIcon />
      <span>{t.nav.techSpecs}</span>
    </Link>
  );

  let content: React.ReactNode;
  if (mode === "to-compare4") {
    content = trueSpecsPill;
  } else if (mode === "to-compare") {
    content = trueScalePill;
  } else {
    content = (
      <>
        {trueScalePill}
        {trueSpecsPill}
      </>
    );
  }

  return (
    <div
      aria-label={t.nav.compareCta}
      className={[
        // Positioning: full-width bar on phones, floating on >= sm.
        "fixed z-30 left-0 right-0 bottom-0 px-4 pb-3 pt-2",
        "sm:left-auto sm:right-6 sm:bottom-6 sm:px-0 sm:pb-0 sm:pt-0",
        // Honour iOS safe-area at the bottom on phones.
        "[padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]",
        // Subtle gradient backdrop on mobile so the pills stay legible
        // over arbitrary content; transparent on desktop.
        "bg-gradient-to-t from-stone-50/90 to-stone-50/0 dark:from-stone-950/90 dark:to-stone-950/0",
        "sm:from-transparent sm:to-transparent sm:dark:from-transparent sm:dark:to-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex items-center justify-center gap-2 sm:justify-end sm:gap-3">
        {content}
      </div>
    </div>
  );
}

/* ---------- Inline icons (kept in-file for one-shot use; same shapes as
 * <NavCTAs /> so the affordance carries the same visual identifier
 * whether the user sees the in-page block or the persistent floater). */

function RulerIcon() {
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
