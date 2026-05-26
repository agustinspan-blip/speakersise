import bboxes from "@/data/hero-bboxes.json";

/**
 * Bounding box of a speaker's cabinet inside its hero image. All
 * fields are normalised: `left/top/width/height` are fractions of
 * the image, `imageAspect` is the raw image's width / height ratio.
 *
 * Generated offline by `scripts/compute-hero-bboxes.py`. Re-run
 * that script after adding new hero images and commit the updated
 * JSON.
 */
export interface HeroBbox {
  left: number;
  top: number;
  width: number;
  height: number;
  imageAspect: number;
}

type BboxMap = Record<string, HeroBbox>;
const BBOXES: BboxMap = bboxes as BboxMap;

export function getHeroBbox(speakerId: string): HeroBbox | null {
  return BBOXES[speakerId] ?? null;
}

/**
 * Given a hero's bounding box and a card with a fixed aspect ratio,
 * return the CSS `transform` value (a `scale(...) translate(...)`
 * compound) that zooms in on the cabinet so it fills the card. The
 * card is assumed to use `object-contain` to fit the raw image, then
 * this transform applied on top.
 *
 * The math accounts for the empty space `object-contain` introduces
 * when the image aspect ratio doesn't match the card's: the bbox is
 * first mapped from image coordinates to card coordinates, then a
 * uniform scale is picked to fill the card's smaller dimension up to
 * `targetFill` of the card. Capped at `maxZoom` so we don't crank up
 * tiny thumbnails into something ridiculous.
 */
export function heroZoomTransform(
  bbox: HeroBbox,
  cardAspect: number, // card width / height (e.g. 0.8 for 4:5)
  opts: { targetFill?: number; maxZoom?: number } = {}
): { transform: string; transformOrigin: string } {
  const targetFill = opts.targetFill ?? 0.95;
  const maxZoom = opts.maxZoom ?? 1.6;

  // Project the image into the card via object-contain. The image
  // either fills the card's width (if "wider" than the card) and
  // leaves vertical padding, or vice versa.
  const imageAspect = bbox.imageAspect;
  const imageFillsWidth = imageAspect >= cardAspect;
  // Rendered image dimensions inside the card, normalised to the
  // card's dimensions.
  const renderedW = imageFillsWidth ? 1 : imageAspect / cardAspect;
  const renderedH = imageFillsWidth ? cardAspect / imageAspect : 1;

  // Bbox dimensions in card-normalised coordinates.
  const bboxCardW = bbox.width * renderedW;
  const bboxCardH = bbox.height * renderedH;

  if (bboxCardW <= 0 || bboxCardH <= 0) {
    return { transform: "none", transformOrigin: "center center" };
  }

  // Scale so the bbox's larger relative dimension reaches `targetFill`
  // of the card's matching dimension. Using max(...) means we always
  // zoom enough to fill in at least one axis.
  const scaleW = targetFill / bboxCardW;
  const scaleH = targetFill / bboxCardH;
  const rawScale = Math.min(scaleW, scaleH);
  const scale = Math.max(1, Math.min(maxZoom, rawScale));

  if (scale === 1) {
    return { transform: "none", transformOrigin: "center center" };
  }

  // Centre the transform on the bbox's centre inside the card so
  // the cabinet stays put while the empty area around it gets
  // clipped by the card's `overflow-hidden`.
  // Bbox centre in image-normalised coords:
  const bboxCxImage = bbox.left + bbox.width / 2;
  const bboxCyImage = bbox.top + bbox.height / 2;
  // Convert to card-normalised coords (accounting for object-contain
  // padding that pushes the image inside the card).
  const padX = (1 - renderedW) / 2;
  const padY = (1 - renderedH) / 2;
  const bboxCxCard = padX + bboxCxImage * renderedW;
  const bboxCyCard = padY + bboxCyImage * renderedH;

  return {
    transform: `scale(${scale.toFixed(3)})`,
    transformOrigin: `${(bboxCxCard * 100).toFixed(1)}% ${(bboxCyCard * 100).toFixed(1)}%`,
  };
}
