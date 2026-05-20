import { pickSponsor } from "@/lib/sponsors";
import type { Dictionary } from "@/lib/i18n";

/**
 * Reserved slot for paid/partner promotions. Sits between hero content and
 * the catalog grid on the home page and below the BrandHero on brand-
 * filtered home views.
 *
 * Layout matches the rest of the site: same `max-w-6xl` content width, an
 * eyebrow row separated by a hairline divider, and a content block below.
 * When no sponsors are configured (`SPONSORS` empty in `lib/sponsors.ts`),
 * we render a dashed-border placeholder that advertises availability —
 * matches the existing pattern on the brands page so visitors don't see a
 * different empty state per page.
 *
 * External hrefs open in a new tab with `noopener noreferrer`; in-site
 * targets stay in the same tab.
 */
export function SponsorBanner({ t }: { t: Dictionary }) {
  const sponsor = pickSponsor();
  const isExternal = sponsor
    ? /^https?:\/\//i.test(sponsor.href)
    : false;

  return (
    <section className="mx-auto max-w-6xl px-6 pt-12">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">
          {t.brands.sponsorsEyebrow}
        </p>
      </div>

      {sponsor ? (
        <a
          href={sponsor.href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="group block rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-10 sm:py-12 transition-shadow hover:shadow-[0_20px_50px_-12px_rgba(28,25,23,0.18)]"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sponsor.imageSrc}
              alt={sponsor.name}
              className={`max-h-16 w-auto object-contain ${
                sponsor.darkInvert !== false ? "dark:invert" : ""
              }`}
            />
            <div>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {sponsor.name}
              </p>
              {sponsor.tagline && (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {sponsor.tagline}
                </p>
              )}
            </div>
          </div>
        </a>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 py-16 px-6 text-center">
          <p className="text-sm font-medium tracking-wide text-stone-400 dark:text-stone-500">
            <span aria-hidden className="mr-2">
              ☆
            </span>
            {t.brands.sponsorsBeFirst}
          </p>
        </div>
      )}

      {/* Closing divider — mirrors the one above the eyebrow so the
          sponsors block reads as a clearly bounded section. */}
      <div
        aria-hidden
        className="mt-12 border-b border-stone-200 dark:border-stone-800"
      />
    </section>
  );
}
