import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

/**
 * Returns the on-disk pixel resolution of each speaker's hero image,
 * so callers can prefer higher-quality imagery when picking what to
 * show in the editorial hero on the home page.
 *
 * The hero file is expected at `public/speakers/<id>-hero.<ext>` (one
 * of webp / png / jpg). Anything else is silently ignored.
 *
 * The map is built lazily the first time it's read and memoised for
 * the lifetime of the Node process — Vercel rebuilds on every deploy
 * so cache invalidation is just "deploy". Reading ~225 image headers
 * is ~50 ms once; subsequent calls are O(1).
 *
 * Pure server-only. Pulling `node:fs` into a client bundle would fail;
 * this file is only imported from page.tsx server components.
 */

interface HeroDims {
  width: number;
  height: number;
  /** width × height — convenient for ranking. */
  area: number;
}

const HERO_DIR = path.join(process.cwd(), "public", "speakers");
const HERO_PATTERN = /^(.+)-hero\.(webp|png|jpg|jpeg)$/i;

let cache: Map<string, HeroDims> | null = null;

function build(): Map<string, HeroDims> {
  const map = new Map<string, HeroDims>();
  let files: string[];
  try {
    files = fs.readdirSync(HERO_DIR);
  } catch {
    // Directory might not exist in some build contexts (e.g. running
    // tests outside a full checkout). Return an empty map rather than
    // crashing — callers gracefully fall back to recency ordering.
    return map;
  }
  for (const file of files) {
    const match = file.match(HERO_PATTERN);
    if (!match) continue;
    const id = match[1];
    try {
      const buf = fs.readFileSync(path.join(HERO_DIR, file));
      const { width, height } = imageSize(buf);
      if (typeof width === "number" && typeof height === "number") {
        map.set(id, { width, height, area: width * height });
      }
    } catch {
      // Corrupt or unsupported file — skip silently.
    }
  }
  return map;
}

/**
 * Get the pixel dimensions of a speaker's hero image, or `null` if
 * the speaker has no hero file (or the file couldn't be parsed).
 */
export function getHeroDims(speakerId: string): HeroDims | null {
  if (!cache) cache = build();
  return cache.get(speakerId) ?? null;
}

/**
 * Pixel area (width × height) of a speaker's hero, or `0` when the
 * file is missing. Useful as a sort key — speakers with no hero file
 * sort below every speaker that has one.
 */
export function getHeroArea(speakerId: string): number {
  return getHeroDims(speakerId)?.area ?? 0;
}
