import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers } from "@/lib/speakers";
import { buildLadderBands } from "@/lib/ladder-bands";
import { BRAND_INFO } from "@/lib/brands";
import type { Speaker } from "@/lib/types";
import {
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { SiteHeader } from "@/components/SiteHeader";
import { BrandStrip } from "@/components/BrandStrip";
import { LadderClient } from "@/components/LadderClient";
import { SponsorBanner } from "@/components/SponsorBanner";

/**
 * HiFi ladder — visual ladder of every speaker in the catalog,
 * grouped by type (bookshelf / floorstanding) and sub-banded by
 * height range so the per-band scale stays readable.
 *
 * Hidden from main nav and sitemap on purpose while we iterate.
 * Reachable directly at /<locale>/ladder.
 */
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = getDictionary(raw);
  return pageMetadata({
    locale: raw,
    path: "/ladder",
    title: `${t.ladder.title} · TrueScale`,
    description: t.ladder.subtitle,
  });
}

/**
 * Compact one-line driver summary used by the speaker tooltip. Groups
 * drivers by role and prints `<qty>× <size> mm <role>` per group. Falls
 * back to just the role when the manufacturer omits a size.
 */
function summariseDrivers(s: Speaker): string {
  return s.drivers
    .map((d) => {
      const qty = d.quantity ?? 1;
      const size = d.sizeMm > 0 ? `${d.sizeMm} mm ` : "";
      return `${qty}× ${size}${d.role}`;
    })
    .join(" · ");
}

export default async function LadderPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const speakers = getAllSpeakers();
  const bands = buildLadderBands(speakers);

  // Pre-compute a lookup from brand name to country metadata (flag,
  // country code) so each speaker entry can render the flag without
  // re-walking BRAND_INFO. Keys are brand strings, values are the
  // exact shape the client component needs to render.
  const brandFlags: Record<string, { flag: string; countryName: string }> =
    {};
  for (const brandName of Object.keys(BRAND_INFO)) {
    const info = BRAND_INFO[brandName];
    if (!info) continue;
    brandFlags[brandName] = {
      flag: info.countryFlag,
      countryName: t.home.brandCountries[info.countryKey],
    };
  }

  // Strip the bands down to the minimal shape the client needs. Each
  // field here either drives a filter (brand / country / powerType),
  // a label below the cabinet (weight), or the hover tooltip
  // (driversSummary + impedance). Anything not consumed by the client
  // stays out of the bundle.
  const clientBands = bands.map((b) => ({
    key: b.spec.key,
    type: b.spec.type,
    speakers: b.speakers.map((s) => ({
      id: s.id,
      brand: s.brand,
      model: s.model,
      generation: s.generation,
      heightMm: s.dimensions.heightMm,
      widthMm: s.dimensions.widthMm,
      weightKg: s.dimensions.weightKg,
      impedanceOhm: s.impedanceOhm,
      sensitivityDb: s.sensitivityDb,
      driversSummary: summariseDrivers(s),
      countryCode: BRAND_INFO[s.brand]?.countryCode ?? "",
      powerType: s.powerType,
      front: s.images.front!,
    })),
  }));

  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <SiteHeader locale={locale} t={t} />
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.ladder.title}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 max-w-2xl">
            {t.ladder.subtitle}
          </p>
          <p className="text-xs text-stone-500">{t.ladder.selectHint}</p>
        </header>
        <LadderClient
          bands={clientBands}
          brandFlags={brandFlags}
          locale={locale}
          t={t}
        />
        {/* Sponsor banner — matches the placement on /brands, /contact
            and /support so every long-form surface offers the same
            "Be the first to sponsor" entry point. */}
        <SponsorBanner t={t} />
      </main>
      <BrandStrip brands={brands} locale={locale} t={t} />
    </div>
  );
}
