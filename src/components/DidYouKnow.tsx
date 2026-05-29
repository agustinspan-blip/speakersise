"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { TriviaItem } from "@/lib/trivia";

/**
 * Rotating "Did you know?" trivia card. Renders a single trivia at a
 * time and cycles through the list every 15 s with a 300 ms cross-fade.
 *
 * Rotation order: the rotation walks a per-session shuffled permutation
 * of the trivia list so each visitor sees a different opener and a
 * different sequence after that. Initial SSR render uses the unshuffled
 * order (so hydration matches the server DOM byte-for-byte); the Fisher-
 * Yates pass runs in a `useEffect` after mount, which causes a single
 * harmless re-render that swaps the opener to a random card. The
 * reduced-motion media query disables the cross-fade but keeps the
 * rotation timer; visitors who prefer less motion still get the variety.
 */
export function DidYouKnow({
  trivia,
  locale,
  t,
}: {
  trivia: TriviaItem[];
  locale: Locale;
  t: Dictionary;
}) {
  // `order` is the rotation permutation — a list of indices into
  // `trivia`. SSR ships [0,1,2,…] so server DOM matches the first
  // client render; the mount effect below replaces it with a shuffled
  // copy so the user-visible sequence is randomised.
  const [order, setOrder] = useState<number[]>(() =>
    trivia.map((_, i) => i)
  );
  const [pos, setPos] = useState(0);
  const [fading, setFading] = useState(false);
  // Track the fade-swap timeout so unmount can cancel it — without
  // this, the timeout's setState would fire on an unmounted component
  // after navigating away from the home page.
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One-time shuffle on mount. Fisher-Yates over the full index range
  // so the opening card is random too (not pinned to trivia[0]). The
  // visible "flash" from index 0 → random index lands during hydration,
  // which on a typical page is below the fold; users scrolling down
  // will only ever see the shuffled state.
  useEffect(() => {
    if (trivia.length <= 1) return;
    setOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }, [trivia.length]);

  useEffect(() => {
    if (order.length <= 1) return;
    const tick = setInterval(() => {
      setFading(true);
      swapTimeoutRef.current = setTimeout(() => {
        setPos((p) => (p + 1) % order.length);
        setFading(false);
      }, 300);
    }, 15000);
    return () => {
      clearInterval(tick);
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    };
  }, [order.length]);

  if (trivia.length === 0) return null;
  const current = trivia[order[pos] ?? 0];

  return (
    <section className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-8 sm:px-10 sm:py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 font-medium mb-4 text-center">
          {t.home.didYouKnowEyebrow}
        </p>
        <p
          className="text-center text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed transition-opacity duration-300 motion-reduce:transition-none min-h-[3em]"
          style={{ opacity: fading ? 0 : 1 }}
          aria-live="polite"
        >
          <span aria-hidden className="mr-2 text-amber-600 dark:text-amber-400">
            ✦
          </span>
          {current[locale]}
        </p>
      </div>
    </section>
  );
}
