import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSpeakers, getSpeakerById } from "@/lib/speakers";
import type { Speaker } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";
import { NavCTAs } from "@/components/NavCTAs";
import { BrandStrip } from "@/components/BrandStrip";
import { CompareCTA } from "@/components/CompareCTA";
import { BRAND_LOGOS, BRAND_INFO } from "@/lib/brands";
import {
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  const speakers = getAllSpeakers();
  return locales.flatMap((locale) =>
    speakers.map((s) => ({ locale, id: s.id }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) return {};
  const speaker = getSpeakerById(id);
  if (!speaker) return {};
  const t = getDictionary(raw);
  // Title is data-driven; description prefers the per-locale marketing
  // blurb if the speaker has one, otherwise falls back to a generic line
  // built from brand + model so every speaker still ships a unique tag.
  const title = t.meta.speakerTitle
    .replace("{brand}", speaker.brand)
    .replace("{model}", speaker.model);
  const description =
    speaker.description?.[raw] ??
    t.meta.speakerDescriptionFallback
      .replace("{brand}", speaker.brand)
      .replace("{model}", speaker.model);
  // Use the speaker's hero image as the OG card. It's the asset most
  // visually identifiable with the model and we already serve it.
  const heroImg = speaker.images.hero ?? speaker.images.front;
  return pageMetadata({
    locale: raw,
    path: `/speaker/${id}`,
    title,
    description,
    ogImage: heroImg
      ? { url: heroImg, alt: `${speaker.brand} ${speaker.model}` }
      : undefined,
  });
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const speaker = getSpeakerById(id);
  if (!speaker) notFound();

  const allSpeakers = getAllSpeakers();
  const brands = Array.from(new Set(allSpeakers.map((s) => s.brand))).sort();
  const front = speaker.images.front;
  const hero = speaker.images.hero;
  const side = speaker.images.side;
  const top = speaker.images.top;
  const back = speaker.images.back;
  // Supplementary views — rendered in a vertical stack below the front
  // shot. Each entry uses the localized label as its alt text and the
  // same wrapper treatment as `front`. Speakers without these slots
  // filled simply skip the corresponding row. Eventually this is the
  // seed for a thumbnail gallery (Phase 2); keep the data shape
  // forward-compatible for that refactor.
  const supplementaryViews = (
    [
      [side, t.detail.sideView],
      [back, t.detail.backView],
      [top, t.detail.topView],
    ] as const
  ).filter((p): p is readonly [string, string] => Boolean(p[0]));
  const typeLabel =
    speaker.type === "bookshelf"
      ? t.catalog.bookshelf
      : t.catalog.floorstander;
  const brandLogo = BRAND_LOGOS[speaker.brand];
  const brandInfo = BRAND_INFO[speaker.brand];
  const countryName = brandInfo
    ? t.home.brandCountries[brandInfo.countryKey]
    : null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col pb-24 sm:pb-0">
      <SiteHeader locale={locale} t={t} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-16 space-y-12">
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-4">
            {hero && (
              <div className="relative aspect-square rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden">
                <Image
                  src={hero}
                  alt={`${speaker.brand} ${speaker.model}`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                  priority
                />
              </div>
            )}
            {front && (
              <div
                className="relative rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden"
                style={{ height: hero ? "300px" : "420px" }}
              >
                <Image
                  src={front}
                  alt={`${speaker.brand} ${speaker.model} front view`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                />
              </div>
            )}
            {supplementaryViews.map(([src, label]) => (
              <div
                key={src}
                className="relative rounded-lg border border-stone-200 dark:border-stone-800 bg-white overflow-hidden"
                style={{ height: "300px" }}
              >
                <Image
                  src={src}
                  alt={`${speaker.brand} ${speaker.model} — ${label}`}
                  fill
                  className="object-contain p-6"
                  sizes="380px"
                />
              </div>
            ))}
            {brandLogo && (
              <Link
                href={`/${locale}?brand=${encodeURIComponent(speaker.brand)}`}
                className="flex flex-col items-center justify-center py-4 gap-2 opacity-80 hover:opacity-100 transition-opacity"
                aria-label={speaker.brand}
                title={speaker.brand}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandLogo.src}
                  alt={speaker.brand}
                  width={brandLogo.width}
                  height={brandLogo.height}
                  className={`${brandLogo.stripHeightClass} w-auto object-contain ${
                    brandLogo.darkInvert !== false ? "dark:invert" : ""
                  }`}
                />
                {brandInfo && (
                  <span
                    className="text-5xl sm:text-6xl leading-none select-none"
                    aria-label={countryName ?? brandInfo.countryCode}
                    title={countryName ?? brandInfo.countryCode}
                  >
                    {brandInfo.countryFlag}
                  </span>
                )}
              </Link>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {speaker.brand}
              {speaker.series && <> · {speaker.series}</>}
              {" · "}
              {typeLabel}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {speaker.model}
              {speaker.generation && (
                <span className="ml-2 text-stone-400 text-2xl font-normal">
                  {speaker.generation}
                </span>
              )}
            </h2>
            {/* Paired primary CTAs (always amber for sitewide consistency),
                with this speaker pre-selected as the first slot in either
                tool. */}
            <NavCTAs
              locale={locale}
              t={t}
              prefillId={speaker.id}
              className="mt-6"
            />

            <ProductDescription speaker={speaker} locale={locale} t={t} />

            <SpecsTable speaker={speaker} typeLabel={typeLabel} t={t} />
          </div>
        </section>
      </main>

      <BrandStrip brands={brands} locale={locale} t={t} />

      <CompareCTA locale={locale} t={t} prefillId={speaker.id} />
    </div>
  );
}

function ProductDescription({
  speaker,
  locale,
  t,
}: {
  speaker: Speaker;
  locale: Locale;
  t: Dictionary;
}) {
  // Pick the description for the active locale, falling back to the other
  // locale if only one is filled in. If neither is set, render nothing.
  const text =
    speaker.description?.[locale] ??
    speaker.description?.en ??
    speaker.description?.es;
  if (!text) return null;

  return (
    <div className="mt-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr]">
        <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-stone-500 sm:border-r sm:border-stone-100 sm:dark:border-stone-800 sm:py-5">
          {t.specs.productDescription}
        </div>
        <div className="px-4 py-4 sm:py-5 text-stone-700 dark:text-stone-300 leading-relaxed text-sm">
          {text}
        </div>
      </div>
    </div>
  );
}

function SpecsTable({
  speaker: s,
  typeLabel,
  t,
}: {
  speaker: Speaker;
  typeLabel: string;
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
  // Pretty labels for the active-spec enum values. Kept inline (not i18n)
  // since these are brand/protocol names that should render the same in
  // every locale.
  const WIRED_INPUT_LABEL: Record<string, string> = {
    "rca-analog": "RCA",
    "rca-phono": "RCA Phono",
    "xlr-analog": "XLR balanced",
    optical: "Optical (Toslink)",
    coax: "Coaxial S/PDIF",
    "aes-ebu": "AES/EBU (XLR)",
    "usb-audio": "USB Audio",
    "usb-host": "USB-A host",
    "hdmi-input": "HDMI in",
    "hdmi-arc": "HDMI ARC",
    "hdmi-earc": "HDMI eARC",
    ethernet: "Ethernet",
    "calibration-mic": "Calibration mic",
  };
  const WIRELESS_LABEL: Record<string, string> = {
    bluetooth: "Bluetooth",
    "airplay-2": "AirPlay 2",
    "google-cast": "Google Cast",
    "spotify-connect": "Spotify Connect",
    "tidal-connect": "Tidal Connect",
    "qobuz-connect": "Qobuz Connect",
    "roon-ready": "Roon Ready",
    wisa: "WiSA",
    wifi: "Wi-Fi",
  };
  const OUTPUT_LABEL: Record<string, string> = {
    "rca-sub": "RCA sub-out",
    "xlr-sub": "XLR sub-out",
    "hdmi-out": "HDMI out",
  };
  const ROOM_CORRECTION_LABEL: Record<string, string> = {
    "dirac-live": "Dirac Live (full)",
    "dirac-live-limited": "Dirac Live (limited)",
    "custom-dsp": "Custom DSP / app",
    "manufacturer-preset": "Manufacturer presets",
  };
  const fmtList = (
    items: string[] | undefined,
    map: Record<string, string>
  ): string => {
    if (!items || items.length === 0) return "—";
    return items.map((i) => map[i] ?? i).join(", ");
  };
  const fmtAmp = (a: NonNullable<Speaker["active"]>["amplification"]) => {
    if (!a || a.length === 0) return "—";
    return a
      .map(
        (s) =>
          `${s.driverRole} ${s.powerW} W${s.amplifierClass ? ` (class ${s.amplifierClass})` : ""}`
      )
      .join(" · ");
  };
  const yesNo = (v: boolean | undefined) =>
    v === true ? t.specs.yes : v === false ? t.specs.no : "—";
  const host = (() => {
    try {
      return new URL(s.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return s.sourceUrl;
    }
  })();
  const origin = (() => {
    try {
      return new URL(s.sourceUrl).origin;
    } catch {
      return s.sourceUrl;
    }
  })();

  const rows: ([string, React.ReactNode] | null)[] = [
    [t.specs.type, typeLabel],
    [
      t.specs.powerType,
      s.powerType === "active" ? t.specs.active : t.specs.passive,
    ],
    [t.specs.height, `${s.dimensions.heightMm} mm`],
    [t.specs.width, `${s.dimensions.widthMm} mm`],
    [t.specs.depth, `${s.dimensions.depthMm} mm`],
    [t.specs.weight, `${s.dimensions.weightKg} kg`],
    [t.specs.enclosure, s.enclosure ?? "—"],
    s.portTuningHz ? [t.specs.portTuning, `${s.portTuningHz} Hz`] : null,
    [t.specs.drivers, fmtDrivers(s)],
    [
      t.specs.frequencyResponse,
      `${fmtRange(s.frequencyResponseHz, "Hz")}${s.frequencyResponseToleranceDb ? ` (±${s.frequencyResponseToleranceDb} dB)` : ""}`,
    ],
    s.sensitivityDb ? [t.specs.sensitivity, `${s.sensitivityDb} dB`] : null,
    s.impedanceOhm
      ? [
          t.specs.impedance,
          `${s.impedanceOhm} Ω${s.impedanceMinOhm ? ` (${t.specs.impedanceMin} ${s.impedanceMinOhm} Ω)` : ""}`,
        ]
      : null,
    s.powerHandlingW
      ? [t.specs.powerHandling, fmtRange(s.powerHandlingW, "W")]
      : null,
    s.recommendedAmpW
      ? [t.specs.recommendedAmp, fmtRange(s.recommendedAmpW, "W")]
      : null,
    // Active-only rows. Always rendered for active speakers, with "—"
    // placeholders when the manufacturer hasn't published the field.
    ...(s.powerType === "active"
      ? ([
          [t.specs.amplification, fmtAmp(s.active?.amplification)],
          [
            t.specs.totalAmpPower,
            s.active?.totalAmpPowerW !== undefined
              ? `${s.active.totalAmpPowerW} W`
              : "—",
          ],
          [
            t.specs.maxSpl,
            s.active?.maxSplDb !== undefined
              ? `${s.active.maxSplDb} dB`
              : "—",
          ],
          [
            t.specs.audioFormat,
            s.active?.maxBitDepth || s.active?.maxSampleRateKhz
              ? `${s.active.maxBitDepth ?? "—"} bit / ${s.active.maxSampleRateKhz ?? "—"} kHz`
              : "—",
          ],
          [t.specs.wiredInputs, fmtList(s.active?.wiredInputs, WIRED_INPUT_LABEL)],
          [
            t.specs.wirelessProtocols,
            fmtList(s.active?.wirelessProtocols, WIRELESS_LABEL),
          ],
          [t.specs.audioOutputs, fmtList(s.active?.outputs, OUTPUT_LABEL)],
          [
            t.specs.roomCorrection,
            fmtList(s.active?.roomCorrection, ROOM_CORRECTION_LABEL),
          ],
          [t.specs.pairedSecondary, yesNo(s.active?.pairedSecondary)],
          [
            t.specs.wirelessSpeakerLink,
            yesNo(s.active?.wirelessSpeakerLink),
          ],
          [
            t.specs.latency,
            s.active?.latencyMs !== undefined
              ? `${s.active.latencyMs} ms`
              : "—",
          ],
          [
            t.specs.idlePower,
            s.active?.idlePowerW !== undefined
              ? `${s.active.idlePowerW} W`
              : "—",
          ],
          [
            t.specs.maxPowerConsumption,
            s.active?.maxPowerConsumptionW !== undefined
              ? `${s.active.maxPowerConsumptionW} W`
              : "—",
          ],
        ] as ([string, React.ReactNode] | null)[])
      : []),
    [
      t.specs.manufacturer,
      <a
        key="manuf"
        href={origin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        {host} ↗
      </a>,
    ],
    [
      t.specs.productPage,
      <a
        key="prod"
        href={s.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline dark:text-blue-400 break-all"
      >
        {t.specs.openProductPage} ↗
      </a>,
    ],
  ];
  const filteredRows = rows.filter(
    (r): r is [string, React.ReactNode] => r !== null
  );

  return (
    <div className="mt-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {filteredRows.map(([label, value]) => (
            <tr
              key={label}
              className="border-b border-stone-100 dark:border-stone-800 last:border-none"
            >
              <th className="px-4 py-3 text-left font-normal text-stone-500 w-40 align-top">
                {label}
              </th>
              <td className="px-4 py-3">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
