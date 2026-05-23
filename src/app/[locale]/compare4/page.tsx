import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers, getSpeakerById } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";
import { NavCTAs } from "@/components/NavCTAs";
import { SpeakerPicker } from "@/components/SpeakerPicker";
import { BrandStrip } from "@/components/BrandStrip";
import { CompareCTA } from "@/components/CompareCTA";
import { ShuffleButton } from "@/components/ShuffleButton";
import {
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * 4-way comparison page. Sister to /compare, but trimmed: just the speaker
 * photo and the technical specs — no scale visualisation, no reference
 * silhouette/banknote, no marketing description.
 *
 * URL: /[locale]/compare4?a=&b=&c=&d=
 *   Any subset of slots can be empty. Empty slots show their picker; filled
 *   slots show the photo + spec column. We always render exactly the columns
 *   that are filled (1–4) so the table doesn't look sparse with one speaker.
 */

const SLOT_KEYS = ["a", "b", "c", "d"] as const;
type SlotKey = (typeof SLOT_KEYS)[number];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Partial<Record<SlotKey, string>>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = getDictionary(raw);
  return pageMetadata({
    locale: raw,
    path: "/compare4",
    title: t.meta.compare4Title,
    description: t.meta.compare4Description,
  });
}

export default async function Compare4Page({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const sp = await searchParams;
  const speakers = getAllSpeakers();

  // Resolve each slot to a speaker (or undefined if empty / id not found).
  const slots: Record<SlotKey, Speaker | undefined> = {
    a: sp.a ? getSpeakerById(sp.a) : undefined,
    b: sp.b ? getSpeakerById(sp.b) : undefined,
    c: sp.c ? getSpeakerById(sp.c) : undefined,
    d: sp.d ? getSpeakerById(sp.d) : undefined,
  };
  const filled = SLOT_KEYS.map((k) => slots[k]).filter(
    (s): s is Speaker => Boolean(s)
  );

  const brands = Array.from(new Set(speakers.map((s) => s.brand))).sort();

  // Bucketed catalog for the ShuffleButton — see /compare for rationale.
  // Hybrid bucket only has 2 entries today (Paradigm Persona 9H + Founder
  // 120H) so the 4-way shuffler can never fill from it; the
  // ShuffleButton's eligibility check (>= `count` per bucket) skips
  // hybrid here. Compare-2 still finds the pair.
  const idsByType = {
    bookshelf: speakers.filter((s) => s.type === "bookshelf").map((s) => s.id),
    floorstander: speakers.filter((s) => s.type === "floorstander").map((s) => s.id),
    hybrid: speakers.filter((s) => s.type === "hybrid").map((s) => s.id),
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <SiteHeader locale={locale} t={t} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10 space-y-10">
        <NavCTAs locale={locale} t={t} />
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t.compare4.title}
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t.compare4.subtitle}
          </p>
        </div>

        {/* Slot picker form. Four pickers, one Compare button. The form is a
            plain GET so each slot becomes a URL param ?a=…&b=…&c=…&d=… — same
            shape as /compare so it's easy to bookmark / share. */}
        <form
          method="get"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {SLOT_KEYS.map((key, idx) => (
            <SpeakerPicker
              key={key}
              name={key}
              label={`${t.compare4.slotLabel} ${idx + 1}`}
              pickBrandLabel={t.compare.pickBrand}
              pickTypeLabel={t.compare.pickType}
              pickSpeakerLabel={t.compare.pickSpeaker}
              typeLabels={{
                bookshelf: t.catalog.bookshelf,
                floorstander: t.catalog.floorstander,
                hybrid: t.catalog.hybrid,
              }}
              options={speakers}
              selected={sp[key]}
            />
          ))}
          <div className="lg:col-span-4 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              className="h-10 px-5 rounded-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition-colors text-sm font-medium"
            >
              {t.compare.compareButton}
            </button>
            <ShuffleButton
              locale={locale}
              t={t}
              target="compare4"
              count={4}
              idsByType={idsByType}
            />
            {filled.length > 0 && (
              <Link
                href={`/${locale}/compare4`}
                className="text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline-offset-4 hover:underline"
              >
                {t.compare4.clear}
              </Link>
            )}
          </div>
        </form>

        {filled.length === 0 ? (
          <p className="text-sm text-stone-500">{t.compare4.empty}</p>
        ) : (
          <>
            <PhotoRow speakers={filled} />
            <SpecsTable speakers={filled} t={t} />
          </>
        )}
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />

      <CompareCTA locale={locale} t={t} mode="to-compare" />
    </div>
  );
}

/**
 * Photo row: one column per filled slot, each showing the speaker's front
 * image (or hero as fallback) on a white tile so the cabinet is legible
 * regardless of dark-mode page background.
 */
