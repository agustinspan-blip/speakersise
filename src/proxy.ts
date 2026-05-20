import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    return NextResponse.next({ request: { headers: requestHeaders } });
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
