"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Persistent floating call-to-action into the comparator tools — used
 * **only on the home page** (`/[locale]/page.tsx`). Other pages have
 * dropped the floater so the in-page CTAs (`<NavCTAs>` on the hero,
 * "Compare with…" buttons on speaker pages, etc.) do the work alone
 * without doubling up.
 *
 *   - `mode="both"` (default): two pills side by side — TrueScale + TrueSpecs.
 *   - `mode="to-compare4"` / `mode="to-compare"`: single-pill modes used by
 *     past callers (now unused; kept for backwards compatibility).
 *
 * Layout: fixed bottom-right on desktop (floats over content with a soft
 * shadow); full-width bottom bar on mobile so the touch targets are easy
 * to reach. Both viewports respect the iOS safe-area inset.
 *
 * Mobile gate (`showAfterSelector`): when a selector is passed, the floater
 * stays hidden on phones while that element is in the viewport. On the
 * home page this points at the hero's `<NavCTAs id="hero-ctas">` so the
 * floating row only appears once the user scrolls past the static buttons —
 * avoids two identical TrueScale/TrueSpecs rows stacking on mobile. Desktop
 * ignores the gate (the floater lives in the bottom-right corner where it
 * doesn't compete with the in-page block).
 *
 * Footer awareness: when the page footer (BrandStrip's `<footer>` element)
 * scrolls into view, this widget fades out on every viewport so the
 * floating pills don't overlap the footer's utility row. Implemented via
 * IntersectionObserver; falls back to "always visible" if no footer is
 * present on the page.
 *
 * Note about overlap: the home reserves ~80 px of bottom padding on its
 * `<main>` for mobile so the floater doesn't cover the last line of
 * content (`pb-28 sm:pb-0` pattern).
 */
export function CompareCTA({
  locale,
  t,
  mode = "both",
  prefillId,
  showAfterSelector,
}: {
  locale: Locale;
  t: Dictionary;
  mode?: "both" | "to-compare4" | "to-compare";
  /** Speaker id to pre-select as the first slot on the targets. */
  prefillId?: string;
  /**
   * Optional CSS selector for an in-page element (typically the hero
   * `<NavCTAs>` block) whose visibility should suppress this floater
   * on mobile. While the selector matches an element that's still
   * intersecting the viewport, the floater stays hidden under sm —
   * so the user doesn't see two identical TrueScale/TrueSpecs button
   * rows stacked on top of each other. Desktop ignores the gate; the
   * floater sits in the bottom-right where it doesn't compete with
   * the in-page buttons.
   */
  showAfterSelector?: string;
}) {
  // True when the page footer is intersecting the viewport. Drives a
  // CSS opacity fade so the floating pills don't visually collide with
  // the footer's utility row. SSR renders with the floater visible
  // (footerVisible = false) — hydration kicks in the observer after.
  const [footerVisible, setFooterVisible] = useState(false);

  // True when the `showAfterSelector` element is intersecting the
  // viewport (i.e. user hasn't scrolled past it yet). Initialise to
  // `true` when a selector is provided — pessimistic default so the
  // first paint on mobile hides the floater until the observer
  // confirms one way or the other. With no selector, gate is disabled.
  const [showAfterElementVisible, setShowAfterElementVisible] = useState(
    Boolean(showAfterSelector)
  );

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setFooterVisible(entry.isIntersecting);
      },
      // Trigger the fade a few pixels before the footer's true top edge
      // crosses into view so the handoff feels intentional rather than a
      // last-second snap.
      { rootMargin: "0px 0px -40px 0px", threshold: 0 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showAfterSelector || typeof IntersectionObserver === "undefined") {
      return;
    }
    const el = document.querySelector(showAfterSelector);
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setShowAfterElementVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showAfterSelector]);

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

  // Visibility resolution — three layered states:
  //   1. Footer in view → hidden on all viewports (handoff to footer's
  //      utility row).
  //   2. Otherwise, if `showAfterSelector` is provided and that element is
  //      still on screen → hidden on mobile only (the in-page buttons are
  //      already serving the same purpose); desktop keeps the floater
  //      because it sits in the bottom-right corner, out of the way.
  //   3. Default → visible on all viewports.
  // Pointer-events follow opacity so a faded-out floater can't intercept
  // clicks meant for content underneath.
  const hiddenEverywhere = footerVisible;
  const hiddenOnMobileOnly = !hiddenEverywhere && showAfterElementVisible;
  const opacityCls = hiddenEverywhere
    ? "opacity-0 pointer-events-none"
    : hiddenOnMobileOnly
      ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto"
      : "opacity-100 pointer-events-auto";

  return (
    <div
      aria-label={t.nav.compareCta}
      // Hide from accessibility tree while faded out so screen readers
      // don't announce a button the user can't see — the same row of
      // links lives inside the footer / in the in-page hero block.
      aria-hidden={hiddenEverywhere ? true : undefined}
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
        // Visibility — see resolution block above.
        "transition-opacity duration-200 ease-out",
        opacityCls,
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
