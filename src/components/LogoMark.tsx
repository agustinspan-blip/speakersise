/**
 * TrueScale brand mark — eight-point sunburst in the site's amber.
 *
 * The mark is a static SVG served from `/public/icons/tsa-mark.svg`
 * (1.3 KB, vectorised from the original PNG lockup with potrace so it
 * stays crisp at any size). Colour is baked into the file as #d97706
 * (amber-600), matching the rest of the site's accent palette — works
 * over both the dark `bg-stone-900` header and lighter content surfaces
 * without needing per-theme variants.
 *
 * The natural aspect ratio of the asset is 324:442 (portrait, vertical
 * axis is longer than horizontal — the north/south points extend
 * further than east/west). We size by height and let width follow
 * `w-auto` so the proportions stay correct at every render size.
 *
 * For the unusual case where someone needs a raster fallback (e.g.
 * email signature, a place where SVG is not supported), there are PNG
 * twins at the same path stem:
 *   - `/public/icons/tsa-mark.png`    — 200×273, ~11 KB
 *   - `/public/icons/tsa-mark-sm.png` — 100×136, ~3.3 KB
 */
export function LogoMark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  // Render height per slot. Width follows automatically from the SVG's
  // intrinsic 324:442 ratio when paired with `w-auto`.
  const heightPx = size === "sm" ? 26 : size === "lg" ? 56 : 36;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/tsa-mark.svg"
      alt=""
      aria-hidden
      height={heightPx}
      // Width attribute is calibrated to the asset's 324/442 aspect ratio
      // so the layout reserves the right amount of horizontal space before
      // the SVG paints — avoids a tiny CLS jump on first render.
      width={Math.round((heightPx * 324) / 442)}
      className={`shrink-0 ${className}`}
    />
  );
}
