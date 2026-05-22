import Link from "next/link";
import { BRAND_LOGOS, type BrandLogo } from "@/lib/brands";
import type { Dictionary, Locale } from "@/lib/i18n";
import { NewsletterSignup } from "@/components/NewsletterSignup";

/**
 * Renders as a full-width dark footer below `<main>`. Stacks three
 * blocks vertically: the newsletter signup (so every page that uses
 * this footer gets the form), the infinite brand-logo marquee, and
 * the thin utility row of cross-links. The marquee pauses on hover
 * and `prefers-reduced-motion` disables it entirely (see globals.css).
 */
export function BrandStrip({
  brands,
  locale,
  t,
}: {
  brands: string[];
  locale: Locale;
  t: Dictionary;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-14 bg-stone-900">
      {/* Newsletter signup — appears even when the brand list is empty
          (rare edge case: a deeply-filtered catalog) so the call-to-action
          is never lost. */}
      <NewsletterSignup locale={locale} t={t} />

      {brands.length > 0 && (
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-8">
        <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400 text-center mb-8">
          {t.catalog.browseByBrand}
        </h3>

        <div
          className="brand-marquee relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="brand-marquee-track flex w-max items-center gap-12">
            {[...brands, ...brands].map((b, i) => {
              const logo = BRAND_LOGOS[b];
              return (
                <Link
                  key={`${b}-${i}`}
                  href={`/${locale}?brand=${encodeURIComponent(b)}`}
                  className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                  aria-label={b}
                  aria-hidden={i >= brands.length ? true : undefined}
                  tabIndex={i >= brands.length ? -1 : undefined}
                  title={b}
                >
                  {logo ? (
                    <BrandLogoImg brand={b} logo={logo} />
                  ) : (
                    <span className="text-sm uppercase tracking-wide font-medium text-stone-100">
                      {b}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Thin utility row */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex items-center justify-between gap-4 flex-wrap text-xs text-stone-500">
          <p className="tracking-wide">
            © {year} Truescale
          </p>
          <nav className="flex items-center gap-5">
            <Link
              href={`/${locale}`}
              className="hover:text-stone-200 transition-colors"
            >
              {t.support.footerCatalog}
            </Link>
            <Link
              href={`/${locale}/compare`}
              className="hover:text-stone-200 transition-colors"
            >
              {t.support.footerCompare}
            </Link>
            <Link
              href={`/${locale}/brands`}
              className="hover:text-stone-200 transition-colors"
            >
              {t.nav.brands}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="hover:text-stone-200 transition-colors"
            >
              {t.contact.navLink}
            </Link>
            <Link
              href={`/${locale}/support`}
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              ☕ {t.support.footerSupport}
            </Link>
          </nav>
        </div>
      </div>
      )}
    </footer>
  );
}

function BrandLogoImg({ brand, logo }: { brand: string; logo: BrandLogo }) {
  // When `tintColor` is set, render via CSS mask so the monochrome PNG
  // takes on the brand-correct colour (used for Rizzi's green).
  if (logo.tintColor) {
    return (
      <span
        role="img"
        aria-label={brand}
        className={`block ${logo.stripHeightClass}`}
        style={{
          aspectRatio: `${logo.width} / ${logo.height}`,
          backgroundColor: logo.tintColor,
          WebkitMaskImage: `url(${logo.src})`,
          maskImage: `url(${logo.src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={brand}
      width={logo.width}
      height={logo.height}
      className={`${logo.stripHeightClass} w-auto object-contain ${
        logo.darkInvert !== false ? "invert" : ""
      }`}
    />
  );
}
