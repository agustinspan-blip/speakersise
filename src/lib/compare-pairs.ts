import { getAllSpeakers, getSpeakerById } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";

/**
 * Strategic speaker ids used to seed the long-tail `/compare/<slug>`
 * pre-rendered pages. We pre-render same-type pairs across brands for
 * these picks so search engines have indexable, canonical URLs for the
 * comparisons people actually type into Google ("KEF LS50 Meta vs
 * Wharfedale Linton", "BW 805 D4 vs Persona B", etc.).
 *
 * Curated by hand to mix popularity tiers and span the brand roster.
 * Adding an id here grows the pre-render set by O(N) pairs; keep the
 * list to ~25 per type so the build time and sitemap stay bounded.
 *
 * Any id that no longer resolves is silently dropped — see
 * `getStrategicSpeakers()` below.
 */
export const STRATEGIC_IDS: { bookshelf: string[]; floorstander: string[] } = {
  bookshelf: [
    // KEF
    "kef-ls50-meta",
    "kef-q1-meta",
    "kef-q3-meta",
    "kef-r3-meta",
    // Bowers & Wilkins
    "bowers-wilkins-705-s3",
    "bowers-wilkins-805-d4",
    // Wharfedale
    "wharfedale-linton",
    // Dali
    "dali-menuet",
    "dali-epicon-2",
    "dali-rubicon-2",
    // Klipsch
    "klipsch-rp-600m-ii",
    "klipsch-rp-500m-ii",
    "klipsch-ojas-ko-r1",
    // Sonus faber
    "sonus-faber-lumina-i",
    "sonus-faber-lumina-ii",
    // Focal
    "focal-aria-evo-x-n1",
    // Monitor Audio
    "monitor-audio-silver-100-7g",
    // Polk
    "polk-reserve-r200",
    // Paradigm
    "paradigm-persona-b",
    "paradigm-founder-40b",
    // Dynaudio
    "dynaudio-special-forty",
    // Dutch & Dutch
    "dutch-dutch-8c",
  ],
  floorstander: [
    // KEF
    "kef-r5-meta",
    "kef-q11-meta",
    "kef-reference-5-meta",
    // Bowers & Wilkins
    "bowers-wilkins-801-d4",
    "bowers-wilkins-802-d4",
    "bowers-wilkins-804-d4",
    // Dali
    "dali-epicon-8",
    "dali-rubicon-6",
    // Klipsch
    "klipsch-la-scala-al5",
    "klipsch-la-scala-al6",
    "klipsch-klipschorn-ak6",
    "klipsch-klipschorn-ak7",
    "klipsch-jubilee",
    "klipsch-rp-6000f-ii",
    "klipsch-rp-8000f-ii",
    // Sonus faber
    "sonus-faber-olympica-nova-iii",
    "sonus-faber-stradivari-g2",
    // Focal
    "focal-sopra-n3",
    "focal-grande-utopia-em-evo",
    // Monitor Audio
    "monitor-audio-gold-300-6g",
    "monitor-audio-platinum-300-3g",
    // Polk
    "polk-reserve-r700",
    "polk-legend-l800",
    // Paradigm
    "paradigm-persona-9h",
    // Dynaudio
    "dynaudio-confidence-50",
    // Canton
    "canton-reference-7",
  ],
};

/**
 * Resolve the curated ids to live Speaker objects. Filters out anything
 * that doesn't exist in the catalogue today (e.g. a renamed id), since
 * generateStaticParams can't tolerate missing entries.
 */
function getStrategicSpeakers(): { bookshelf: Speaker[]; floorstander: Speaker[] } {
  return {
    bookshelf: STRATEGIC_IDS.bookshelf
      .map((id) => getSpeakerById(id))
      .filter((s): s is Speaker => Boolean(s)),
    floorstander: STRATEGIC_IDS.floorstander
      .map((id) => getSpeakerById(id))
      .filter((s): s is Speaker => Boolean(s)),
  };
}

/**
 * Build the canonical pair list for pre-rendering. Each pair:
 *   - same speaker type (a bookshelf next to a floorstander is rarely a
 *     real-world shopping comparison)
 *   - different brand (within-brand pairs e.g. "KEF LS50 vs KEF Q3" are
 *     better handled by the brand page than by a long-tail compare URL)
 *   - id ordered alphabetically so each pair has exactly one canonical
 *     slug — no `a-vs-b` AND `b-vs-a` duplicates eating crawl budget
 *
 * If the strategic list grows large the cross product can balloon; we
 * cap at MAX_PAIRS so the build/sitemap stays manageable.
 */
