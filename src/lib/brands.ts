/**
 * Per-brand logo metadata, shared between the catalog cards, the detail page,
 * and the bottom brand strip. `heightClass` is the size used inside speaker
 * cards / next to a single speaker; `stripHeightClass` is the larger size used
 * in the brand-strip row at the bottom of the page.
 */
export interface BrandLogo {
  src: string;
  width: number;
  height: number;
  heightClass: string;
  stripHeightClass: string;
  /** Size used in the BrandHero (visual lockup at the top of brand pages). */
  heroHeightClass: string;
  /** Optional negative-margin offset applied only inside speaker cards. */
  cardOffsetClass?: string;
  /**
   * When true (default), the logo is colour-inverted in dark mode — useful
   * for monochrome wordmarks. Set to false for multi-colour brand marks
   * whose hues should be preserved (e.g. red/white badge logos).
   */
  darkInvert?: boolean;
  /**
   * Optional CSS colour. When set, the logo is rendered via `mask-image` and
   * the mask is filled with this colour — useful for monochrome PNGs whose
   * shape we want to keep but recolour to a brand-correct hue.
   */
  tintColor?: string;
  /**
   * "live"    → the brand has speakers in the catalog (default).
   * "planned" → reserved for the public roadmap (`/plan`); not shown in
   *             the catalog or the dark-footer brand strip.
   */
  status?: "live" | "planned";
}

