import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
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
  // PWA manifest — turns the site into an installable progressive
  // web app on Chrome/Edge desktop ("Install" button in the URL bar)
  // and Android Chrome ("Add to home screen"). iOS reads the
  // apple-touch-icon below and the apple-mobile-web-app-* tags.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrueScale",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

// `themeColor` controls the browser-chrome tint on Android Chrome
// (and the status-bar background on installed PWAs). Kept in its
// own export so Next.js can split it into the `<meta name="theme-color">`
// tag at the right time in the head.
export const viewport: Viewport = {
  themeColor: "#1c1917",
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
        {/*
          Site-wide structured data. The `WebSite` node with
          `SearchAction.target` is what unlocks the Google sitelinks
          search box on brand queries; the `Organization` node feeds the
          knowledge-panel logo + URL. Both are JSON-serialisable and emit
          once at the bottom of <body> (per Google guidance), no client
          interactivity required.
        */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: "TrueScale",
                alternateName: "TrueScale Audio",
                url: SITE_URL,
                logo: `${SITE_URL}/icon.svg`,
                sameAs: [],
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: "TrueScale",
                description:
                  "Compare HiFi bookshelf and floorstanding speakers side by side at true real-world scale.",
                publisher: { "@id": `${SITE_URL}/#organization` },
                inLanguage: ["en", "es"],
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/${lang}?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
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