const MAX_PAIRS = 250;

export function getStrategicPairs(): Array<{ a: Speaker; b: Speaker }> {
  const { bookshelf, floorstander } = getStrategicSpeakers();
  const pairs: Array<{ a: Speaker; b: Speaker }> = [];

  function addPairsFrom(speakers: Speaker[]) {
    const sorted = [...speakers].sort((x, y) => x.id.localeCompare(y.id));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.brand === b.brand) continue;
        pairs.push({ a, b });
      }
    }
  }

  addPairsFrom(bookshelf);
  addPairsFrom(floorstander);
  return pairs.slice(0, MAX_PAIRS);
}

/**
 * Encode a pair as the URL slug used by /compare/<slug>. The format is
 * `<a-id>-vs-<b-id>` with the ids ordered alphabetically (canonical).
 */
export function pairSlug(a: Speaker, b: Speaker): string {
  return a.id < b.id ? `${a.id}-vs-${b.id}` : `${b.id}-vs-${a.id}`;
}

/**
 * Parse a /compare/<slug> URL back into two speaker objects. Returns
 * null if either id is unknown, the slug doesn't follow the convention,
 * or the two halves resolve to the same speaker.
 *
 * The split is tricky because each id can contain hyphens (e.g.
 * "klipsch-rp-600m-ii"), so we split on " -vs- " positions and try
 * each candidate until we find a parse that resolves both halves to
 * real speakers.
 */
export function parsePairSlug(
  slug: string
): { a: Speaker; b: Speaker } | null {
  // Find every "-vs-" occurrence and try splitting there. Most slugs
  // have only one but the search guarantees we hit the right one even
  // if a model name ever contains "vs".
  const positions: number[] = [];
  for (let i = 0; i < slug.length; i++) {
    if (slug.slice(i, i + 4) === "-vs-") positions.push(i);
  }
  for (const pos of positions) {
    const aId = slug.slice(0, pos);
    const bId = slug.slice(pos + 4);
    const a = getSpeakerById(aId);
    const b = getSpeakerById(bId);
    if (a && b && a.id !== b.id) return { a, b };
  }
  return null;
}

/**
 * Flatten the pair list into the route-segment shape Next expects from
 * `generateStaticParams`. Returns one entry per slug — locale fan-out
 * is handled at the page level since this list is locale-agnostic.
 */
export function getStrategicPairSlugs(): string[] {
  const pairs = getStrategicPairs();
  // Use a Set to dedupe in case the strategic lists overlap somehow.
  const slugs = new Set<string>();
  for (const { a, b } of pairs) {
    slugs.add(pairSlug(a, b));
  }
  return Array.from(slugs);
}

/**
 * Every pre-rendered strategic comparison that includes `speakerId`,
 * as `{ other, slug }` — the OTHER speaker in the pair plus the
 * canonical `/compare/<slug>` segment. Powers the "Compare with…"
 * section on the speaker detail page, which is the internal-linking
 * surface that de-orphans the compare-slug pages (they previously
 * lived only in the sitemap, so Google left them "Discovered –
 * currently not indexed").
 */
export function getStrategicPairsForSpeaker(
  speakerId: string
): Array<{ other: Speaker; slug: string }> {
  const out: Array<{ other: Speaker; slug: string }> = [];
  for (const { a, b } of getStrategicPairs()) {
    if (a.id === speakerId) out.push({ other: b, slug: pairSlug(a, b) });
    else if (b.id === speakerId) out.push({ other: a, slug: pairSlug(a, b) });
  }
  return out;
}

/**
 * Diagnostic: catalogue ids that are listed in STRATEGIC_IDS but no
 * longer resolve. Surfaced only as a JSON Lambda we can hit during
 * audits — useful to spot rot when speakers get renamed.
 */
export function getStrategicMissingIds(): string[] {
  const all = new Set(getAllSpeakers().map((s) => s.id));
  return [...STRATEGIC_IDS.bookshelf, ...STRATEGIC_IDS.floorstander].filter(
    (id) => !all.has(id)
  );
}