export const BRAND_LOGOS: Record<string, BrandLogo> = {
  "Monitor Audio": {
    src: "/brands/monitor-audio.png",
    width: 500,
    height: 95,
    heightClass: "h-5",
    stripHeightClass: "h-[40px]",
    // Wide wordmark — needs less vertical height to balance Dali's tall mark.
    heroHeightClass: "h-[44px] sm:h-[56px]",
  },
  Dali: {
    // Red square mark with the DALI wordmark, no slogan — cropped from the
    // official press logo (the original SVG bundled the "In admiration of
    // music" tagline below).
    src: "/brands/dali.png",
    width: 599,
    height: 600,
    heightClass: "h-10",
    stripHeightClass: "h-[64px]",
    heroHeightClass: "h-[110px] sm:h-[140px]",
    // Two-colour badge — keep the brand red instead of inverting in dark mode.
    darkInvert: false,
  },
  Dynaudio: {
    // Wide single-colour wordmark (864×111, aspect ≈ 7.78). Because it's
    // ~50% wider per unit height than Monitor Audio (aspect 5.26), we shrink
    // its strip height so the rendered *width* lands at ~210 px — matching
    // Monitor Audio's footprint in the brand strip and keeping all three
    // logos visually balanced.
    src: "/brands/dynaudio.png",
    width: 864,
    height: 111,
    heightClass: "h-4",
    stripHeightClass: "h-[27px]",
    heroHeightClass: "h-[30px] sm:h-[38px]",
  },
  Wharfedale: {
    // Wide wordmark (4771×986, aspect ≈ 4.84) — sits between Monitor Audio
    // and Dynaudio in proportions. Monochrome, so it inherits the default
    // dark-mode invert.
    src: "/brands/wharfedale.png",
    width: 4771,
    height: 986,
    heightClass: "h-5",
    stripHeightClass: "h-[40px]",
    heroHeightClass: "h-[44px] sm:h-[56px]",
  },
  "Dutch & Dutch": {
    // Square logo (•DD mark stacked over wordmark, 600×600). The orange
    // dot is part of the brand identity — keep colour, don't invert in dark.
    src: "/brands/dutch-dutch.png",
    width: 600,
    height: 600,
    heightClass: "h-10",
    stripHeightClass: "h-[64px]",
    heroHeightClass: "h-[110px] sm:h-[140px]",
    darkInvert: false,
  },
  "Rizzi Acoustics": {
    // Wide horizontal wordmark (2732×1932 source — close to square-ish; the
    // logo sits in a tall canvas with whitespace around it). Tinted to the
    // brand's dark forest green (sampled from the source PNG at #003d32)
    // so the footer matches the colour shown on the brands grid.
    src: "/brands/rizzi-acoustics.png",
    width: 2732,
    height: 1932,
    heightClass: "h-8",
    // Canvas aspect ≈ 1.41 (taller than the other wordmarks), so the same
    // pixel height renders narrower; bump it up so its visual mass in the
    // strip matches Monitor Audio / Wharfedale rather than Dali's tiny box.
    stripHeightClass: "h-[80px]",
    heroHeightClass: "h-[64px] sm:h-[84px]",
    darkInvert: false,
    // Source PNG is `#003d32` (deep teal-green); on the dark footer that
    // hue has ~1.6:1 contrast and is unreadable, so we lighten it while
    // keeping the same hue family (~168° in HSL) so the footer still reads
    // as "the green Rizzi logo".
    tintColor: "#5fa388",
  },
  Paradigm: {
    // Paradigm wordmark (900×500). Standard wider-wordmark tier.
    src: "/brands/paradigm.png",
    width: 900,
    height: 500,
    heightClass: "h-7",
    stripHeightClass: "h-[44px]",
    heroHeightClass: "h-[56px] sm:h-[72px]",
  },
  Canton: {
    // Compact Canton wordmark (300×150, aspect 2.0). Sits in the wider
    // wordmark tier alongside KEF / Polk.
    src: "/brands/canton.png",
    width: 300,
    height: 150,
    heightClass: "h-7",
    stripHeightClass: "h-[44px]",
    heroHeightClass: "h-[56px] sm:h-[72px]",
  },
  Polk: {
    // 16:9 PNG of the Polk Audio wordmark. Standard wordmark tier.
    src: "/brands/polk.png",
    width: 3840,
    height: 2160,
    heightClass: "h-7",
    stripHeightClass: "h-[44px]",
    heroHeightClass: "h-[56px] sm:h-[72px]",
  },
  Klipsch: {
    // 16:9 PNG with the Klipsch wordmark; source is large (3840×2160)
    // and renders fine at all sizes. Standard wordmark tier.
    src: "/brands/klipsch.png",
    width: 3840,
    height: 2160,
    heightClass: "h-7",
    stripHeightClass: "h-[44px]",
    heroHeightClass: "h-[56px] sm:h-[72px]",
  },
  "Sonus Faber": {
    // Compact wordmark "Sonus faber" (294×55, aspect ≈ 5.35). Standard
    // wide-wordmark tier alongside Monitor Audio / Wharfedale / Focal.
    src: "/brands/sonus-faber.png",
    width: 294,
    height: 55,
    heightClass: "h-5",
    stripHeightClass: "h-[40px]",
    heroHeightClass: "h-[44px] sm:h-[56px]",
  },
  Focal: {
    // Compact wordmark "FOCAL" (300×62, aspect ≈ 4.84). Sits in the same
    // tier as Monitor Audio / Wharfedale — wide single-colour wordmarks
    // that get the standard h-5 / h-[40px] treatment.
    src: "/brands/focal.svg",
    width: 300,
    height: 62,
    heightClass: "h-5",
    stripHeightClass: "h-[40px]",
    heroHeightClass: "h-[44px] sm:h-[56px]",
  },
  KEF: {
    // Square KEF wordmark — monochrome black-on-transparent so it inherits
    // dark-mode invert by default. The mark reads well at any size; we use
    // the same hero height tier as Dali / Dutch & Dutch (the other square
    // marks) to keep the brand strip visually balanced.
    src: "/brands/kef.png",
    width: 2000,
    height: 2000,
    heightClass: "h-9",
    stripHeightClass: "h-[60px]",
    heroHeightClass: "h-[100px] sm:h-[128px]",
  },
  "Bowers & Wilkins": {
    // Horizontal "Bowers & Wilkins" wordmark with the B&W badge (747×76,
    // aspect ≈ 9.83). White pixels (the "B&W" lettering inside the badge)
    // were knocked out to transparent in the source PNG so that, after the
    // default dark-mode `invert`, the badge reads as a filled white pill
    // with the "B&W" text showing through to the dark footer behind it.
    src: "/brands/bowers-wilkins.png",
    width: 747,
    height: 76,
    heightClass: "h-4",
    stripHeightClass: "h-[22px]",
    heroHeightClass: "h-[28px] sm:h-[36px]",
  },
  // Note: Monitor Audio's logo is a single-colour wordmark, so it implicitly
  // gets `darkInvert: true` (the default behaviour).

  // ── Planned brands (shown only on the `/plan` page, in greyscale) ──
  // The /plan page sorts by name on render so order here doesn't matter
  // visually. All planned entries share the same size classes; only `src`
  // and intrinsic dimensions differ. Add new brands as one-line entries.
  ...planned({
    "Acoustic Energy": ["acoustic-energy.png", 345, 38],
    Aretai: ["aretai.png", 481, 247],
    "Adam Audio": ["adam-audio.png", 5000, 833],
    Amphion: ["amphion.png", 794, 280],
    Aperion: ["aperion.png", 1492, 390],
    Arendal: ["arendal.png", 512, 512],
    ATC: ["atc.png", 800, 600],
    "Audio Solutions": ["audio-solutions.png", 208, 126],
    "Auer Acoustics": ["auer-acoustics.png", 1636, 546],
    "Bang & Olufsen": ["bang-olufsen.png", 1424, 958],
    Børresen: ["borresen.png", 1920, 512],
    Buchardt: ["buchardt.png", 1500, 442],
    "Cambridge Audio": ["cambridge-audio.png", 300, 240],
    Castle: ["castle.png", 600, 376],
    CSS: ["css.png", 400, 400],
    Devialet: ["devialet.png", 2633, 1550],
    "DeVore Fidelity": ["devore.png", 650, 366],
    ELAC: ["elac.png", 500, 222],
    Elipson: ["elipson.png", 762, 257],
    Emotiva: ["emotiva.png", 911, 129],
    Estelon: ["estelon.png", 269, 215],
    "Fyne Audio": ["fyne-audio.png", 2431, 1000],
    Gallion: ["gallion.png", 492, 239],
    "Grimm Audio": ["grimm-audio.png", 1628, 423],
    Genelec: ["genelec.png", 680, 680],
    "Gold Note": ["gold-note.png", 480, 159],
    GoldenEar: ["goldenear.png", 1349, 402],
    Harbeth: ["harbeth.png", 504, 120],
    "HEDD Audio": ["hedd.png", 1037, 313],
    Jamo: ["jamo.png", 360, 360],
    JBL: ["jbl.png", 256, 256],
    "Jones & Carreta": ["jones-carreta.png", 826, 386],
    "Kerr Acoustics": ["kerr-acoustics.png", 177, 180],
    Kanto: ["kanto.png", 1922, 484],
    "Kii Audio": ["kii.png", 536, 536],
    KLH: ["klh.png", 530, 217],
    Kudos: ["kudos.png", 800, 600],
    Linn: ["linn.png", 1080, 1080],
    "Lorenzo Audio": ["lorenzo-audio.png", 934, 200],
    Lyngdorf: ["lyngdorf.png", 960, 500],
    Magico: ["magico.png", 1200, 1236],
    Magnat: ["magnat.png", 1935, 389],
    "Manger Audio": ["manger.png", 2108, 454],
    Marten: ["marten.png", 1000, 800],
    MartinLogan: ["martin-logan.png", 960, 588],
    McIntosh: ["mcintosh.png", 900, 333],
    "Meridian Audio": ["meridian.png", 388, 209],
    Mission: ["mission.png", 330, 330],
    MoFi: ["mofi.png", 600, 350],
    OAudio: ["oaudio.png", 1465, 393],
    Perlisten: ["perlisten.png", 2231, 386],
    Piega: ["piega.png", 822, 172],
    "Pitt & Giblin": ["pitt-giblin.png", 1500, 1500],
    PMC: ["pmc.png", 480, 480],
    "Pro-Ject": ["pro-ject.png", 267, 140],
    "PS Audio": ["ps-audio.png", 272, 300],
    PSB: ["psb.png", 2400, 2400],
    Pylon: ["pylon.png", 330, 330],
    "Q Acoustics": ["q-acoustics.png", 300, 300],
    Quad: ["quad.png", 800, 800],
    Qualio: ["qualio.png", 222, 222],
    "Radiant Acoustics": ["radiant-acoustics.png", 302, 378],
    Raidho: ["raidho-acoustics.png", 900, 500],
    Reezoldini: ["reezoldini.png", 309, 47],
    Rega: ["rega.png", 446, 218],
    Revel: ["revel.png", 600, 204],
    "Revival Audio": ["revival-audio.png", 500, 137],
    Rockport: ["rockport.png", 1273, 336],
    "Rosso Fiorentino": ["rosso-fiorentino.png", 1000, 496],
    Ruark: ["ruark.png", 1251, 395],
    Sonner: ["sonner.png", 529, 200],
    Spendor: ["spendor.png", 760, 155],
    Stenheim: ["stenheim.png", 2172, 930],
    "Steinway Lyngdorf": ["steinway-lyngdorf.png", 500, 478],
    SVS: ["svs.png", 684, 600],
    "T+A": ["ta.png", 2362, 945],
    TAD: ["tad.png", 399, 155],
    Tannoy: ["tannoy.png", 1280, 270],
    Technics: ["technics.png", 2400, 470],
    "Totem Acoustic": ["totem.png", 1200, 376],
    Triangle: ["triangle.png", 380, 176],
    Vestlyd: ["vestlyd.png", 1024, 576],
    "Vivid Audio": ["vivid-audio.png", 1854, 946],
    "Wilson Audio": ["wilson-audio.png", 1194, 1196],
    "Wilson Benesch": ["wilson-benesch.png", 801, 118],
    Yamaha: ["yamaha.png", 1800, 469],
    "YG Acoustics": ["yg-acoustics.png", 1194, 1196],
    "Zelier Audio": ["zelier-audio.png", 736, 122],
    "Zu Audio": ["zu.png", 360, 504],
  }),
};

