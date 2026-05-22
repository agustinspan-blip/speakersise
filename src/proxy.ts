import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

/**
 * Paths whose rendered HTML is safe to cache on Vercel's edge CDN for
 * a day at a time. Content is read from JSON files committed to the
 * repo — it can only change via a deploy, which invalidates the cache
 * automatically. Anything not listed here (the API routes, contact
 * page, etc.) keeps the default no-store behaviour.
 *
 * Why this matters for SEO: Google and Bing read the `Cache-Control`
 * header. Pages that say "no-store, must-revalidate" signal "do not
 * remember this" and crawlers de-prioritise them. With s-maxage they
 * see a fresh, cacheable resource and crawl more aggressively.
 *
 * `stale-while-revalidate=604800` lets the edge keep serving last
 * week's HTML while it refreshes in the background — invisible to
 * users, painless for our origin.
 */
const CACHEABLE_PATTERNS: RegExp[] = [
  /^\/(en|es)$/,
  /^\/(en|es)\/brands$/,
  /^\/(en|es)\/support$/,
  /^\/(en|es)\/speaker\/[^/]+$/,
  /^\/(en|es)\/compare$/,
  /^\/(en|es)\/compare\/[^/]+$/,
  /^\/(en|es)\/compare4$/,
];
const CACHE_HEADER =
  "public, s-maxage=86400, stale-while-revalidate=604800";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Defensive redirect: a user (or an external backlink) may type
  // `/speakers/<id>` (plural) instead of the canonical `/speaker/<id>`.
  // Without this they'd hit a 404 that Google would log as a soft error.
  // 301 so the link equity follows, in case anyone has actually linked
  // to the plural form somewhere.
  const pluralMatch = pathname.match(/^\/(en|es)\/speakers\/(.+)$/);
  if (pluralMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pluralMatch[1]}/speaker/${pluralMatch[2]}`;
    return NextResponse.redirect(url, 301);
  }

  const matchedLocale = locales.find(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (matchedLocale) {
    // Pass the active locale to server components via a request header so
    // `app/layout.tsx` can render `<html lang>` correctly without owning a
    // [locale] segment of its own.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", matchedLocale);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    // Attach a public Cache-Control header for catalog/comparison
    // pages so the Vercel edge can serve cached HTML to crawlers and
    // returning users alike. Skips POSTs and any non-GET method.
    if (
      request.method === "GET" &&
      CACHEABLE_PATTERNS.some((re) => re.test(pathname))
    ) {
      res.headers.set("Cache-Control", CACHE_HEADER);
    }
    return res;
  }

  const accept = request.headers.get("accept-language") ?? "";
  const cookieLocale = request.cookies.get("locale")?.value;

  let preferred: Locale = defaultLocale;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    preferred = cookieLocale as Locale;
  } else if (accept.toLowerCase().includes("es")) {
    preferred = "es";
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|speakers|.*\\..*).*)"],
};
