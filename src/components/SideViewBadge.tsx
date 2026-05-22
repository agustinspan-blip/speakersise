import type { Dictionary } from "@/lib/i18n";

/**
 * Discreet "side view available" badge — a small pill containing a
 * Lucide-style cube icon that floats on the hero image of speakers
 * shipping with `images.side` metadata. Signals that the cabinet has
 * a profile representation (and, by extension, that the /compare page
 * can render a profile-mode comparison when paired with another
 * side-view-equipped speaker).
 *
 * Always renders absolutely positioned, so the parent must be
 * `position: relative`. Default placement is top-right with a small
 * inset; pass `position` to swap to other corners when the layout
 * calls for it (small thumbnails, etc.).
 */
export function SideViewBadge({
  t,
  position = "top-right",
  size = "md",
}: {
  t: Dictionary;
  /** Which corner of the parent to anchor in. */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** `md` is the default 28-px pill; `sm` is a 22-px variant for
   *  small thumbnails (catalog cards). */
  size?: "sm" | "md";
}) {
  const corner =
    position === "top-right"
      ? "top-3 right-3"
      : position === "top-left"
        ? "top-3 left-3"
        : position === "bottom-right"
          ? "bottom-3 right-3"
          : "bottom-3 left-3";
  const dimensions = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  // Anchor the tooltip to the opposite horizontal edge of the badge so it
  // never spills outside the hero container. Vertical placement follows
  // the badge's corner — top corners drop the tooltip below, bottom
  // corners raise it above.
  const isTop = position.startsWith("top");
  const isRight = position.endsWith("right");
  const tooltipPosition = [
    isTop ? "top-full mt-2" : "bottom-full mb-2",
    isRight ? "right-0" : "left-0",
  ].join(" ");

  return (
    <span
      className={`group absolute ${corner} inline-flex items-center justify-center ${dimensions} rounded-full bg-white/90 backdrop-blur border border-stone-200 text-stone-600 shadow-sm cursor-help`}
      tabIndex={0}
      role="button"
      aria-label={t.detail.sideViewTooltip}
    >
      <CubeIcon size={size} />
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${tooltipPosition} z-10 w-56 rounded-md bg-stone-900 px-3 py-2 text-[11px] leading-snug font-normal text-white shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0`}
      >
        {t.detail.sideViewTooltip}
      </span>
    </span>
  );
}

function CubeIcon({ size }: { size: "sm" | "md" }) {
  const px = size === "sm" ? 12 : 14;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
