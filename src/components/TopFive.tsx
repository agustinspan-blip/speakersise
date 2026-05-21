import Image from "next/image";
import Link from "next/link";
import type { Speaker } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Two side-by-side "Top 5 most-searched" panels — one for bookshelves and
 * one for floorstanders — placed below the hero on the home page.
 *
 * Source data comes from `lib/popularity.ts` (curated today; will switch
 * to live counters once the deploy has Vercel KV or similar). The UI
 * intentionally stays minimal: rank, brand wordmark, model, and a hover
 * arrow — the row itself links to the speaker detail.
 */
export function TopFive({
  bookshelf,
  floorstander,
  locale,
  t,
}: {
  bookshelf: Speaker[];
  floorstander: Speaker[];
  locale: Locale;
  t: Dictionary;
}) {
  // Don't render the strip at all if both lists are empty (e.g. the
  // popularity config got wiped). Saves a section of empty space on the
  // home page.
  if (bookshelf.length === 0 && floorstander.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pt-2 pb-12">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 font-medium mb-6">
        {t.catalog.topFiveEyebrow}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title={t.catalog.topFiveBookshelf}
          speakers={bookshelf}
          locale={locale}
        />
        <Panel
          title={t.catalog.topFiveFloorstander}
          speakers={floorstander}
          locale={locale}
        />
      </div>
    </section>
  );
}

function Panel({
  title,
  speakers,
  locale,
}: {
  title: string;
  speakers: Speaker[];
  locale: Locale;
}) {
  if (speakers.length === 0) return null;
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <h3 className="px-5 pt-5 pb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>
      <ol>
        {speakers.map((s, i) => {
          const thumb = s.images.hero ?? s.images.front;
          return (
          <li key={s.id}>
            <Link
              href={`/${locale}/speaker/${s.id}`}
              className="group flex items-center gap-4 px-5 py-3 border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
            >
              {/* Rank — bold, tabular, amber on hover. */}
              <span className="w-6 shrink-0 text-base font-semibold tabular-nums text-stone-300 dark:text-stone-600 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {i + 1}
              </span>
              {/* Thumbnail — square container, object-contain so portrait
                  floorstanders and squat bookshelves both sit centered. */}
              <div className="relative w-12 h-12 shrink-0 rounded-md bg-stone-50 dark:bg-stone-800/60 overflow-hidden">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  {s.brand}
                </p>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {s.model}
                  {s.generation && (
                    <span className="ml-1 text-stone-400 font-normal">
                      {s.generation}
                    </span>
                  )}
                </p>
              </div>
              <span
                aria-hidden
                className="text-stone-300 dark:text-stone-600 group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all"
              >
                →
              </span>
            </Link>
          </li>
          );
        })}
      </ol>
    </div>
  );
}
