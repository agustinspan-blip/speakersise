import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandSearch } from "@/components/BrandSearch";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Site-wide header. Three homogeneous text+icon nav links (Brands, Contact,
 * Support) on the left of the utility cluster, followed by the brand-search
 * trigger and the language switcher.
 *
 * Icons are inline Lucide-style SVGs so the visual language matches across
 * the trio — no emoji, no decorative imagery, just thin 16px strokes that
 * sit at the same baseline as the text label.
 *
 * `currentPath` lets the matching link mark itself active so its colour
 * stays solid; pass "brands", "contact" or "support".
 *
 * Primary product actions (TrueScale / TrueSpecs) intentionally do NOT live
 * here — they're surfaced via the persistent <CompareCTA /> floater so
 * they're discoverable from any page without crowding the chrome.
 */
export function SiteHeader({
  locale,
  t,
  currentPath,
}: {
  locale: Locale;
  t: Dictionary;
  currentPath?: "brands" | "countries" | "contact" | "support";
}) {
  // Shared classes — every nav link reads with the same amber treatment;
  // only the active one drops the hover transition so its colour is solid.
  const navBase =
    "inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400";
  const navHover =
    "hover:text-amber-700 dark:hover:text-amber-300 transition-colors";

  const links: Array<{
    key: "brands" | "countries" | "contact" | "support";
    href: string;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "brands",
      href: `/${locale}/brands`,
      label: t.nav.brands,
      icon: <GridIcon />,
    },
    {
      key: "countries",
      href: `/${locale}/countries`,
      label: t.nav.countries,
      icon: <GlobeIcon />,
    },
    {
      key: "contact",
      href: `/${locale}/contact`,
      label: t.contact.navLink,
      icon: <MailIcon />,
    },
    {
      key: "support",
      href: `/${locale}/support`,
      label: t.support.navLink,
      icon: <HeartIcon />,
    },
  ];

  return (
    <header className="bg-stone-900 sticky top-0 z-50 border-b border-stone-800">
      {/*
        Tighter horizontal padding + gaps on mobile: with four nav
        icons plus search and the language switcher, the default
        spacing pushed the EN/ES toggle off the right edge on ~360 px
        phones. Padding and gaps relax back to their roomy values at
        sm+ where there's space.
      */}
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo + wordmark always link back to the catalog home so the
            user has a consistent way out of any subpage. */}
        <Logo locale={locale} linkToHome variant="light" withMark />
        <nav className="flex items-center gap-3 sm:gap-6">
          {links.map((l) => {
            const isActive = currentPath === l.key;
            return (
              <Link
                key={l.key}
                href={l.href}
                className={isActive ? navBase : `${navBase} ${navHover}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span aria-hidden className="shrink-0">
                  {l.icon}
                </span>
                {/* Labels hide below sm — the icon alone keeps the bar
                    breathable on phones; the title attribute keeps it
                    discoverable on touch. */}
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sr-only sm:hidden">{l.label}</span>
              </Link>
            );
          })}
          <BrandSearch locale={locale} t={t} />
          <LanguageSwitcher locale={locale} dict={t} variant="light" />
        </nav>
      </div>
    </header>
  );
}

/* ---------- Inline icons (Lucide-style, 16×16, currentColor) ----------
 * Kept inline rather than importing a package to keep the bundle minimal —
 * these three shapes are the only ones we need site-wide.
 */

function GridIcon() {
  // Stacked grid — visual shorthand for "directory of brands".
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function GlobeIcon() {
  // Globe with longitude/latitude lines — visual shorthand for
  // "by country / world directory".
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18" />
      <path d="M12 3a13.5 13.5 0 0 0 0 18" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function HeartIcon() {
  // Heart — friendlier than the literal coffee-cup and matches the
  // "support the project" framing better than a money symbol would.
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
