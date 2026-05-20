#!/usr/bin/env python3
"""Crop Dali Epikore source renders into clean production assets.

- Detects the speaker's bounding box against the near-white studio background
- For the bookshelf hero (Epikore 3 on a stand) keeps only the top blob (speaker)
- Outputs transparent PNGs with a small, uniform breathing-room margin
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data-imports" / "Epikore"
DST = ROOT / "public" / "speakers"

# (source filename, output filename, mode)
# mode: "full" = full bounding box; "top-blob" = keep only top connected blob (drop stand)
JOBS = [
    ("EPIKORE-3_Front.png",      "dali-epikore-3-front.png",  "full"),
    ("DALI-EPIKORE-3_2.png",     "dali-epikore-3-hero.png",   "top-blob"),
    ("Dali-Epikore-7_Front.png", "dali-epikore-7-front.png",  "full"),
    ("Dali-Epikore-7_2.png",     "dali-epikore-7-hero.png",   "full"),
    ("Dali-Epikore-9_Front.png", "dali-epikore-9-front.png",  "full"),
    ("Dali-Epikore-9_2.png",     "dali-epikore-9-hero.png",   "full"),
    ("EPIKORE_11_Front.png",     "dali-epikore-11-front.png", "full"),
    ("EPIKORE_11_2.png",         "dali-epikore-11-hero.png",  "full"),
]

# Two thresholds:
# - STRICT picks out the speaker body only (dark wood, drivers, feet metal).
#   Shadows on the studio floor are ~200–225, so this threshold excludes them.
# - SOFT is used for the alpha ramp so anti-aliased edges blend cleanly,
#   but it is NEVER used for bbox detection.
SPEAKER_THRESHOLD = 170
ALPHA_LO = 170   # fully opaque below this min-channel value (= speaker body)
ALPHA_HI = 205   # fully transparent above (= shadow + studio floor)
PAD_RATIO = 0.03  # 3% of the larger crop dimension
MIN_PIXELS_PER_LINE = 4  # ignore sparse stray-pixel rows/cols


def speaker_mask(img: Image.Image) -> np.ndarray:
    """Strict mask of speaker pixels (excludes studio shadow)."""
    arr = np.array(img.convert("RGB"))
    return np.any(arr < SPEAKER_THRESHOLD, axis=2)


def soft_alpha(img: Image.Image) -> Image.Image:
    """Build an RGBA image: shadow and background fade to transparent on a
    ramp tuned so the studio shadow (≈205–225) is mostly transparent while
    the speaker body stays fully opaque."""
    arr = np.array(img.convert("RGB")).astype(np.float32)
    min_c = arr.min(axis=2)
    alpha = np.clip((ALPHA_HI - min_c) / (ALPHA_HI - ALPHA_LO), 0.0, 1.0)
    rgba = np.dstack([arr, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba)


def bbox_full(mask: np.ndarray) -> tuple[int, int, int, int]:
    """Bounding box using strict speaker mask. Requires MIN_PIXELS_PER_LINE
    foreground pixels on a row/column to count — single-pixel noise is ignored."""
    row_counts = mask.sum(axis=1)
    col_counts = mask.sum(axis=0)
    rows = np.where(row_counts >= MIN_PIXELS_PER_LINE)[0]
    cols = np.where(col_counts >= MIN_PIXELS_PER_LINE)[0]
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def bbox_top_blob(mask: np.ndarray) -> tuple[int, int, int, int]:
    """For the bookshelf-on-stand image: speaker (top) is much wider than the
    stand column underneath. Find the row where the foreground width drops
    sharply — that's the speaker→stand transition."""
    # Per-row width of foreground (leftmost→rightmost foreground pixel span)
    row_width = np.zeros(mask.shape[0], dtype=np.int32)
    row_counts = mask.sum(axis=1)
    any_row = row_counts >= MIN_PIXELS_PER_LINE
    for r in np.where(any_row)[0]:
        cols = np.where(mask[r])[0]
        row_width[r] = cols[-1] - cols[0] + 1

    rows_present = np.where(any_row)[0]
    top = int(rows_present[0])
    # Look at the speaker top section (first 20% of presence) to estimate width
    sample_end = top + max(1, int(0.2 * (rows_present[-1] - top)))
    speaker_width = int(np.median(row_width[top:sample_end][row_width[top:sample_end] > 0]))
    # Walk downward; first row whose width drops below 65% of speaker width = stand top
    threshold = int(speaker_width * 0.65)
    speaker_bottom = rows_present[-1]
    # Require the narrow condition to hold for at least 10 consecutive rows so we
    # don't trip on minor cabinet curves.
    run = 0
    for r in range(top + 5, mask.shape[0]):
        if row_width[r] > 0 and row_width[r] < threshold:
            run += 1
            if run >= 10:
                speaker_bottom = r - run + 1
                break
        else:
            run = 0

    sub_mask = mask[top:speaker_bottom, :]
    cols = np.where(sub_mask.any(axis=0))[0]
    return int(cols[0]), int(top), int(cols[-1]) + 1, int(speaker_bottom)


def process(src_path: Path, dst_path: Path, mode: str) -> None:
    img = Image.open(src_path)
    mask = speaker_mask(img)
    if mode == "top-blob":
        l, t, r, b = bbox_top_blob(mask)
    else:
        l, t, r, b = bbox_full(mask)

    # Uniform padding
    w, h = r - l, b - t
    pad = int(round(max(w, h) * PAD_RATIO))
    W, H = img.size
    l2 = max(0, l - pad)
    t2 = max(0, t - pad)
    r2 = min(W, r + pad)
    b2 = min(H, b + pad)

    cropped = img.crop((l2, t2, r2, b2))
    rgba = soft_alpha(cropped)

    # Downscale to a reasonable size: cap longest side at 1200px
    max_side = 1200
    cw, ch = rgba.size
    scale = min(1.0, max_side / max(cw, ch))
    if scale < 1.0:
        rgba = rgba.resize(
            (int(round(cw * scale)), int(round(ch * scale))),
            Image.LANCZOS,
        )

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(dst_path, "PNG", optimize=True)
    print(f"{src_path.name:32s} -> {dst_path.name:30s}  {rgba.size[0]}x{rgba.size[1]}")


def main() -> None:
    for src_name, dst_name, mode in JOBS:
        process(SRC / src_name, DST / dst_name, mode)


if __name__ == "__main__":
    main()
