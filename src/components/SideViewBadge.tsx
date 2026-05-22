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

  return (
    <span
      className={`absolute ${corner} inline-flex items-center justify-center ${dimensions} rounded-full bg-white/90 backdrop-blur border border-stone-200 text-stone-600 shadow-sm pointer-events-none`}
      aria-label={t.detail.sideViewAvailable}
      title={t.detail.sideViewAvailable}
    >
      <CubeIcon size={size} />
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
