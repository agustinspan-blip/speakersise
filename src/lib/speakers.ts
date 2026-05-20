import fs from "node:fs";
import path from "node:path";
import type { Speaker } from "./types";

const DATA_DIR = path.join(process.cwd(), "src", "data", "speakers");

export function getAllSpeakers(): Speaker[] {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"));

  const speakers = files.map((f) => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), "utf-8");
    return JSON.parse(raw) as Speaker;
  });

  speakers.sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return a.model.localeCompare(b.model);
  });

  return speakers;
}

/**
 * Returns all speakers ordered by file mtime (most recently added/modified first).
 * Useful as a recency hint for "highlight new arrivals" on the home page.
 */
export function getAllSpeakersByRecency(): Speaker[] {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"));

  const items = files.map((f) => {
    const fullPath = path.join(DATA_DIR, f);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const speaker = JSON.parse(raw) as Speaker;
    const mtimeMs = fs.statSync(fullPath).mtimeMs;
    return { speaker, mtimeMs };
  });

  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return items.map((i) => i.speaker);
}

export function getSpeakerById(id: string): Speaker | undefined {
  return getAllSpeakers().find((s) => s.id === id);
}

export function getSpeakersByType(type: Speaker["type"]): Speaker[] {
  return getAllSpeakers().filter((s) => s.type === type);
}