/**
 * Helper: expands a `{ name: [filename, w, h] }` map into full BrandLogo
 * entries with the standard planned-brand size classes. Keeps the long
 * planned-brand list readable without hand-repeating identical fields.
 */
function planned(
  entries: Record<string, [filename: string, width: number, height: number]>
): Record<string, BrandLogo> {
  const out: Record<string, BrandLogo> = {};
  for (const [name, [filename, width, height]] of Object.entries(entries)) {
    out[name] = {
      src: `/brands/${filename}`,
      width,
      height,
      heightClass: "h-5",
      stripHeightClass: "h-[40px]",
      heroHeightClass: "h-[44px] sm:h-[56px]",
      status: "planned",
    };
  }
  return out;
}

/**
 * Brand metadata shown on the brand-filtered catalog page (BrandHero):
 * country of origin (with flag emoji) and the dictionary key for a short
 * description string.
 */
export interface BrandInfo {
  /** ISO 3166-1 alpha-2 country code (informational). */
  countryCode: string;
  /** Unicode flag emoji — renders without external assets. */
  countryFlag: string;
  /** Translation key under `home.brandDescriptions.*` */
  descriptionKey:
    | "monitorAudio"
    | "dali"
    | "dynaudio"
    | "wharfedale"
    | "dutchDutch"
    | "rizziAcoustics"
    | "bowersWilkins"
    | "kef"
    | "focal"
    | "sonusFaber"
    | "klipsch"
    | "polk"
    | "canton"
    | "paradigm";
  /** Translation key under `home.brandCountries.*` */
  countryKey: "uk" | "denmark" | "netherlands" | "uruguay" | "france" | "italy" | "us" | "germany" | "canada";
  /** Year the brand was founded — shown as a small meta line. */
  foundedYear: number;
  /** Manufacturer's official website (homepage). */
  websiteUrl: string;
}

