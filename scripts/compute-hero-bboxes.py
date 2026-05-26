#!/usr/bin/env python3
"""
Compute the bounding box of each speaker's hero image — the area
containing the actual cabinet, excluding the surrounding whitespace.
Writes the result to `src/data/hero-bboxes.json` as a map of
speakerId → { left, top, width, height } in normalised [0, 1]
coordinates.

The country page (and any other surface that wants a tight crop)
reads this JSON to apply a CSS transform that zooms each hero so its
cabinet fills the card frame instead of floating in a sea of padding.

Run once after adding new hero images:
    python3 scripts/compute-hero-bboxes.py
and commit the updated JSON.

Detection rules:
  - PNG: use the alpha channel — getbbox() returns the bbox of opaque
    pixels, which is exactly what we want when the hero has a
    transparent background.
  - JPEG: no alpha. Treat any pixel with avg(RGB) >= 245 as background
    (near-white) and find the bbox of the rest.
  - WebP: branch on whether the file has an alpha channel.
"""

from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

from PIL import Image

HERO_DIR = Path("public/speakers")
OUT_PATH = Path("src/data/hero-bboxes.json")

# Pixels with mean(R, G, B) above this are treated as "white background"
# in heros without alpha. Tuned to catch off-white catalog backgrounds
# without eating into shiny white cabinets.
WHITE_THRESHOLD = 245


def detect_bbox(path: Path) -> tuple[int, int, int, int, int, int] | None:
    """Return (left, top, right, bottom, width, height) of the
    cabinet inside the image, or None if the image is unreadable."""
    try:
        img = Image.open(path)
    except Exception as err:
        print(f"  skip {path.name}: {err}", file=sys.stderr)
        return None

    w, h = img.size

    if img.mode in ("RGBA", "LA") or (
        img.mode == "P" and "transparency" in img.info
    ):
        # Alpha-backed: bbox of non-transparent pixels.
        rgba = img.convert("RGBA")
        bbox = rgba.getbbox()
        if bbox is None:
            return None
        return (*bbox, w, h)

    # No alpha → threshold against near-white.
    rgb = img.convert("RGB")
    px = rgb.load()
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if (r + g + b) // 3 < WHITE_THRESHOLD:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if max_x < 0:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1, w, h)


def main():
    results: dict[str, dict[str, float]] = {}
    files = sorted(glob.glob(str(HERO_DIR / "*-hero.*")))
    for path_str in files:
        path = Path(path_str)
        name = path.name
        # Strip "-hero.<ext>" → speaker id
        sid = name.rsplit("-hero.", 1)[0]

        bbox = detect_bbox(path)
        if bbox is None:
            continue
        left, top, right, bottom, w, h = bbox
        results[sid] = {
            "left": round(left / w, 4),
            "top": round(top / h, 4),
            "width": round((right - left) / w, 4),
            "height": round((bottom - top) / h, 4),
            # Image aspect ratio (W / H) — used by the client to figure
            # out how the hero gets projected into a fixed-aspect card
            # via object-contain, so the zoom math respects empty
            # space introduced by aspect mismatch.
            "imageAspect": round(w / h, 4),
        }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(results, indent=2, sort_keys=True))
    print(f"wrote {len(results)} bboxes to {OUT_PATH}")


if __name__ == "__main__":
    main()
