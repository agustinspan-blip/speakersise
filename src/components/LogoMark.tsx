/**
 * Truescale brand mark — concentric speaker-driver glyph with the "TSA"
 * initials inside the dome cap.
 *
 * Geometry (viewBox 100×100):
 *   - r=48  → outer basket / flange ring (uses currentColor)
 *   - r=32  → cone outer edge          (uses currentColor)
 *   - r=14  → voice-coil dome cap      (amber accent, holds TSA letters)
 *
 * The basket + cone rings inherit `currentColor` so the mark adapts to its
 * surrounding text colour automatically — light text on dark headers,
 * dark text on cream content.
 */
export function LogoMark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? 24 : size === "lg" ? 56 : 36;

  return (
    <svg
      viewBox="0 0 100 100"
      width={px}
      height={px}
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {/* Outer basket ring */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Cone outer edge */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Voice-coil dome cap — amber */}
      <circle cx="50" cy="50" r="14" fill="#d97706" />
      {/* Brand initials */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="9"
        fill="white"
        letterSpacing="1"
      >
        TSA
      </text>
    </svg>
  );
}
