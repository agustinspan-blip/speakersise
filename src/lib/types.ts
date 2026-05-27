/**
 * Physical category of the cabinet.
 */
export type SpeakerType = "bookshelf" | "floorstander";

/**
 * How the speaker is driven:
 *   - `passive`: needs an external power amp (the classic case).
 *   - `active`: fully self-powered, amps built into every driver.
 *   - `hybrid`: a passive mid/treble column married to an active,
 *     usually DSP-controlled, powered bass section. Paradigm's "H"
 *     line (Persona 9H, Founder 120H) is the canonical example —
 *     physically floorstanders, but neither purely passive nor
 *     purely active, so they get their own power category.
 */
export type PowerType = "active" | "passive" | "hybrid";

export type DriverRole =
  | "tweeter"
  | "super-tweeter"
  | "midrange"
  | "mid-bass"
  | "woofer";

export interface Driver {
  role: DriverRole;
  sizeMm: number;
  quantity?: number;
  material?: string;
  notes?: string;
}

export interface Dimensions {
  heightMm: number;
  widthMm: number;
  depthMm: number;
  weightKg: number;
}

/**
 * Numeric range used for frequency response, recommended amp power and
 * speaker power handling. `min` is optional because most manufacturers
 * publish a maximum-only figure for power handling — omit `min` entirely
 * in that case (never use `0` as a placeholder). `frequencyResponseHz`
 * and `recommendedAmpW` should include both bounds when available.
 */
export interface Range {
  min?: number;
  max: number;
}

export type EnclosureType =
  | "sealed"
  | "bass-reflex-rear"
  | "bass-reflex-front"
  | "bass-reflex-down"
  | "passive-radiator"
  | "transmission-line";

/**
 * Active-speaker–only fields. Present on a `Speaker` only when
 * `powerType === "active"`. Passive speakers omit this block entirely.
 */
export type WirelessProtocol =
  | "bluetooth"
  | "airplay-2"
  | "google-cast"
  | "spotify-connect"
  | "tidal-connect"
  | "qobuz-connect"
  | "roon-ready"
  | "wisa"
  | "wifi";

export type WiredInput =
  | "rca-analog"
  | "rca-phono"
  | "xlr-analog"
  | "optical"
  | "coax"
  | "aes-ebu"
  | "usb-audio"
  | "usb-host"
  | "hdmi-input"
  | "hdmi-arc"
  | "hdmi-earc"
  | "ethernet"
  | "calibration-mic";

export type AudioOutput = "rca-sub" | "xlr-sub" | "hdmi-out";

export type RoomCorrection =
  | "dirac-live"
  | "dirac-live-limited"
  | "custom-dsp"
  | "manufacturer-preset";

export type AmplifierClass = "A" | "AB" | "D" | "G" | "H";

export interface AmplifierStage {
  /** References the matching `Driver.role` it powers. */
  driverRole: DriverRole;
  /** Continuous (RMS) power per channel, watts. */
  powerW: number;
  amplifierClass?: AmplifierClass;
}

export interface ActiveSpec {
  /** Per-stage amplification. Omit if the manufacturer publishes only an
   *  aggregate figure (use `totalAmpPowerW` then). */
  amplification?: AmplifierStage[];
  totalAmpPowerW?: number;
  /** Maximum SPL @ 1 m as published. Note in `description` if mono vs pair. */
  maxSplDb?: number;
  maxSampleRateKhz?: number;
  maxBitDepth?: number;
  /** Empty array means wireless-only. */
  wiredInputs: WiredInput[];
  wirelessProtocols: WirelessProtocol[];
  outputs?: AudioOutput[];
  roomCorrection?: RoomCorrection[];
  /** True when the system requires a primary + secondary pair (one master). */
  pairedSecondary?: boolean;
  /** True when the two speakers can link without a wired connection. */
  wirelessSpeakerLink?: boolean;
  latencyMs?: number;
  idlePowerW?: number;
  maxPowerConsumptionW?: number;
}

/**
 * Image slots per speaker. Only `front` is treated as effectively required
 * by the rest of the site:
 *   - `front` is the technical reference shot the `/compare` page renders
 *     at true scale (transparent or white background, cabinet upright,
 *     no stand). Without it the comparator falls back to the hero, which
 *     is visually misleading.
 *   - `hero` is the 3/4 marketing shot used in catalog cards and the
 *     speaker detail page; nice-to-have but not load-bearing.
 *   - `side`, `top`, `back` are optional supplementary views shown on the
 *     speaker detail page when present. Useful for sculpted cabinets
 *     (Sonus Faber lute, KEF Muon) where a profile reveals what the front
 *     can't. Sparse coverage is fine — the detail page renders each only
 *     when its slot is filled.
 */
export interface SpeakerImages {
  front?: string;
  side?: string;
  top?: string;
  back?: string;
  hero?: string;
}

export interface Speaker {
  id: string;
  brand: string;
  model: string;
  generation?: string;
  series?: string;
  type: SpeakerType;
  powerType: PowerType;
  year?: number;

  dimensions: Dimensions;
  drivers: Driver[];
  enclosure?: EnclosureType;
  portTuningHz?: number;

  frequencyResponseHz: Range;
  frequencyResponseToleranceDb?: number;

  sensitivityDb?: number;
  impedanceOhm?: number;
  impedanceMinOhm?: number;
  powerHandlingW?: Range;
  recommendedAmpW?: Range;

  /** Active-speaker spec block. Present only when `powerType === "active"`. */
  active?: ActiveSpec;

  images: SpeakerImages;
  sourceUrl: string;
  /**
   * Manufacturer-suggested retail price in USD. Optional because the
   * catalogue includes plenty of imports / discontinued / "POA" models
   * with no public MSRP. When present:
   *   - `max` is the canonical number (or upper bound of a range).
   *   - `min` is set ONLY when the model is sold across a price band —
   *     e.g. different finishes (piano black vs walnut Burr) priced
   *     differently. With both bounds set we render "low–high" and
   *     emit an AggregateOffer in the structured data.
   *   - `unit` says whether the published MAP is for the pair or for
   *     a single cabinet. Most consumer HiFi (B&W, KEF, Dali, Focal,
   *     Wharfedale, Sonus faber) publishes per-pair pricing; Klipsch
   *     Reference and many studio monitors publish per-each. Defaults
   *     to `"pair"` when omitted to match the consumer-HiFi norm.
   */
  priceUsd?: { min?: number; max: number; unit?: "pair" | "each" };
  /**
   * Short marketing-style description per locale. Shown above the spec
   * table on the speaker detail page. Optional — speakers without a
   * description simply don't render the block.
   */
  description?: {
    en?: string;
    es?: string;
  };
}
