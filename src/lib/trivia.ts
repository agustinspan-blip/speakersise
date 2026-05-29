/**
 * Hand-curated "Did you know?" trivia rotated by the QuickFacts
 * carousel on the home page. Tone: conversational, slightly playful —
 * not encyclopedia entries. Each item should land in <2 lines on
 * mobile and feel like something a friend in HiFi would tell you over
 * a coffee, not a marketing department over a press release.
 *
 * Rules for editing this list:
 *   - Only write trivia about brands currently in the live catalog.
 *     Planned-but-unimported brands get added when their first model
 *     ships, otherwise the trivia surfaces a brand the visitor can't
 *     actually click into.
 *   - Keep it factual but conversational. Numbers are great; superlatives
 *     ("the best", "incredible") aren't.
 *   - Both locales required. The Spanish version doesn't have to be a
 *     literal translation — adapt the idiom so it reads natively.
 */

export interface TriviaItem {
  id: string;
  en: string;
  es: string;
}

export const TRIVIA: TriviaItem[] = [
  {
    id: "dali-acronym",
    en: "Dali stands for Danish Audiophile Loudspeaker Industries — they came up with that backronym in 1983.",
    es: "Dali son las siglas de Danish Audiophile Loudspeaker Industries — el backronym se lo inventaron en 1983.",
  },
  {
    id: "bw-abbey-road",
    en: "Abbey Road Studios has used Bowers & Wilkins 800-series speakers to mix records since 1974. Most albums you know were mastered through them.",
    es: "Abbey Road usa Bowers & Wilkins de la serie 800 para mezclar discos desde 1974. Muchos álbumes que conocés se masterizaron a través de ellos.",
  },
  {
    id: "sf-lute",
    en: "Sonus Faber cabinets are shaped like Italian lutes — Franco Serblin trained as a luthier before founding the company.",
    es: "Las cabinets Sonus Faber tienen forma de laúd italiano. Franco Serblin se formó como luthier antes de meterse en audio.",
  },
  {
    id: "kef-uniq",
    en: "KEF's Uni-Q array tucks the tweeter inside the midrange cone, so the whole driver acts as a single point source. Patented in 1988.",
    es: "El Uni-Q de KEF mete el tweeter adentro del cono de midrange. El driver entero funciona como un único punto de emisión. Patentado en 1988.",
  },
  {
    id: "klipschorn-age",
    en: "The Klipschorn has been in continuous production since 1946 — that makes it older than the Fender Stratocaster and the long-play record.",
    es: "El Klipschorn lleva en producción continua desde 1946. Es más viejo que la Fender Stratocaster y que el formato LP.",
  },
  {
    id: "wharfedale-yorkshire",
    en: "Wharfedale is named after a valley in Yorkshire where founder Gilbert Briggs lived in 1932. The river Wharfe still runs through it.",
    es: "Wharfedale toma el nombre del valle de Yorkshire donde vivía Gilbert Briggs en 1932. El río Wharfe sigue corriendo ahí.",
  },
  {
    id: "polk-sda",
    en: "Polk's Legend L800 uses SDA — interaural crosstalk cancellation. It basically tricks your ears into hearing wider stereo than physics should allow.",
    es: "El Polk Legend L800 usa SDA — cancelación de crosstalk interaural. Engaña al oído para que perciba un stereo más ancho del que la física permite.",
  },
  {
    id: "bw-tv-repair",
    en: "Bowers & Wilkins started as a TV repair shop John Bowers ran in Worthing in 1966. Their first speaker came two years later.",
    es: "Bowers & Wilkins arrancó como un local de reparación de TVs que John Bowers atendía en Worthing en 1966. Dos años después salió su primer parlante.",
  },
  {
    id: "dd-room-dsp",
    en: "Dutch & Dutch's 8c is an active monitor that wants to live in your room, not your studio. The DSP knows your wall is behind it and cancels accordingly.",
    es: "El 8c de Dutch & Dutch es un monitor activo pensado para vivir en tu living, no en un estudio. El DSP asume que tenés una pared atrás y compensa.",
  },
  {
    id: "focal-beryllium",
    en: "Focal's beryllium tweeter dome is so light a single paperclip weighs more. It's what gives the Sopra and Utopia lines their signature top end.",
    es: "El domo de tweeter en berilio puro de Focal pesa menos que un clip. Es lo que le da a las líneas Sopra y Utopia su firma sónica en agudos.",
  },
  {
    id: "dynaudio-esotar",
    en: "Dynaudio designs every driver in-house. The same Esotar soft-dome tweeter shows up in their Heritage, Confidence and Contour lines.",
    es: "Dynaudio diseña todos sus drivers in-house. El mismo tweeter Esotar de domo suave aparece en sus líneas Heritage, Confidence y Contour.",
  },
  {
    id: "ma-ccam",
    en: "Monitor Audio's C-CAM driver material is the same alloy used in aerospace honeycomb cores: aluminum-magnesium with a ceramic coating.",
    es: "El material C-CAM que Monitor Audio usa en sus drivers es la misma aleación de aluminio-magnesio recubierta de cerámica que se usa en aviación.",
  },
  {
    id: "canton-bct",
    en: "Canton's flagship Reference line uses BCT (Black Ceramic Tungsten) driver cones. The exact recipe is a German trade secret they refuse to publish.",
    es: "La línea Reference de Canton usa conos BCT (Black Ceramic Tungsten). La receta exacta es un secreto industrial que la marca alemana no publica.",
  },
  {
    id: "rizzi-uruguay",
    en: "Rizzi Acoustics builds The Owl in Uruguay from baltic birch. The entire front baffle vibrates as a single radiating surface — no separate drivers in the bass.",
    es: "Rizzi Acoustics arma su modelo The Owl en Uruguay con abedul báltico. Todo el baffle frontal vibra como una sola superficie emisora — no hay drivers de bajo convencionales.",
  },
  {
    id: "klipsch-arkansas",
    en: "Klipsch's Heritage line cabinets are still glued together in Hope, Arkansas — the same town Paul Klipsch started the company in 1946.",
    es: "Las cabinets de la línea Heritage de Klipsch siguen pegándose en Hope, Arkansas — el mismo pueblo donde Paul Klipsch fundó la marca en 1946.",
  },
  {
    id: "kef-ls50",
    en: "The KEF LS50 was launched in 2012 to celebrate the brand's 50th anniversary. It became one of the most-reviewed audiophile bookshelves of the decade.",
    es: "El KEF LS50 se lanzó en 2012 para celebrar los 50 años de la marca. Terminó siendo uno de los bookshelves audiófilos más reseñados de la década.",
  },
  {
    id: "wharfedale-oldest",
    en: "Wharfedale is the oldest brand we track — founded in 1932, that's older than the vinyl LP format itself.",
    es: "Wharfedale es la marca más antigua del catálogo. Fundada en 1932, es más vieja que el propio formato del LP en vinilo.",
  },
  {
    id: "monitor-audio-1972",
    en: "Monitor Audio was founded in 1972 in Cambridgeshire by Mo Iqbal — same year as Klipsch's Forte first prototype and Polk Audio in Baltimore.",
    es: "Monitor Audio fue fundada en 1972 en Cambridgeshire por Mo Iqbal — el mismo año que Polk Audio en Baltimore.",
  },
  {
    id: "focal-france",
    en: "Focal builds the Utopia in Saint-Étienne, France — the same workshop has been hand-assembling their flagships since 1981.",
    es: "Focal fabrica la línea Utopia en Saint-Étienne, Francia. El mismo taller ensambla a mano sus tope de gama desde 1981.",
  },
  {
    id: "sf-aida",
    en: "The Sonus Faber Aida is hand-finished by a single luthier per unit. Total production is around 30 pairs a year.",
    es: "El Sonus Faber Aida lo termina a mano un único luthier por unidad. Se fabrican alrededor de 30 pares al año.",
  },
  {
    id: "compare-tools-real-scale",
    en: "TrueScale renders every speaker at the same pixels-per-millimeter. When you compare two cabinets here, you're seeing the actual height difference, not a chart.",
    es: "TrueScale renderiza cada parlante con la misma escala de píxeles por milímetro. Cuando comparás dos cabinets acá, estás viendo la diferencia de altura real, no un gráfico.",
  },
  {
    id: "shuffle-never-mixes",
    en: "The Shuffle button never crosses speaker types — bookshelf vs floorstander would be like comparing a sedan to a pickup at true scale.",
    es: "El botón Aleatorio nunca mezcla tipos — bookshelf vs floorstander sería como comparar un sedán con una camioneta a escala real.",
  },
  {
    id: "dali-no-distributor",
    en: "Dali's name was chosen partly because it sounds the same in every language on earth — easier when you sell in 70+ countries.",
    es: "Dali eligió el nombre en parte porque suena igual en todos los idiomas del planeta — útil cuando vendés en más de 70 países.",
  },
  {
    id: "jbl-name-origin",
    en: "JBL stands for James Bullough Lansing — the same engineer who founded Altec Lansing first, then split off in 1946 to start his second speaker company. Both brands still bear his name.",
    es: "JBL son las iniciales de James Bullough Lansing — el mismo ingeniero que ya había fundado Altec Lansing y se separó en 1946 para arrancar su segunda marca de parlantes. Las dos siguen llevando su nombre.",
  },
  {
    id: "jbl-l100-bestseller",
    en: "The JBL L100 from 1970 wasn't just JBL's bestseller — it was the bestselling speaker of any brand in the entire decade, with over 125,000 pairs sold. The L100 Classic MkII in this catalog is the modern revival of that exact silhouette.",
    es: "El JBL L100 de 1970 no fue solo el más vendido de JBL — fue el parlante más vendido de cualquier marca en toda la década, con más de 125.000 pares colocados. El L100 Classic MkII de este catálogo es el revival actual del mismo perfil.",
  },
  {
    id: "jbl-paragon",
    en: "JBL's Paragon (1957–1983) was a 2.7-metre one-piece stereo console finished by hand — over 100 hours of woodwork per unit. It holds the longest production run of any JBL speaker and was the most expensive home loudspeaker on the market when it launched.",
    es: "El Paragon de JBL (1957–1983) fue una consola estéreo de una sola pieza de 2,7 metros, terminada a mano — más de 100 horas de carpintería por unidad. Tiene la producción más larga de cualquier JBL y fue el parlante hogareño más caro del mundo cuando salió.",
  },
  {
    id: "jbl-quadrex-colors",
    en: "The black, orange and blue Quadrex foam grilles on the L-Classic line aren't a retro design flourish — they're the exact three colours JBL has offered for the L100 family since 1970.",
    es: "Las grillas de espuma Quadrex en negro, naranja y azul de la línea L-Classic no son un guiño retro — son los mismos tres colores que JBL ofrece para la familia L100 desde 1970.",
  },
  {
    id: "elac-sonar-pivot",
    en: "ELAC was founded in Kiel in 1926 to build submarine sonar. They only pivoted to home audio after WWII left them unable to make military gear — the Kiel factory still hand-assembles every Concentro today.",
    es: "ELAC se fundó en Kiel en 1926 para fabricar sonar de submarino. Recién pivoteó al audio hogareño después de la 2da Guerra, cuando ya no podían hacer equipo militar — la planta de Kiel todavía arma a mano cada Concentro.",
  },
  {
    id: "elac-jet-amt",
    en: "ELAC's JET tweeter is a folded ribbon — Oskar Heil patented the design as the Air Motion Transformer in 1972. ELAC has shipped six generations since the '90s; the Concentro M807 carries the latest JET 6c.",
    es: "El tweeter JET de ELAC es un ribbon plegado — Oskar Heil patentó el diseño en 1972 como Air Motion Transformer. ELAC ya lleva seis generaciones desde los '90; el Concentro M807 monta el último JET 6c.",
  },
  {
    id: "elac-andrew-jones",
    en: "ELAC's Debut and UniFi lines were designed by Andrew Jones — the same engineer who built Pioneer's $20K+ TAD reference speakers. The 2015 Debut B6 launched at $279/pair using the same crossover ethos.",
    es: "Las líneas Debut y UniFi de ELAC las diseñó Andrew Jones — el mismo ingeniero que había hecho las TAD referencia de Pioneer de más de USD 20.000. El Debut B6 de 2015 salió a USD 279 el par con la misma filosofía de crossover.",
  },
];
