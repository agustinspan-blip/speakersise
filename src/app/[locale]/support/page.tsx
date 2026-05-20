import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers } from "@/lib/speakers";
import {
  getDictionary,
  isLocale,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { SiteHeader } from "@/components/SiteHeader";
import { BrandStrip } from "@/components/BrandStrip";
import { CompareCTA } from "@/components/CompareCTA";
import {
  DONATION_TIERS,
  KOFI_URL,
  ROADMAP,
  kofiAmountUrl,
  type RoadmapStatus,
} from "@/lib/support";

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
    path: "/support",
    title: t.meta.supportTitle,
    description: t.meta.supportDescription,
  });
}

export default async function SupportPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const speakers = getAllSpeakers();
  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col pb-24 sm:pb-0">
      <SiteHeader locale={locale} t={t} currentPath="support" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                "radial-gradient(60% 60% at 75% 30%, rgba(217,119,6,0.10), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 font-medium">
                {t.support.eyebrow}
              </p>
              <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-stone-900 dark:text-stone-50">
                {t.support.title}{" "}
                <span className="italic font-normal text-amber-700 dark:text-amber-400">
                  {t.support.titleAccent}
                </span>
                {t.support.titleTail}
              </h1>
              <p className="mt-6 text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t.support.story}
              </p>
              <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t.support.storyAlt}
              </p>
              <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t.support.storyClosing}
              </p>
            </div>

            {/* Stat panel */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
              <dl className="grid grid-cols-2 gap-y-6 gap-x-4">
                <Stat value={String(speakers.length)} label={t.support.stats.speakers} />
                <Stat value={String(brands.length)} label={t.support.stats.brands} />
                <Stat value={String(locales.length)} label={t.support.stats.languages} />
                <Stat value="0" label={t.support.stats.ads} accent />
              </dl>
            </div>
          </div>
        </section>

        {/* Donation tiers */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">
              {t.support.tierEyebrow}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {DONATION_TIERS.map((tier) => {
              const label = t.support[`tier${tier.labelKey}`];
              const blurb = t.support[`tier${tier.blurbKey}`];
              return (
                <a
                  key={tier.amountUsd}
                  href={kofiAmountUrl(tier.amountUsd)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 hover:border-amber-600 dark:hover:border-amber-500 hover:shadow-[0_20px_50px_-12px_rgba(217,119,6,0.18)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    {/* Tiers with `iconSrc` show a real image (e.g. the
                        vinyl SVG) since Unicode doesn't cover them; others
                        fall back to the emoji. Both render at the same
                        ~40 px box so the row stays visually balanced. */}
                    {tier.iconSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={tier.iconSrc}
                        alt=""
                        aria-hidden
                        width={40}
                        height={40}
                        className="h-10 w-10"
                      />
                    ) : (
                      <span
                        className="text-4xl leading-none h-10 w-10 inline-flex items-center justify-center"
                        aria-hidden
                      >
                        {tier.emoji}
                      </span>
                    )}
                    <span className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
                      ${tier.amountUsd}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-stone-900 dark:text-stone-100">
                    {label}
                  </h3>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    {blurb}
                  </p>
                  <p className="mt-6 text-sm font-medium text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 transition-transform group-hover:translate-x-1">
                    {t.support.donateOn} →
                  </p>
                </a>
              );
            })}
          </div>

          {/* Custom amount */}
          <div className="mt-6 flex justify-center">
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline-offset-4 hover:underline"
            >
              {t.support.tierCustom} →
            </a>
          </div>

          <p className="mt-12 text-center text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {t.support.thanks}
            </span>{" "}
            {t.support.thanksBlurb}
          </p>
        </section>

        {/* Roadmap */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">
              {t.support.roadmapEyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              {t.support.roadmapTitle}
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
              {t.support.roadmapBlurb}
            </p>
          </div>

          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {ROADMAP.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] items-center gap-4 py-4"
              >
                <RoadmapBadge status={item.status} t={t} />
                <p className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {t.support.roadmapItems[item.titleKey]}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />

      <CompareCTA locale={locale} t={t} />
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-4xl font-semibold tracking-tight tabular-nums ${
          accent
            ? "text-amber-700 dark:text-amber-400"
            : "text-stone-900 dark:text-stone-100"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
        {label}
      </p>
    </div>
  );
}

function RoadmapBadge({
  status,
  t,
}: {
  status: RoadmapStatus;
  t: ReturnType<typeof getDictionary>;
}) {
  const styles: Record<RoadmapStatus, string> = {
    next: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    soon: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    later: "bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-500",
  };
  return (
    <span
      className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${styles[status]}`}
    >
      {t.support.roadmapStatus[status]}
    </span>
  );
}
