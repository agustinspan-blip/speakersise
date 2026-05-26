import type { Speaker, SpeakerType } from "@/lib/types";

/**
 * Bands for the HiFi ladder page. Each tab (bookshelf / floorstander)
 * is split into two height ranges so the horizontal scroll inside each
 * band stays manageable (~50-70 speakers per band) and the per-band
 * scale factor can be tuned for the speakers it holds.
 *
 * Keys are stable, English-only — the UI looks up the localized
 * labels under `t.ladder.band*` at render time.
 */
export type BandKey =
  | "compact-bookshelf"
  | "larger-bookshelf"
  | "mid-floor"
  | "tall-floor";

export interface BandSpec {
  key: BandKey;
  type: SpeakerType;
  /** Inclusive lower bound in mm. */
  minMm: number;
  /** Exclusive upper bound in mm; `Infinity` for the open-ended band. */
  maxMm: number;
}

const BANDS: BandSpec[] = [
  { key: "compact-bookshelf", type: "bookshelf", minMm: 0, maxMm: 400 },
  { key: "larger-bookshelf", type: "bookshelf", minMm: 400, maxMm: Infinity },
  { key: "mid-floor", type: "floorstander", minMm: 0, maxMm: 1100 },
  { key: "tall-floor", type: "floorstander", minMm: 1100, maxMm: Infinity },
];

export interface BandData {
  spec: BandSpec;
  speakers: Speaker[];
}

/**
 * Bucket every speaker that has a front image into one of the four
 * bands. Speakers without a front image are silently dropped — the
 * ladder UI is purely visual and a row of placeholders would look
 * broken.
 *
 * Each band's `speakers` list is sorted shortest → tallest so the row
 * reads left-to-right as a true size ladder.
 *
 * Per-tab visual scale (px / mm) is applied at render time on the
 * client so all bands within a tab share the same scale — that keeps
 * a given model at the same on-screen size regardless of which
 * sub-band it lives in.
 */
export function buildLadderBands(allSpeakers: Speaker[]): BandData[] {
  const usable = allSpeakers.filter((s) => Boolean(s.images.front));

  return BANDS.map((spec) => ({
    spec,
    speakers: usable
      .filter(
        (s) =>
          s.type === spec.type &&
          s.dimensions.heightMm >= spec.minMm &&
          s.dimensions.heightMm < spec.maxMm
      )
      .sort((a, b) => a.dimensions.heightMm - b.dimensions.heightMm),
  }));
}
