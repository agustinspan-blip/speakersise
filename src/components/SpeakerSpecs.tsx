"use client";

import type { Dictionary, Locale } from "@/lib/i18n";
import type { Speaker } from "@/lib/types";
import {
  formatLengthMm,
  formatWeightKg,
  formatDriverSizeMm,
  formatPriceUsd,
} from "@/lib/units";
import { useUnits } from "@/lib/use-units";

/**
 * Speaker detail spec table with a cm/in toggle. Client component so
 * the unit switch is interactive and persisted (shared with the
 * /ladder and comparator preference via the `useUnits` hook + a
 * localStorage key). Dimension and driver-size rows reformat live;
 * everything in universal units (Hz, dB, ohm, watts, USD) stays put.
 */
export function SpeakerSpecs({
  speaker: s,
  typeLabel,
  locale,
  t,
}: {
  speaker: Speaker;
  typeLabel: string;
  locale: Locale;
  t: Dictionary;
}) {
  const { units, setUnits } = useUnits();

  const fmtRange = (r: { min?: number; max: number }, unit: string) =>
    r.min !== undefined ? `${r.min}–${r.max} ${unit}` : `${r.max} ${unit}`;
  const fmtDrivers = (s: Speaker) =>
    s.drivers
      .map(
        (d) =>
          `${d.quantity ?? 1}× ${d.sizeMm > 0 ? `${formatDriverSizeMm(d.sizeMm, units)} ` : ""}${d.role}${d.material ? ` (${d.material})` : ""}`
      )
      .join(", ");
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
      {
        active: t.specs.active,
        passive: t.specs.passive,
        hybrid: t.specs.hybrid,
      }[s.powerType],
    ],
    [t.specs.height, formatLengthMm(s.dimensions.heightMm, units)],
    [t.specs.width, formatLengthMm(s.dimensions.widthMm, units)],
    [t.specs.depth, formatLengthMm(s.dimensions.depthMm, units)],
    [t.specs.weight, formatWeightKg(s.dimensions.weightKg, units)],
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
    s.priceUsd
      ? [
          t.specs.price,
          formatPriceUsd(s.priceUsd, locale, {
            pair: t.specs.pricePerPair,
            each: t.specs.priceEach,
          }),
        ]
      : null,
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
            s.active?.maxSplDb !== undefined ? `${s.active.maxSplDb} dB` : "—",
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
          [t.specs.wirelessSpeakerLink, yesNo(s.active?.wirelessSpeakerLink)],
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
    <div className="mt-8">
      {/* cm / in toggle — sits above the table, right-aligned. */}
      <div className="mb-2 flex justify-end">
        <div
          className="inline-flex items-center gap-2 text-xs"
          aria-label={t.ladder.unitsLabel}
        >
          <span className="uppercase tracking-wider text-stone-500">
            {t.ladder.unitsLabel}
          </span>
          <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 overflow-hidden">
            {(
              [
                ["metric", t.ladder.unitsCm],
                ["imperial", t.ladder.unitsIn],
              ] as const
            ).map(([key, label]) => {
              const isActive = key === units;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUnits(key)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    isActive
                      ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
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
    </div>
  );
}
