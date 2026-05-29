"use client";

import { useRef } from "react";
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
 * Lock-current-picks behaviour: the button is rendered inside the
 * Compare form, so it can read the hidden `<input name="a">…` fields
 * that `<SpeakerPicker>` keeps in sync with each slot. Any filled slot
 * is preserved across the roll — only empty slots get a random fill,
 * the type bucket is forced to match the locked picks, and locked ids
 * are excluded from the sample so the user never sees their own pick
 * roll back at them. With no slot filled the button falls back to its
 * original "fresh random pair" behaviour.
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Look up which `SpeakerType` bucket an id belongs to, or `undefined`
   *  if the id isn't in any bucket (stale URL, mistyped slug). */
  const typeOf = (id: string): SpeakerType | undefined => {
    for (const tp of Object.keys(idsByType) as SpeakerType[]) {
      if (idsByType[tp].includes(id)) return tp;
    }
    return undefined;
  };

  /** Fisher-Yates in place on a copy so the original bucket array is
   *  never mutated (other shuffles in the same session keep their full
   *  pool). Returns the same array for chaining. */
  const fyShuffle = (xs: string[]): string[] => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const onShuffle = () => {
    // Slot keys for this roll — "a", "b", … truncated to `count` so
    // /compare uses [a,b] and /compare4 uses up to [a,b,c,d].
    const slots = Array.from({ length: count }, (_, i) =>
      String.fromCharCode("a".charCodeAt(0) + i)
    );

    // Read the form's current hidden inputs to capture what the user
    // has selected in the pickers but not yet submitted. Slot is empty
    // when the input is missing (e.g. Shuffle rendered outside a form)
    // or its value is blank.
    const form = buttonRef.current?.closest("form") ?? null;
    const currentIds: string[] = slots.map((k) => {
      const input = form?.querySelector<HTMLInputElement>(
        `input[name="${k}"]`
      );
      return input?.value ?? "";
    });
    const lockedIds = currentIds.filter((id) => id && typeOf(id));

    // ── Path A: nothing locked → original "fresh random pair" roll.
    if (lockedIds.length === 0) {
      const eligibleTypes = (Object.keys(idsByType) as SpeakerType[]).filter(
        (k) => idsByType[k].length >= count
      );
      if (eligibleTypes.length === 0) return;
      const weighted = eligibleTypes.flatMap((tp) =>
        Array<SpeakerType>(idsByType[tp].length).fill(tp)
      );
      const pickedType =
        weighted[Math.floor(Math.random() * weighted.length)];
      const sample = fyShuffle(idsByType[pickedType]).slice(0, count);
      const params = new URLSearchParams();
      sample.forEach((id, i) => params.set(slots[i], id));
      router.push(`/${locale}/${target}?${params.toString()}`);
      return;
    }

    // ── Path B: at least one slot is filled.
    // Lock the type to the first locked pick — if the user has mixed
    // types across slots (only possible by hand-editing the URL), we
    // honour the first one and let the other locked id ride along even
    // if it breaks type coherence. The user chose that explicitly; the
    // shuffle's job is to fill the rest, not to police their setup.
    const lockType = typeOf(lockedIds[0])!;
    const pool = idsByType[lockType].filter((id) => !lockedIds.includes(id));
    const needed = count - lockedIds.length;

    if (needed <= 0) {
      // Every slot is already filled. Nothing to shuffle — silently
      // no-op rather than navigate to the exact same URL.
      return;
    }
    if (pool.length < needed) {
      // Not enough same-type alternatives to fill remaining slots.
      // Could happen on a tiny catalog or an exotic type. Silent no-op.
      return;
    }

    const sample = fyShuffle(pool).slice(0, needed);
    const params = new URLSearchParams();
    currentIds.forEach((id, i) => {
      // Preserve locked positions verbatim; replace empty positions
      // with the next sampled id (consuming `sample` in order).
      const v = id && typeOf(id) ? id : sample.shift()!;
      params.set(slots[i], v);
    });
    router.push(`/${locale}/${target}?${params.toString()}`);
  };

  return (
    <button
      ref={buttonRef}
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