export const BRAND_INFO: Record<string, BrandInfo> = {
  "Monitor Audio": {
    countryCode: "GB",
    countryFlag: "🇬🇧",
    descriptionKey: "monitorAudio",
    countryKey: "uk",
    foundedYear: 1972,
    websiteUrl: "https://www.monitoraudio.com",
  },
  Dali: {
    countryCode: "DK",
    countryFlag: "🇩🇰",
    descriptionKey: "dali",
    countryKey: "denmark",
    foundedYear: 1983,
    websiteUrl: "https://www.dali-speakers.com",
  },
  Dynaudio: {
    countryCode: "DK",
    countryFlag: "🇩🇰",
    descriptionKey: "dynaudio",
    countryKey: "denmark",
    foundedYear: 1977,
    websiteUrl: "https://dynaudio.com",
  },
  Wharfedale: {
    countryCode: "GB",
    countryFlag: "🇬🇧",
    descriptionKey: "wharfedale",
    countryKey: "uk",
    foundedYear: 1932,
    websiteUrl: "https://www.wharfedale.co.uk",
  },
  "Dutch & Dutch": {
    countryCode: "NL",
    countryFlag: "🇳🇱",
    descriptionKey: "dutchDutch",
    countryKey: "netherlands",
    foundedYear: 2014,
    websiteUrl: "https://dutchdutch.com",
  },
  "Rizzi Acoustics": {
    countryCode: "UY",
    countryFlag: "🇺🇾",
    descriptionKey: "rizziAcoustics",
    countryKey: "uruguay",
    foundedYear: 2024,
    websiteUrl: "https://rizziacoustics.com",
  },
  "Bowers & Wilkins": {
    countryCode: "GB",
    countryFlag: "🇬🇧",
    descriptionKey: "bowersWilkins",
    countryKey: "uk",
    foundedYear: 1966,
    websiteUrl: "https://www.bowerswilkins.com",
  },
  KEF: {
    countryCode: "GB",
    countryFlag: "🇬🇧",
    descriptionKey: "kef",
    countryKey: "uk",
    foundedYear: 1961,
    websiteUrl: "https://www.kef.com",
  },
  Focal: {
    countryCode: "FR",
    countryFlag: "🇫🇷",
    descriptionKey: "focal",
    countryKey: "france",
    foundedYear: 1979,
    websiteUrl: "https://www.focal.com",
  },
  "Sonus Faber": {
    countryCode: "IT",
    countryFlag: "🇮🇹",
    descriptionKey: "sonusFaber",
    countryKey: "italy",
    foundedYear: 1980,
    websiteUrl: "https://www.sonusfaber.com",
  },
  Klipsch: {
    countryCode: "US",
    countryFlag: "🇺🇸",
    descriptionKey: "klipsch",
    countryKey: "us",
    foundedYear: 1946,
    websiteUrl: "https://www.klipsch.com",
  },
  Polk: {
    countryCode: "US",
    countryFlag: "🇺🇸",
    descriptionKey: "polk",
    countryKey: "us",
    foundedYear: 1972,
    websiteUrl: "https://www.polkaudio.com",
  },
  Canton: {
    countryCode: "DE",
    countryFlag: "🇩🇪",
    descriptionKey: "canton",
    countryKey: "germany",
    foundedYear: 1972,
    websiteUrl: "https://www.canton.de",
  },
  Paradigm: {
    countryCode: "CA",
    countryFlag: "🇨🇦",
    descriptionKey: "paradigm",
    countryKey: "canada",
    foundedYear: 1982,
    websiteUrl: "https://www.paradigm.com",
  },
};

