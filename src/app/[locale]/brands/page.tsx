import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers } from "@/lib/speakers";
import {
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { SiteHeader } from "@/components/SiteHeader";
import { BrandStrip } from "@/components/BrandStrip";
import { CompareCTA } from "@/components/CompareCTA";
import { SponsorBanner } from "@/components/SponsorBanner";
import { BRAND_LOGOS, type BrandLogo } from "@/lib/brands";

/**
 * Brands page — lists every brand the catalog tracks (live + planned),
 * with a sponsors slot above the grid. Lives at /[locale]/brands.
 *
 * The Mission page (/plan) used to host this grid; we split them so /plan
 * can grow into a longer-form mission statement without competing visually
 * with the directory.
 */

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = getDictionary(raw);
  return pageMetadata({
    locale: raw,
    path: "/brands",
    title: t.meta.brandsTitle,
    description: t.meta.brandsDescription,
  });
}

export default async function BrandsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  // All known brand logos, sorted alphabetically. Status defaults to "live"
  // when not set so existing entries don't need to declare it explicitly.
  const allBrands = Object.entries(BRAND_LOGOS)
    .map(([name, logo]) => ({ name, logo, status: logo.status ?? "live" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Footer brand strip should still only reflect what's actually in the
  // catalog, not the planned roadmap.
  const liveBrands = Array.from(
    new Set(getAllSpeakers().map((s) => s.brand))
  ).sort();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col pb-24 sm:pb-0">
      {/* The Brands page is force-locked to its light palette regardless of
          system dark-mode preference: the brand logos in the directory are
          almost all monochrome black, so on a dark cabinet they'd vanish.
          Every text/border class below drops its `dark:` variant on purpose. */}
      <SiteHeader locale={locale} t={t} currentPath="brands" />

      <main className="flex-1">
        {/* Hero — title + short pitch. The "suggest a brand" CTA sits
            here so it's the first thing readers see after the headline. */}
        <section className="relative overflow-hidden border-b border-stone-200">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                "radial-gradient(60% 60% at 75% 30%, rgba(217,119,6,0.10), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700 font-medium">
              {t.nav.brands}
            </p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-stone-900 max-w-4xl">
              {t.brands.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-stone-600 leading-relaxed">
              {t.brands.subtitle}
            </p>
            <p className="mt-6 text-base text-stone-700">
              {t.brands.suggestPrompt}{" "}
              <a
                href={`mailto:${t.brands.suggestEmailMailto}`}
                className="font-semibold text-amber-700 underline-offset-4 hover:underline"
              >
                {t.brands.suggestEmail}
              </a>
              .
            </p>
            <p className="mt-9 text-sm italic tracking-wide text-amber-700">
              Sic parvis magna
            </p>
          </div>
        </section>

        {/* Sponsors slot — shared with the home page so the same eyebrow
            and placeholder appears wherever paid promotions surface. The
            component reads from src/lib/sponsors.ts; empty list renders
            the dashed placeholder. */}
        <SponsorBanner t={t} />

        {/* Brand grid */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {allBrands.map(({ name, logo, status }) => (
              <BrandTile
                key={name}
                name={name}
                logo={logo}
                status={status}
                locale={locale}
                t={t}
              />
            ))}
          </ul>
        </section>
      </main>

      {liveBrands.length > 0 && (
        <BrandStrip brands={liveBrands} locale={locale} t={t} />
      )}

      <CompareCTA locale={locale} t={t} />
    </div>
  );
}

function BrandTile({
  name,
  logo,
  status,
  locale,
  t,
}: {
  name: string;
  logo: BrandLogo;
  status: "live" | "planned";
  locale: Locale;
  t: Dictionary;
}) {
  const isLive = status === "live";
  const label = isLive ? t.brands.live : t.brands.planned;

  // Logos: live → full colour. Planned → desaturated + low opacity.
  // No dark-mode invert here — the Brands page is locked to its light
  // palette so the monochrome wordmarks render in their native black.
  const colourClasses = isLive ? "" : "grayscale opacity-50";

  // Tile body — clickable Link only for live brands (sends to brand page).
  const body = (
    <div className="flex flex-col items-center gap-4">
      {/* Uniform bounding box: caps BOTH height and width so wide
          wordmarks (Wharfedale) and tall badges (MAGICO) end up with
          similar visual mass on the page. */}
      <div className="h-14 w-full max-w-[160px] mx-auto flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt={name}
          width={logo.width}
          height={logo.height}
          className={`max-h-full max-w-full object-contain ${colourClasses}`}
        />
      </div>
      <div className="text-center">
        <p
          className={`text-sm font-medium ${
            isLive ? "text-stone-900" : "text-stone-500"
          }`}
        >
          {name}
        </p>
        <p
          className={`mt-1 text-[10px] uppercase tracking-[0.2em] font-semibold ${
            isLive ? "text-amber-700" : "text-stone-400"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {isLive ? (
        <Link
          href={`/${locale}?brand=${encodeURIComponent(name)}`}
          className="group block py-4 transition-opacity hover:opacity-80"
        >
          {body}
        </Link>
      ) : (
        <div className="py-4">{body}</div>
      )}
    </li>
  );
}
