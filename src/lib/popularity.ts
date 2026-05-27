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

/**
 * Top-5 ids per speaker type, ordered #1 → #5. Edit by hand.
 *
 * Curation principles for the launch list (10 unique brands across the 10
 * slots): showcase the breadth of the catalog rather than weight by one
 * label, and mix entry/mid-tier with flagships so the strip reads as
 * "popular HiFi" rather than "expensive HiFi only".
 *
 * Typed as `Partial` because not every type necessarily warrants a
 * curated Top-5 — a type with no entry just yields an empty list.
 */
export const POPULAR_BY_TYPE: Partial<Record<SpeakerType, string[]>> = {
  bookshelf: [
    "kef-ls50-meta",
    "wharfedale-linton",
    "klipsch-rp-600m-ii",
    "dali-menuet",
    "dynaudio-special-forty",
  ],
  floorstander: [
    "bowers-wilkins-802-d4",
    "focal-sopra-n3",
    "sonus-faber-olympica-nova-iii",
    "monitor-audio-gold-300-6g",
    "polk-legend-l800",
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
