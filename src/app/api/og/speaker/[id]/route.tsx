import { ImageResponse } from "next/og";
import { getSpeakerById } from "@/lib/speakers";

/**
 * Per-speaker dynamic OG image. When someone shares
 *   /en/speaker/klipsch-la-scala-al6
 * social previews (X / WhatsApp / LinkedIn / Slack / Reddit) render this
 * 1200×630 card with the brand wordmark, model name + generation, and
 * a true-scale silhouette bar sized against a reference person at
 * 170 cm — instantly readable in a chat thread.
 *
 * Mirrors the conventions of `/api/og/compare`: `nodejs` runtime,
 * Satori under the hood, plain JSX + inline styles only, generic
 * fallback card when the id can't be resolved so unfurls never break.
 */
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

const AMBER = "#d97706";
const STONE_900 = "#1c1917";
const STONE_500 = "#78716c";
const STONE_400 = "#a8a29e";
const STONE_200 = "#e7e5e4";
const STONE_50 = "#fafaf9";

// Reference: average adult silhouette at 170 cm. Drawn next to the
// speaker bar so a quick glance gives the size in human terms.
const REFERENCE_HEIGHT_MM = 1700;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  const speaker = id ? getSpeakerById(id) : undefined;

  if (!speaker) {
    return new ImageResponse(<GenericCard />, { width: WIDTH, height: HEIGHT });
  }

  return new ImageResponse(<SpeakerCard speaker={speaker} />, {
    width: WIDTH,
    height: HEIGHT,
  });
}

function GenericCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: STONE_50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: AMBER,
          letterSpacing: 8,
          fontWeight: 600,
        }}
      >
        TRUESCALE
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          color: STONE_900,
          marginTop: 20,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        HiFi speakers at true scale
      </div>
    </div>
  );
}

function SpeakerCard({
  speaker,
}: {
  speaker: NonNullable<ReturnType<typeof getSpeakerById>>;
}) {
  // Map mm → px so the bar fills ~430 px of vertical space at the catalog's
  // tallest speaker (the Jubilee at ~1765 mm). Smaller speakers scale down
  // proportionally and stand on the same baseline as the human reference.
  const visualAreaH = 430;
  const maxMm = Math.max(REFERENCE_HEIGHT_MM, speaker.dimensions.heightMm, 1800);
  const px = (mm: number) => (mm / maxMm) * visualAreaH;

  const barH = px(speaker.dimensions.heightMm);
  const barW = Math.max(90, Math.min(180, px(speaker.dimensions.widthMm) * 2));
  const personH = px(REFERENCE_HEIGHT_MM);
  // The body of the silhouette is a fixed slim block — width chosen so the
  // figure reads as "person" against the speaker bar without overpowering.
  const personW = 50;

  const fullModel = speaker.generation
    ? `${speaker.model} ${speaker.generation}`
    : speaker.model;
  const typeLabel: string = {
    bookshelf: "Bookshelf speaker",
    floorstander: "Floorstanding speaker",
    hybrid: "Hybrid speaker",
  }[speaker.type];
  const dims = `${speaker.dimensions.heightMm} × ${speaker.dimensions.widthMm} × ${speaker.dimensions.depthMm} mm`;
  const heightCm = (speaker.dimensions.heightMm / 10).toFixed(1);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: STONE_50,
        display: "flex",
        flexDirection: "column",
        padding: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: AMBER,
          letterSpacing: 6,
          fontWeight: 700,
        }}
      >
        TRUESCALE
      </div>

      {/* Body: text column on the left, visualisation column on the right */}
      <div
        style={{
          flex: 1,
          display: "flex",
          marginTop: 30,
          gap: 60,
        }}
      >
        {/* Text column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: STONE_500,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            {speaker.brand.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              color: STONE_900,
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 14,
            }}
          >
            {fullModel}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: STONE_500,
              marginTop: 24,
            }}
          >
            {typeLabel}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: STONE_500,
              marginTop: 8,
            }}
          >
            {dims}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: STONE_500,
              marginTop: 4,
            }}
          >
            {heightCm} cm tall · vs 170 cm person
          </div>
        </div>

        {/* Visualisation column: human silhouette + speaker bar, both
            standing on a common baseline so the relative height reads
            instantly. Size is scaled to the same px/mm ratio so the
            comparison is faithful, not stylised. */}
        <div
          style={{
            width: 380,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 60,
            borderLeft: `1px solid ${STONE_200}`,
            paddingLeft: 60,
          }}
        >
          {/* Human silhouette — head circle + body block, simple and
              unmistakable at thumbnail size. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: personH,
              width: personW + 30,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                background: STONE_400,
                borderRadius: 999,
                marginBottom: 4,
              }}
            />
            <div
              style={{
                width: personW,
                flex: 1,
                background: STONE_400,
                borderRadius: "16px 16px 4px 4px",
              }}
            />
          </div>

          {/* Speaker bar */}
          <div
            style={{
              width: barW,
              height: barH,
              background: AMBER,
              opacity: 0.85,
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 18,
          borderTop: `1px solid ${STONE_200}`,
          fontSize: 22,
          color: STONE_500,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>truescaleaudio.com</div>
        <div style={{ display: "flex" }}>Compare HiFi speakers at true scale</div>
      </div>
    </div>
  );
}
