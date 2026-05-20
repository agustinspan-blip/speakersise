/**
 * Curated "most-searched" rankings shown as the two top-5 counters on the
 * home page (one per speaker type). Today this is a hand-maintained list —
 * once real tracking is plugged in (Vercel KV / Upstash Redis on a per-id
 * counter incremented from the speaker detail and compare flows), this
 * file becomes the single seam to swap: replace the constant with a
 * `getTopFive(type)` server function that reads the live counters.
 *
 * Each id MUST exist in `src/data/speakers/` — `getPopularSpeakers()`
 * silently filters out anything that no longer resolves so a stale entry
 * here doesn't crash the home page.
 */

import { getSpeakerById } from "@/lib/speakers";
import type { Speaker, SpeakerType } from "@/lib/types";

/** Top-5 ids per speaker type, ordered #1 → #5. Edit by hand. */
export const POPULAR_BY_TYPE: Record<SpeakerType, string[]> = {
  bookshelf: [
    "dali-menuet",
    "monitor-audio-bronze-50-7g",
    "dynaudio-special-forty",
    "dali-oberon-1",
    "monitor-audio-silver-100-7g",
  ],
  floorstander: [
    "dali-oberon-7",
    "monitor-audio-silver-300-7g",
    "dynaudio-confidence-30",
    "dali-rubicon-6",
    "monitor-audio-gold-300-6g",
  ],
};

/**
 * Resolves the curated id list to actual Speaker objects, dropping any id
 * that no longer exists. Returns at most `limit` items.
 */
export function getPopularSpeakers(
  type: SpeakerType,
  limit = 5
): Speaker[] {
  const ids = POPULAR_BY_TYPE[type] ?? [];
  return ids
    .map((id) => getSpeakerById(id))
    .filter((s): s is Speaker => Boolean(s))
    .slice(0, limit);
}
