import type { Dictionary, Locale } from "@/lib/i18n";
import type { CatalogStats } from "@/lib/stats";

/**
 * Row of five deterministic catalog stats — the "this site is real,
 * look at the magnitude" signal that sits between the home hero and
 * the editorial Top 5 list.
 *
 * Everything here is server-rendered: the numbers come from
 * `computeStats(speakers)` and never change client-side, so no
 * hydration concerns. The companion `<DidYouKnow />` carousel handles
 * the rotating trivia and lives as a separate client component.
 */
export function CatalogInsights({
  stats,
  locale,
  t,
}: {
  stats: CatalogStats;
  locale: Locale;
  t: Dictionary;
}) {
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);

  return (
    // Bottom border replaces the one that used to sit on the hero
    // section above — visually groups the hero + insights as a single
    // top block and separates them from the rest of the home page.
    <section className="border-b border-stone-200 dark:border-stone-800">
    <div className="mx-auto max-w-6xl px-6 pt-0 pb-6 sm:pb-8 -mt-2 sm:-mt-4">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 font-medium text-center mb-6">
        {t.home.quickFactsEyebrow}
      </p>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
        <Stat
          value={fmt(stats.sameTypeComparisons2)}
          label={t.home.quickFactsLabels.comparisons}
        />
        <Stat
          value={fmt(stats.totalSpeakers)}
          label={t.home.quickFactsLabels.speakers}
        />
        <Stat
          value={fmt(stats.totalBrands)}
          label={t.home.quickFactsLabels.brands}
        />
        <Stat
          value={String(stats.oldestBrandYear)}
          label={t.home.quickFactsLabels.oldestBrand}
          sublabel={stats.oldestBrandName}
        />
        <Stat
          value={stats.countryWithMostBrands.countryFlag}
          label={t.home.quickFactsLabels.mostBrandsCountry}
          sublabel={
            t.home.brandCountries[
              stats.countryWithMostBrands
                .countryKey as keyof typeof t.home.brandCountries
            ] ?? stats.countryWithMostBrands.countryKey
          }
          large
        />
      </dl>
    </div>
    </section>
  );
}

function Stat({
  value,
  label,
  sublabel,
  large = false,
}: {
  value: string;
  label: string;
  sublabel?: string;
  /** Render the value at flag-emoji size (used for the country slot). */
  large?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={
          large
            ? "text-5xl sm:text-6xl leading-none"
            : "text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-100"
        }
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-wider text-stone-500">
        {label}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
          {sublabel}
        </p>
      )}
    </div>
  );
}
