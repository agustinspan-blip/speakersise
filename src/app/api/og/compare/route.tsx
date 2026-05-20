import { ImageResponse } from "next/og";
import { getSpeakerById } from "@/lib/speakers";

/**
 * Dynamic OG image for /compare links — when someone shares
 *   /en/compare?a=dali-kore&b=monitor-audio-hyphn
 * the chat preview (WhatsApp / Twitter / Slack) renders this 1200×630 PNG
 * showing both speakers' brand + model + key dimensions instead of a generic
 * site card. The OG URL is wired up by `generateMetadata` on the compare page.
 *
 * Implementation: built with `next/og`'s ImageResponse (Satori under the
 * hood). Plain JSX + inline styles only — no Tailwind, no external fonts.
 * Falls back to a clean "TrueScale" card when ids are missing/invalid so
 * unfurls always look intentional.
 */
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

const AMBER = "#d97706";
const STONE_900 = "#1c1917";
const STONE_500 = "#78716c";
const STONE_50 = "#fafaf9";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const aId = url.searchParams.get("a") ?? undefined;
  const bId = url.searchParams.get("b") ?? undefined;
  const a = aId ? getSpeakerById(aId) : undefined;
  const b = bId ? getSpeakerById(bId) : undefined;

  // Generic card when one or both speakers can't be resolved.
  if (!a || !b) {
    return new ImageResponse(<GenericCard />, { width: WIDTH, height: HEIGHT });
  }

  return new ImageResponse(<ComparisonCard a={a} b={b} />, {
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
          fontSize: 80,
          fontWeight: 700,
          color: STONE_900,
          marginTop: 20,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        Compare speakers at true scale
      </div>
    </div>
  );
}

function ComparisonCard({
  a,
  b,
}: {
  a: ReturnType<typeof getSpeakerById>;
  b: ReturnType<typeof getSpeakerById>;
}) {
  if (!a || !b) return <GenericCard />;

  // Compute bar heights so the taller speaker maxes out the visual area
  // and the shorter one scales proportionally — same idea as the on-page
  // comparator, but rendered as solid bars (Satori can't load arbitrary
  // PNGs reliably across deployments).
  const maxH = Math.max(a.dimensions.heightMm, b.dimensions.heightMm);
  const barAreaH = 320;
  const aBarH = (a.dimensions.heightMm / maxH) * barAreaH;
  const bBarH = (b.dimensions.heightMm / maxH) * barAreaH;
  const aBarW = Math.max(80, (a.dimensions.widthMm / 600) * 220);
  const bBarW = Math.max(80, (b.dimensions.widthMm / 600) * 220);

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
      {/* Header: TrueScale wordmark */}
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

      {/* Two speakers side by side, with bar visualisation + label below */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 80,
          marginTop: 40,
        }}
      >
        <SpeakerColumn speaker={a} barW={aBarW} barH={aBarH} colour="#2563eb" />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            paddingBottom: 80,
            fontSize: 56,
            color: STONE_500,
            fontWeight: 300,
          }}
        >
          vs
        </div>
        <SpeakerColumn speaker={b} barW={bBarW} barH={bBarH} colour="#ea580c" />
      </div>

      {/* Footer line */}
      <div
        style={{
          marginTop: 30,
          paddingTop: 20,
          borderTop: `1px solid #e7e5e4`,
          fontSize: 22,
          color: STONE_500,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        Side-by-side at true scale · truescale.app
      </div>
    </div>
  );
}

function SpeakerColumn({
  speaker,
  barW,
  barH,
  colour,
}: {
  speaker: NonNullable<ReturnType<typeof getSpeakerById>>;
  barW: number;
  barH: number;
  colour: string;
}) {
  // Pre-compute display strings: Satori (the JSX-to-PNG renderer behind
  // ImageResponse) refuses to lay out a parent <div> that holds more than
  // one child node unless `display: flex|contents|none` is set explicitly.
  // Collapsing the model + generation into a single string keeps each
  // text node a single child and dodges that constraint.
  const fullModel = speaker.generation
    ? `${speaker.model} ${speaker.generation}`
    : speaker.model;
  const dims = `${speaker.dimensions.heightMm} × ${speaker.dimensions.widthMm} × ${speaker.dimensions.depthMm} mm`;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        flex: 1,
        maxWidth: 380,
      }}
    >
      {/* Bar — silhouette stand-in, height proportional to true height */}
      <div
        style={{
          width: barW,
          height: barH,
          background: colour,
          opacity: 0.85,
          borderRadius: 6,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 18,
          color: STONE_500,
          letterSpacing: 3,
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {speaker.brand.toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: STONE_900,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {fullModel}
      </div>
      <div style={{ display: "flex", fontSize: 20, color: STONE_500 }}>
        {dims}
      </div>
    </div>
  );
}
