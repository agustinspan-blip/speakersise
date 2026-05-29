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
import { ContactForm } from "@/components/ContactForm";
import { SponsorBanner } from "@/components/SponsorBanner";

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
    path: "/contact",
    title: t.meta.contactTitle,
    description: t.meta.contactDescription,
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const speakers = getAllSpeakers();
  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <SiteHeader locale={locale} t={t} currentPath="contact" />

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
          <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 font-medium">
              {t.contact.eyebrow}
            </p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-stone-900 dark:text-stone-50">
              {t.contact.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              {t.contact.subtitle}
            </p>
          </div>
        </section>

        {/* Sponsor slot — moved here from the home page so the catalog
            surface stays focused on speakers. Empty by default; populates
            from src/lib/sponsors.ts when partners are configured. */}
        <SponsorBanner t={t} />

        {/* Form + email sidecard */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10">
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm">
              <ContactForm locale={locale} t={t} />
            </div>

            <aside className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 sm:p-7 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">
                {t.contact.asideHeading}
              </p>
              <p className="mt-3">{t.contact.asideBody}</p>
              <a
                href={`mailto:${t.brands.suggestEmailMailto}`}
                className="mt-4 inline-block font-semibold text-amber-700 dark:text-amber-400 underline-offset-4 hover:underline break-all"
              >
                {t.brands.suggestEmail}
              </a>
            </aside>
          </div>
        </section>
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />
    </div>
  );
}
