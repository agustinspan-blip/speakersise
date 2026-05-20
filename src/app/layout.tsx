import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// `metadataBase` resolves any relative URL we put inside Metadata
// (especially OG images). The canonical origin lives in `lib/site.ts`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Truescale — compare HiFi speakers at true scale",
  description:
    "Visually compare the size and specs of HiFi bookshelf and floorstanding speakers side by side.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // proxy.ts forwards the active locale as `x-locale` so we can set the
  // correct language attribute for SEO and assistive tech without nesting
  // an extra `[locale]` layout under root.
  const h = await headers();
  const headerLocale = h.get("x-locale");
  const lang = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Privacy-friendly first-party analytics from Vercel. Both
            packages read the project token from VERCEL_* env vars at
            runtime (no manual id to plug in), inject zero cookies, and
            stream events only in production builds — local dev is a
            no-op so the dashboards aren't polluted with test traffic. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
