import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers, getSpeakerById } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";
import { NavCTAs } from "@/components/NavCTAs";
import { BrandStrip } from "@/components/BrandStrip";
import { SideViewBadge } from "@/components/SideViewBadge";
import { JsonLd } from "@/components/JsonLd";
import { SpeakerSpecs } from "@/components/SpeakerSpecs";
import { BRAND_LOGOS, BRAND_INFO } from "@/lib/brands";
import { SITE_URL } from "@/lib/site";
import {
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { getStrategicPairsForSpeaker } from "@/lib/compare-pairs";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  const speakers = getAllSpeakers();
  return locales.flatMap((locale) =>
    speakers.map((s) => ({ locale, id: s.id }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) return {};
  const speaker = getSpeakerById(id);
  if (!speaker) return {};
  const t = getDictionary(raw);
  // Title is data-driven; description prefers the per-locale marketing
  // blurb if the speaker has one, otherwise falls back to a generic line
  // built from brand + model so every speaker still ships a unique tag.
  const title = t.meta.speakerTitle
    .replace("{brand}", speaker.brand)
    .replace("{model}", speaker.model);
  const description =
    speaker.description?.[raw] ??
    t.meta.speakerDescriptionFallback
      .replace("{brand}", speaker.brand)
      .replace("{model}", speaker.model);
  // Use our dynamic OG endpoint so the unfurl card shows brand + model +
  // a true-scale silhouette next to a 170 cm person — far more readable
  // in a chat thread than the bare hero PNG. Falls back to the static
  // hero image only if there's no hero asset to reference.
  const ogImage = {
    url: `/api/og/speaker/${id}`,
    alt: `${speaker.brand} ${speaker.model}`,
  };
  return pageMetadata({
    locale: raw,
    path: `/speaker/${id}`,
    title,
    description,
    ogImage,
  });
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const speaker = getSpeakerById(id);
  if (!speaker) notFound();

  const allSpeakers = getAllSpeakers();
  const brands = Array.from(new Set(allSpeakers.map((s) => s.brand))).sort();
  const front = speaker.images.front;
  const hero = speaker.images.hero;
  const side = speaker.images.side;
  const top = speaker.images.top;
  const back = speaker.images.back;
  // Supplementary views — rendered in a vertical stack below the front
  // shot. Each entry uses the localized label as its alt text and the
  // same wrapper treatment as `front`. Speakers without these slots
  // filled simply skip the corresponding row. Eventually this is the
  // seed for a thumbnail gallery (Phase 2); keep the data shape
  // forward-compatible for that refactor.
  const supplementaryViews = (
    [
      [side, t.detail.sideView],
      [back, t.detail.backView],
      [top, t.detail.topView],
    ] as const
  ).filter((p): p is readonly [string, string] => Boolean(p[0]));
  // Lookup table keeps the type→label mapping centralised.
  const typeLabel: string = {
    bookshelf: t.catalog.bookshelf,
    floorstander: t.catalog.floorstander,
  }[speaker.type];
  const brandLogo = BRAND_LOGOS[speaker.brand];
  const brandInfo = BRAND_INFO[speaker.brand];
  const countryName = brandInfo
    ? t.home.brandCountries[brandInfo.countryKey]
    : null;
  // Pre-rendered comparisons that feature this speaker — drives the
  // "Compare with…" internal-link section below the specs.
  const comparePairs = getStrategicPairsForSpeaker(speaker.id);

  // Product structured data is emitted ONLY for speakers that ship a
  // `priceUsd` field. Reason: Google's Product rich-result spec requires
  // at least one of `offers`, `review`, or `aggregateRating`. Without a
  // valid price we can't construct a complete `Offer`, and synthesising
  // a fake rating would be dishonest — so for the 90% of the catalog
  // that has no price published we skip the JSON-LD entirely. The page
  // still renders fine, just without the optional rich snippet.
  const canonical = `${SITE_URL}/${locale}/speaker/${speaker.id}`;
  const productImages = [hero, front, side, top, back].filter(
    (img): img is string => Boolean(img)
  );
  const productJsonLd = speaker.priceUsd ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: `${speaker.brand} ${speaker.model}${speaker.generation ? ` ${speaker.generation}` : ""}`,
    brand: { "@type": "Brand", name: speaker.brand },
    category: {
      bookshelf: "Bookshelf speaker",
      floorstander: "Floorstanding speaker",
      hybrid: "Hybrid speaker",
    }[speaker.type],
    url: canonical,
    image: productImages.map((p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`)),
    description:
      speaker.description?.[locale] ??
      speaker.description?.en ??
      `${speaker.brand} ${speaker.model} ${typeLabel} speaker.`,
    height: { "@type": "QuantitativeValue", value: speaker.dimensions.heightMm, unitCode: "MMT" },
    width: { "@type": "QuantitativeValue", value: speaker.dimensions.widthMm, unitCode: "MMT" },
    depth: { "@type": "QuantitativeValue", value: speaker.dimensions.depthMm, unitCode: "MMT" },
    weight: { "@type": "QuantitativeValue", value: speaker.dimensions.weightKg, unitCode: "KGM" },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Frequency response (low)",
        value: speaker.frequencyResponseHz.min,
        unitText: "Hz",
      },
      {
        "@type": "PropertyValue",
        name: "Frequency response (high)",
        value: speaker.frequencyResponseHz.max,
        unitText: "Hz",
      },
      speaker.sensitivityDb
        ? {
            "@type": "PropertyValue",
            name: "Sensitivity",
            value: speaker.sensitivityDb,
            unitText: "dB",
          }
        : null,
      speaker.impedanceOhm
        ? {
            "@type": "PropertyValue",
            name: "Nominal impedance",
            value: speaker.impedanceOhm,
            unitText: "Ohm",
          }
        : null,
      speaker.recommendedAmpW
        ? {
            "@type": "PropertyValue",
            name: "Recommended amplifier power",
            value: speaker.recommendedAmpW.max,
            unitText: "W",
          }
        : null,
      {
        "@type": "PropertyValue",
        name: "Enclosure",
        value: speaker.enclosure ?? "n/a",
      },
      {
        "@type": "PropertyValue",
        name: "Power type",
        value: speaker.powerType,
      },
    ].filter((p): p is NonNullable<typeof p> => p !== null),
    // Offers block — required to satisfy Google's Product rich-result
    // validation. We emit AggregateOffer when the JSON ships a price
    // range (different finishes priced differently); single Offer
    // when only `max` is set. `url` points at the manufacturer's
    // product page and `seller` carries the brand. Availability
    // "InStock" is the lightest assumption — the manufacturer's page
    // tells the real story per region.
    offers:
      speaker.priceUsd.min !== undefined &&
      speaker.priceUsd.min !== speaker.priceUsd.max
        ? {
            "@type": "AggregateOffer",
            url: speaker.sourceUrl,
            lowPrice: speaker.priceUsd.min,
            highPrice: speaker.priceUsd.max,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            offerCount: 2,
            seller: { "@type": "Organization", name: speaker.brand },
          }
        : {
      "@type": "Offer",
      url: speaker.sourceUrl,
      price: speaker.priceUsd.max,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: speaker.brand },
    },
  } : null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <SiteHeader locale={locale} t={t} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-16 space-y-12">
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-4">
            {hero && (
              <div className="relative aspect-square rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden">
                <Image
                  src={hero}
                  alt={`${speaker.brand} ${speaker.model}`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                  priority
                />
                {speaker.images.side && <SideViewBadge t={t} />}
              </div>
            )}
            {front && (
              <div
                className="relative rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden"
                style={{ height: hero ? "300px" : "420px" }}
              >
                <Image
                  src={front}
                  alt={`${speaker.brand} ${speaker.model} front view`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                />
              </div>
            )}
            {supplementaryViews.map(([src, label]) => (
              <div
                key={src}
                className="relative rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden"
                style={{ height: "300px" }}
              >
                <Image
                  src={src}
                  alt={`${speaker.brand} ${speaker.model} — ${label}`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                />
              </div>
            ))}
            {brandLogo && (
              // Logo and flag are now two separate links (they can't be
              // nested — invalid HTML — and they point to different
              // destinations): the logo to the brand-filtered catalog,
              // the flag to the country page.
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <Link
                  href={`/${locale}?brand=${encodeURIComponent(speaker.brand)}`}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                  aria-label={speaker.brand}
                  title={speaker.brand}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandLogo.src}
                    alt={speaker.brand}
                    width={brandLogo.width}
                    height={brandLogo.height}
                    className={`${brandLogo.stripHeightClass} w-auto object-contain ${
                      brandLogo.darkInvert !== false ? "dark:invert" : ""
                    }`}
                  />
                </Link>
                {brandInfo && (
                  <Link
                    href={`/${locale}/country/${brandInfo.countryKey}`}
                    className="text-5xl sm:text-6xl leading-none select-none opacity-90 hover:opacity-100 transition-opacity"
                    aria-label={countryName ?? brandInfo.countryCode}
                    title={countryName ?? brandInfo.countryCode}
                  >
                    {brandInfo.countryFlag}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {speaker.brand}
              {speaker.series && <> · {speaker.series}</>}
              {" · "}
              {typeLabel}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {speaker.model}
              {speaker.generation && (
                <span className="ml-2 text-stone-400 text-2xl font-normal">
                  {speaker.generation}
                </span>
              )}
            </h2>
            {/* Paired primary CTAs (always amber for sitewide consistency),
                with this speaker pre-selected as the first slot in either
                tool. */}
            <NavCTAs
              locale={locale}
              t={t}
              prefillId={speaker.id}
              className="mt-6"
            />

            <ProductDescription speaker={speaker} locale={locale} t={t} />

            <SpeakerSpecs speaker={speaker} typeLabel={typeLabel} locale={locale} t={t} />
          </div>
        </section>

        {/*
          "Compare with…" — links to the pre-rendered /compare/<slug>
          pages that pair this speaker with another. This is the
          internal-linking surface that de-orphans those comparison
          pages (Google had them as "Discovered – currently not
          indexed" because nothing linked to them). Only renders when
          this speaker is part of the curated strategic pair set.
        */}
        {comparePairs.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-medium text-stone-600 dark:text-stone-400">
              {t.detail.compareWith}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comparePairs.map(({ other, slug }) => (
                <Link
                  key={slug}
                  href={`/${locale}/compare/${slug}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 text-sm transition-colors hover:border-amber-500"
                >
                  <span className="min-w-0">
                    <span className="text-stone-500">
                      {speaker.brand} {speaker.model}
                    </span>
                    <span className="mx-1.5 text-stone-400">vs</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {other.brand} {other.model}
                    </span>
                  </span>
                  <span aria-hidden className="text-amber-600 dark:text-amber-400 shrink-0">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />
    </div>
  );
}

function ProductDescription({
  speaker,
  locale,
  t,
}: {
  speaker: Speaker;
  locale: Locale;
  t: Dictionary;
}) {
  // Pick the description for the active locale, falling back to the other
  // locale if only one is filled in. If neither is set, render nothing.
  const text =
    speaker.description?.[locale] ??
    speaker.description?.en ??
    speaker.description?.es;
  if (!text) return null;

  return (
    <div className="mt-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr]">
        <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-stone-500 sm:border-r sm:border-stone-100 sm:dark:border-stone-800 sm:py-5">
          {t.specs.productDescription}
        </div>
        <div className="px-4 py-4 sm:py-5 text-stone-700 dark:text-stone-300 leading-relaxed text-sm">
          {text}
        </div>
      </div>
    </div>
  );
}

