"use client";

import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { TriviaItem } from "@/lib/trivia";

/**
 * Rotating "Did you know?" trivia card. Renders a single trivia at a
 * time and cycles through the list every 15 s with a 300 ms cross-fade.
 *
 * Initial render is deterministic (always trivia[0]) so SSR matches
 * hydration — variety comes from the rotation itself, not a randomised
 * opener. The reduced-motion media query disables the fade transition
 * but keeps the rotation timer; visitors who prefer less motion still
 * see the variety, just without the animation.
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
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (trivia.length <= 1) return;
    const tick = setInterval(() => {
      setFading(true);
      const swap = setTimeout(() => {
        setIdx((i) => (i + 1) % trivia.length);
        setFading(false);
      }, 300);
      return () => clearTimeout(swap);
    }, 15000);
    return () => clearInterval(tick);
  }, [trivia.length]);

  if (trivia.length === 0) return null;
  const current = trivia[idx];

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