/**
 * Per-brand colour theme. Each entry is a literal Tailwind class string so the
 * Tailwind compiler can pick it up via static analysis. To add a new brand,
 * only add literal class names here — never construct them dynamically.
 */
export interface BrandTheme {
  /** Body background (rarely changes between brands; left here for future use). */
  pageBg: string;
  /** Small uppercase eyebrow text (CATALOG, BRAND, FEATURED, etc.). */
  accentEyebrow: string;
  /** Italic word inside the hero headline. */
  accentTitle: string;
  /** Hover colour for model name on speaker cards. */
  accentHover: string;
  /** Arrow or small inline accent. */
  accentArrow: string;
  /** Filled accent button (Apply filter, primary CTA). */
  ctaBg: string;
  /** Outline accent for borders / links. */
  accentBorder: string;
  /** rgba colour for the hero radial wash background. */
  glowColor: string;
}

export const DEFAULT_THEME: BrandTheme = {
  pageBg: "bg-stone-50 dark:bg-stone-950",
  accentEyebrow: "text-amber-700 dark:text-amber-400",
  accentTitle: "text-amber-700 dark:text-amber-400",
  accentHover:
    "group-hover:text-amber-700 dark:group-hover:text-amber-400",
  accentArrow: "text-amber-700 dark:text-amber-400",
  ctaBg:
    "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400",
  accentBorder: "border-amber-600 dark:border-amber-400",
  glowColor: "rgba(217, 119, 6, 0.10)", // amber-600
};

