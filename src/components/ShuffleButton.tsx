"use client";

import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SpeakerType } from "@/lib/types";

/**
 * "Shuffle" — pick a random comparison without picking the speakers
 * yourself. Tied to the same URL contract as the Compare form so a
 * shuffled URL is just as bookmarkable / shareable as a hand-picked one.
 *
 * Type-coherence guard: a random comparison only makes sense between
 * speakers of the same `SpeakerType`. The button rolls a type first
 * (weighted by population so bookshelves and floorstanders show up
 * proportionally), then samples `count` distinct speakers from that
 * pool. If a type has fewer than `count` entries the roll re-picks
 * the other type; if neither has enough the button silently no-ops.
 *
 * Implementation note: lives as a client component because the random
 * pick has to happen on the user's click, not at SSR time. Receives the
 * already-bucketed id lists so the JSON payload is tiny (~3-4 KB for
 * the current 189-speaker catalog) and the bundle doesn't have to ship
 * the full Speaker objects.
 */
export function ShuffleButton({
  locale,
  t,
  target,
  count,
  idsByType,
  className = "",
}: {
  locale: Locale;
  t: Dictionary;
  /** Which comparator page to navigate to. */
  target: "compare" | "compare4";
  /** How many speakers to sample (2 for /compare, up to 4 for /compare4). */
  count: 2 | 3 | 4;
  /** Speaker ids bucketed by physical type, supplied from the server page. */
  idsByType: Record<SpeakerType, string[]>;
  className?: string;
}) {
  const router = useRouter();

  const onShuffle = () => {
    // 1. Decide which type to sample from. Build a weighted list where
    //    each type appears N times (N = number of speakers of that
    //    type) so big buckets are picked more often, matching the
    //    catalog's actual distribution.
    const eligibleTypes = (Object.keys(idsByType) as SpeakerType[]).filter(
      (k) => idsByType[k].length >= count
    );
    if (eligibleTypes.length === 0) return; // nothing to shuffle

    const weighted = eligibleTypes.flatMap((tp) =>
      Array<SpeakerType>(idsByType[tp].length).fill(tp)
    );
    const pickedType = weighted[Math.floor(Math.random() * weighted.length)];

    // 2. Sample `count` distinct ids from the picked bucket. Fisher-
    //    Yates shuffle on a copy, then slice — O(N) without needing
    //    a Set membership probe loop.
    const pool = [...idsByType[pickedType]];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const sample = pool.slice(0, count);

    // 3. Build the URL using the same `a=…&b=…&c=…&d=…` contract as the
    //    hand-pick form so the result is shareable / bookmarkable.
    const params = new URLSearchParams();
    sample.forEach((id, i) => {
      params.set(String.fromCharCode("a".charCodeAt(0) + i), id);
    });
    router.push(`/${locale}/${target}?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={onShuffle}
      title={t.compare.shuffleTitle}
      aria-label={t.compare.shuffleTitle}
      className={[
        "h-10 px-5 inline-flex items-center justify-center gap-2",
        "rounded-full border border-stone-300 dark:border-stone-700",
        "bg-white dark:bg-stone-900",
        "text-stone-700 dark:text-stone-200 text-sm font-medium",
        "hover:border-amber-600 dark:hover:border-amber-500",
        "hover:text-amber-700 dark:hover:text-amber-400",
        "transition-colors",
        className,
      ].join(" ")}
    >
      <ShuffleIcon />
      <span>{t.compare.shuffle}</span>
    </button>
  );
}

/** Lucide-style shuffle icon: two arrows crossing through a junction. */
function ShuffleIcon() {
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
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}