function PhotoRow({ speakers }: { speakers: Speaker[] }) {
  // Match the specs table grid so columns line up vertically.
  const cols =
    speakers.length === 1
      ? "grid-cols-1"
      : speakers.length === 2
        ? "grid-cols-2"
        : speakers.length === 3
          ? "grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4";

  return (
    <section className={`grid gap-4 ${cols}`}>
      {speakers.map((s) => {
        const img = s.images.front ?? s.images.hero;
        return (
          <figure
            key={s.id}
            className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden flex flex-col"
          >
            <div className="relative h-72 sm:h-80 flex items-end justify-center p-4">
              {img && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img}
                  alt={`${s.brand} ${s.model}`}
                  style={{
                    height: "100%",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
            <figcaption className="border-t border-stone-100 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-stone-500">
                {s.brand}
              </p>
              <p className="text-sm font-medium text-stone-900">
                {s.model}
                {s.generation && (
                  <span className="ml-1 text-stone-400 font-normal">
                    {s.generation}
                  </span>
                )}
              </p>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}

/**
 * Specs table: label column on the left, then one column per filled slot.
 * Rows that are entirely empty across every selected speaker are skipped so
 * the table doesn't show four `—` cells in a row.
 */
function SpecsTable({
  speakers,
  t,
}: {
  speakers: Speaker[];
  t: Dictionary;
}) {
  const fmtRange = (r: { min?: number; max: number }, unit: string) =>
    r.min !== undefined ? `${r.min}–${r.max} ${unit}` : `${r.max} ${unit}`;
  const fmtDrivers = (s: Speaker) =>
    s.drivers
      .map(
        (d) =>
          `${d.quantity ?? 1}× ${d.sizeMm > 0 ? `${d.sizeMm} mm ` : ""}${d.role}${d.material ? ` (${d.material})` : ""}`
      )
      .join(", ");
  const typeLabel = (s: Speaker): string =>
    ({
      bookshelf: t.catalog.bookshelf,
      floorstander: t.catalog.floorstander,
      hybrid: t.catalog.hybrid,
    })[s.type];
  const powerLabel = (s: Speaker) =>
    s.powerType === "active" ? t.specs.active : t.specs.passive;

  const extLink = (url: string, text: string) => (
    <a
      key={url}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline dark:text-blue-400 break-all"
    >
      {text} ↗
    </a>
  );
  const manufacturerLink = (s: Speaker) => {
    try {
      const origin = new URL(s.sourceUrl).origin;
      const host = new URL(origin).hostname.replace(/^www\./, "");
      return extLink(origin, host);
    } catch {
      return "—";
    }
  };

  // Each row = [label, ...one cell per speaker]. Cells can be string | node;
  // we filter out rows where every cell is "—" so missing data doesn't add
  // visual noise.
  type Row = [label: string, ...cells: React.ReactNode[]];
  const rows: Row[] = [
    [
      t.specs.model,
      ...speakers.map(
        (s) => `${s.brand} ${s.model}${s.generation ? ` ${s.generation}` : ""}`
      ),
    ],
    [t.specs.type, ...speakers.map(typeLabel)],
    [t.specs.powerType, ...speakers.map(powerLabel)],
    [t.specs.height, ...speakers.map((s) => `${s.dimensions.heightMm} mm`)],
    [t.specs.width, ...speakers.map((s) => `${s.dimensions.widthMm} mm`)],
    [t.specs.depth, ...speakers.map((s) => `${s.dimensions.depthMm} mm`)],
    [t.specs.weight, ...speakers.map((s) => `${s.dimensions.weightKg} kg`)],
    [t.specs.enclosure, ...speakers.map((s) => s.enclosure ?? "—")],
    [
      t.specs.portTuning,
      ...speakers.map((s) => (s.portTuningHz ? `${s.portTuningHz} Hz` : "—")),
    ],
    [t.specs.drivers, ...speakers.map(fmtDrivers)],
    [
      t.specs.frequencyResponse,
      ...speakers.map(
        (s) =>
          `${fmtRange(s.frequencyResponseHz, "Hz")}${s.frequencyResponseToleranceDb ? ` (±${s.frequencyResponseToleranceDb} dB)` : ""}`
      ),
    ],
    [
      t.specs.sensitivity,
      ...speakers.map((s) =>
        s.sensitivityDb ? `${s.sensitivityDb} dB` : "—"
      ),
    ],
    [
      t.specs.impedance,
      ...speakers.map((s) =>
        s.impedanceOhm
          ? `${s.impedanceOhm} Ω${s.impedanceMinOhm ? ` (${t.specs.impedanceMin} ${s.impedanceMinOhm} Ω)` : ""}`
          : "—"
      ),
    ],
    [
      t.specs.powerHandling,
      ...speakers.map((s) =>
        s.powerHandlingW
          ? fmtRange(s.powerHandlingW, "W")
          : "—"
      ),
    ],
    [
      t.specs.recommendedAmp,
      ...speakers.map((s) =>
        s.recommendedAmpW ? fmtRange(s.recommendedAmpW, "W") : "—"
      ),
    ],
    [t.specs.manufacturer, ...speakers.map(manufacturerLink)],
    [
      t.specs.productPage,
      ...speakers.map((s) => extLink(s.sourceUrl, t.specs.openProductPage)),
    ],
  ];

  // Drop rows where every speaker reports "—" (purely missing data).
  const visibleRows = rows.filter(([, ...cells]) =>
    cells.some((c) => c !== "—")
  );

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-stone-600 dark:text-stone-400">
        {t.specs.title}
      </h2>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
        {/* `table-fixed` so the speaker columns share equal width
            (default `auto` layout makes them wider/narrower based on
            content length). */}
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-900/50 text-xs uppercase tracking-wide text-stone-500">
              {/* Mobile-tuned widths — see /compare for rationale. */}
              <th className="px-2 sm:px-4 py-2 text-left font-medium w-24 sm:w-40"></th>
              {speakers.map((s, i) => (
                <th
                  key={s.id}
                  className={`px-2 sm:px-4 py-2 text-left font-medium ${i > 0 ? "border-l border-stone-100 dark:border-stone-800" : ""}`}
                >
                  {s.brand} {s.model}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(([label, ...cells]) => (
              <tr
                key={label}
                className="border-t border-stone-100 dark:border-stone-800 align-top"
              >
                <th className="px-2 sm:px-4 py-3 text-left font-normal text-xs sm:text-sm text-stone-500">
                  {label}
                </th>
                {cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-2 sm:px-4 py-3 ${i > 0 ? "border-l border-stone-100 dark:border-stone-800" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