export const BRAND_THEMES: Record<string, BrandTheme> = {
  // Monitor Audio: deep matte-black premium identity. Near-black accents with
  // a hint of dark bronze/caramel, echoing their site's heavy use of pure
  // black and the warm metallic tones on their Platinum range photography.
  "Monitor Audio": {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-amber-900 dark:text-amber-200",
    accentTitle: "text-stone-900 dark:text-stone-100",
    accentHover:
      "group-hover:text-amber-900 dark:group-hover:text-amber-200",
    accentArrow: "text-amber-900 dark:text-amber-200",
    ctaBg:
      "bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700",
    accentBorder: "border-stone-900 dark:border-stone-100",
    glowColor: "rgba(28, 25, 23, 0.08)", // stone-900, very subtle
  },
  // Dali: signature red (#C22033) on cream — sharp, scandinavian, minimal.
  Dali: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-red-700 dark:text-red-400",
    accentTitle: "text-red-700 dark:text-red-400",
    accentHover:
      "group-hover:text-red-700 dark:group-hover:text-red-400",
    accentArrow: "text-red-700 dark:text-red-400",
    ctaBg:
      "bg-red-700 hover:bg-red-800 dark:bg-red-500 dark:hover:bg-red-400",
    accentBorder: "border-red-700 dark:border-red-400",
    glowColor: "rgba(194, 32, 51, 0.12)", // brand red
  },
  // Dynaudio: pure-black industrial identity warmed by the orange/red of the
  // Esotar tweeter diaphragm — captured here as a deep orange accent on
  // near-black backgrounds. Matches the brand's product photography mood.
  Dynaudio: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-orange-700 dark:text-orange-400",
    accentTitle: "text-stone-900 dark:text-stone-100",
    accentHover:
      "group-hover:text-orange-700 dark:group-hover:text-orange-400",
    accentArrow: "text-orange-700 dark:text-orange-400",
    ctaBg:
      "bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700",
    accentBorder: "border-stone-900 dark:border-stone-100",
    glowColor: "rgba(194, 65, 12, 0.10)", // orange-700, very subtle
  },
  // Wharfedale: British heritage brand with a warm walnut/brass identity
  // (Linton, Denton, Aura cabinets). A deep emerald accent on stone/cream
  // sets it apart from the amber/red/orange already used by other brands
  // and reads as classic, understated UK HiFi.
  Wharfedale: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-emerald-800 dark:text-emerald-300",
    accentTitle: "text-emerald-800 dark:text-emerald-300",
    accentHover:
      "group-hover:text-emerald-800 dark:group-hover:text-emerald-300",
    accentArrow: "text-emerald-800 dark:text-emerald-300",
    ctaBg:
      "bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    accentBorder: "border-emerald-800 dark:border-emerald-300",
    glowColor: "rgba(6, 95, 70, 0.10)", // emerald-800, subtle
  },
  // Rizzi Acoustics: Baltic birch + gold ring + black membrane aesthetic.
  // Yellow-700/300 picks up the brass/gold driver bezel of The Owl and
  // stays distinct from Monitor Audio's amber and Dali's red.
  "Rizzi Acoustics": {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-yellow-700 dark:text-yellow-300",
    accentTitle: "text-yellow-700 dark:text-yellow-300",
    accentHover:
      "group-hover:text-yellow-700 dark:group-hover:text-yellow-300",
    accentArrow: "text-yellow-700 dark:text-yellow-300",
    ctaBg:
      "bg-yellow-700 hover:bg-yellow-800 dark:bg-yellow-500 dark:hover:bg-yellow-400",
    accentBorder: "border-yellow-700 dark:border-yellow-300",
    glowColor: "rgba(161, 98, 7, 0.10)", // yellow-700, subtle
  },
  // Bowers & Wilkins: British high-end heritage — the 800 Series Diamond
  // 4 line on gloss white/satin walnut. British Racing Green (`green-800`)
  // sits distant from Wharfedale's `emerald-800` (more blue-green) and
  // signals the classic UK identity without competing with the Dali red.
  "Bowers & Wilkins": {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-green-800 dark:text-green-300",
    accentTitle: "text-green-800 dark:text-green-300",
    accentHover:
      "group-hover:text-green-800 dark:group-hover:text-green-300",
    accentArrow: "text-green-800 dark:text-green-300",
    ctaBg:
      "bg-green-800 hover:bg-green-900 dark:bg-green-600 dark:hover:bg-green-500",
    accentBorder: "border-green-800 dark:border-green-300",
    glowColor: "rgba(22, 101, 52, 0.10)", // green-800, subtle
  },
  // Dutch & Dutch: minimal black/cream with the brand's signature
  // salmon-orange "DD" dot. Picked sky-700/sky-300 (Delft blue tone) for
  // accents to keep distance from Dynaudio's deeper orange while honouring
  // the Dutch identity. Swap if a better match emerges.
  "Dutch & Dutch": {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-sky-700 dark:text-sky-300",
    accentTitle: "text-sky-700 dark:text-sky-300",
    accentHover: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
    accentArrow: "text-sky-700 dark:text-sky-300",
    ctaBg:
      "bg-sky-700 hover:bg-sky-800 dark:bg-sky-500 dark:hover:bg-sky-400",
    accentBorder: "border-sky-700 dark:border-sky-300",
    glowColor: "rgba(3, 105, 161, 0.10)", // sky-700, subtle
  },
  // Paradigm: Canadian premium tech identity — AL-MAC ceramic tweeter +
  // CARBON-X bass tech in matte cabinets. `indigo-700` is fresh on the
  // palette (no other brand uses indigo) and reads as "precision tech"
  // without conflicting with KEF's `blue-700` (cobalt) or Polk's
  // `slate-700` (gray).
  Paradigm: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-indigo-700 dark:text-indigo-300",
    accentTitle: "text-indigo-700 dark:text-indigo-300",
    accentHover:
      "group-hover:text-indigo-700 dark:group-hover:text-indigo-300",
    accentArrow: "text-indigo-700 dark:text-indigo-300",
    ctaBg:
      "bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500",
    accentBorder: "border-indigo-700 dark:border-indigo-300",
    glowColor: "rgba(67, 56, 202, 0.10)", // indigo-700, subtle
  },
  // Canton: cool German-engineered metallic identity — black/silver
  // cabinets with Black Ceramic Tungsten drivers. `zinc-700` is the
  // closest Tailwind to brushed-aluminium, distinct from Polk's
  // `slate-700` (more blue) and Monitor Audio's `stone-900` (warmer).
  Canton: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-zinc-700 dark:text-zinc-300",
    accentTitle: "text-zinc-700 dark:text-zinc-300",
    accentHover:
      "group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
    accentArrow: "text-zinc-700 dark:text-zinc-300",
    ctaBg:
      "bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500",
    accentBorder: "border-zinc-700 dark:border-zinc-300",
    glowColor: "rgba(63, 63, 70, 0.10)", // zinc-700, subtle
  },
  // Polk Audio: cool slate-charcoal identity — the Reserve line's
  // satin-black gloss cabinets with the Pinnacle Ring Radiator and
  // Turbine Cone in chrome accents. `slate-700` is distinct from
  // KEF's `blue-700` (more saturated/cobalt) and Dutch & Dutch's
  // `sky-700` (lighter cyan).
  Polk: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-slate-700 dark:text-slate-300",
    accentTitle: "text-slate-700 dark:text-slate-300",
    accentHover:
      "group-hover:text-slate-700 dark:group-hover:text-slate-300",
    accentArrow: "text-slate-700 dark:text-slate-300",
    ctaBg:
      "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500",
    accentBorder: "border-slate-700 dark:border-slate-300",
    glowColor: "rgba(51, 65, 85, 0.10)", // slate-700, subtle
  },
  // Klipsch: copper Cerametallic woofers + horn-loaded compression
  // tweeters on ebony cabinets — `orange-800` reads as the copper-bronze
  // of the woofer surrounds, sits between Dynaudio's `orange-700`
  // (lighter) and Monitor Audio's `amber-900` (darker, more bronze).
  Klipsch: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-orange-800 dark:text-orange-300",
    accentTitle: "text-orange-800 dark:text-orange-300",
    accentHover:
      "group-hover:text-orange-800 dark:group-hover:text-orange-300",
    accentArrow: "text-orange-800 dark:text-orange-300",
    ctaBg:
      "bg-orange-800 hover:bg-orange-900 dark:bg-orange-600 dark:hover:bg-orange-500",
    accentBorder: "border-orange-800 dark:border-orange-300",
    glowColor: "rgba(154, 52, 18, 0.10)", // orange-800, subtle
  },
  // Sonus Faber: solid-walnut, brass and leather — the Heritage line's
  // warm Italian craftsmanship. `amber-700` sits between Rizzi's
  // `yellow-700` (more lemon) and Monitor Audio's `amber-900` (deeper,
  // near-bronze), giving Sonus Faber its own warm-brass identity.
  "Sonus Faber": {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-amber-700 dark:text-amber-200",
    accentTitle: "text-amber-700 dark:text-amber-200",
    accentHover: "group-hover:text-amber-700 dark:group-hover:text-amber-200",
    accentArrow: "text-amber-700 dark:text-amber-200",
    ctaBg:
      "bg-amber-700 hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400",
    accentBorder: "border-amber-700 dark:border-amber-200",
    glowColor: "rgba(180, 83, 9, 0.10)", // amber-700, subtle
  },
  // Focal: signature red identity with deep black cabinets — Tornado Red
  // on Sopra, classic red lacquer on Aria, Utopia in its various premium
  // wood finishes. `red-800` sits one shade darker than Dali's `red-700`
  // so the two red brands stay visually distinguishable side-by-side.
  Focal: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-red-800 dark:text-red-300",
    accentTitle: "text-red-800 dark:text-red-300",
    accentHover: "group-hover:text-red-800 dark:group-hover:text-red-300",
    accentArrow: "text-red-800 dark:text-red-300",
    ctaBg:
      "bg-red-800 hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-500",
    accentBorder: "border-red-800 dark:border-red-300",
    glowColor: "rgba(153, 27, 27, 0.10)", // red-800, subtle
  },
  // KEF: minimal black/white identity with the iconic blue used as the
  // Uni-Q midrange-ring accent on R Meta / Blade / Muon. `blue-700` keeps
  // distance from Dutch & Dutch's `sky-700` (more cyan/Delft) and reads as
  // KEF's deep-blue rather than navy.
  KEF: {
    pageBg: "bg-stone-50 dark:bg-stone-950",
    accentEyebrow: "text-blue-700 dark:text-blue-300",
    accentTitle: "text-blue-700 dark:text-blue-300",
    accentHover: "group-hover:text-blue-700 dark:group-hover:text-blue-300",
    accentArrow: "text-blue-700 dark:text-blue-300",
    ctaBg:
      "bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400",
    accentBorder: "border-blue-700 dark:border-blue-300",
    glowColor: "rgba(29, 78, 216, 0.10)", // blue-700, subtle
  },
};

export function getBrandTheme(
  brand: string | null | undefined
): BrandTheme {
  if (!brand) return DEFAULT_THEME;
  return BRAND_THEMES[brand] ?? DEFAULT_THEME;
}
