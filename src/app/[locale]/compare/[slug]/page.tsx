import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ComparePage from "../page";
import { parsePairSlug, getStrategicPairSlugs } from "@/lib/compare-pairs";
import { isLocale, locales } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * Pre-rendered `/compare/<a-id>-vs-<b-id>` pages — long-tail SEO
 * landing surfaces for searches like "kef ls50 meta vs wharfedale
 * linton". Each one is a canonical URL with its own metadata,
 * structured data, and OG card, but it delegates the actual
 * rendering to the canonical `/compare?a=…&b=…` page so there is
 * exactly one place that owns the comparator UI.
 *
 * The pair list is curated in `lib/compare-pairs.ts`. Adding a slug
 * there grows the static export by 2 pages (one per locale) and
 * appends one URL per locale to the sitemap.
 *
 * Direction is canonical: the slug always sorts ids alphabetically
 * so `kef-ls50-meta-vs-wharfedale-linton` and its reverse map to
 * the same URL. Visitors arriving at the reverse form via a bookmark
 * still see the comparison (parsePairSlug accepts either order) but
 * the canonical URL in `<head>` always points at the sorted form.
 */
interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getStrategicPairSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const parsed = parsePairSlug(slug);
  if (!parsed) return {};
  const { a, b } = parsed;

  const aLabel = `${a.brand} ${a.model}${a.generation ? ` ${a.generation}` : ""}`;
  const bLabel = `${b.brand} ${b.model}${b.generation ? ` ${b.generation}` : ""}`;
  const title = `${aLabel} vs ${bLabel} · TrueScale`;
  // Specs-light description because Google likes ~150 chars with a clear
  // value prop. Heights are the most useful single fact for a comparator.
  const description =
    raw === "es"
      ? `Compará ${aLabel} contra ${bLabel} a escala real: ${a.dimensions.heightMm} mm vs ${b.dimensions.heightMm} mm de alto. Dimensiones, drivers y respuesta en frecuencia.`
      : `Compare ${aLabel} against ${bLabel} at true scale: ${a.dimensions.heightMm} mm vs ${b.dimensions.heightMm} mm tall. Dimensions, drivers and frequency response.`;

  return pageMetadata({
    locale: raw,
    path: `/compare/${slug}`,
    title,
    description,
    // Reuse the existing dynamic OG endpoint — it already knows how to
    // render a 1200×630 "A vs B" card from the two ids.
    ogImage: {
      url: `/api/og/compare?a=${a.id}&b=${b.id}`,
      alt: `${aLabel} vs ${bLabel}`,
    },
  });
}

export default async function CompareSlugPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const parsed = parsePairSlug(slug);
  if (!parsed) notFound();

  // Delegate to the canonical ComparePage with synthetic searchParams.
  // ComparePage is a server component that renders the picker form,
  // the active comparison view, and the specs table — the exact same
  // experience a user gets from /compare?a=X&b=Y, but reached via a
  // pretty, indexable URL. The canonical/og metadata above wins over
  // anything ComparePage might emit because Next.js uses the closest
  // page.tsx's metadata.
  return ComparePage({
    params: Promise.resolve({ locale: raw }),
    searchParams: Promise.resolve({ a: parsed.a.id, b: parsed.b.id }),
  });
}
