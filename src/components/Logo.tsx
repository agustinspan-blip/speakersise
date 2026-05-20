import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { LogoMark } from "@/components/LogoMark";

/**
 * Wordmark logo for Truescale. Several visual variants are kept inline so
 * we can A/B them on the `/<locale>/logo-preview` page during the brand
 * exploration phase. Once a variant is chosen, the rest can be removed
 * and `LogoVariant` collapsed to a single style.
 */
export type LogoVariant =
  /** "True" stone + "scale" amber. Same pattern as the previous brand. */
  | "split"
  /** "True" semibold + italic "scale" amber accent. More editorial. */
  | "italic"
  /** All lowercase with an amber dot separator: true·scale */
  | "dot"
  /** All caps, letter-spaced, monochrome: T R U E S C A L E */
  | "caps"
  /** "true" with an amber underscore beneath "scale" — measurement vibe. */
  | "underline";

export const DEFAULT_LOGO_VARIANT: LogoVariant = "italic";

export function Logo({
  locale,
  linkToHome = true,
  size = "md",
  variant = "auto",
  style = DEFAULT_LOGO_VARIANT,
  withMark = false,
}: {
  locale: Locale;
  linkToHome?: boolean;
  size?: "sm" | "md";
  /**
   * "auto"  → dark text on light bg, flipping in system dark mode (default)
   * "light" → always light text (use on dark headers/footers)
   * "dark"  → always dark text
   */
  variant?: "auto" | "light" | "dark";
  /** Visual style of the wordmark — see `LogoVariant`. */
  style?: LogoVariant;
  /** Render the brand mark (driver icon) to the left of the wordmark. */
  withMark?: boolean;
}) {
  const sizeClass = size === "sm" ? "text-xl" : "text-2xl";
  const baseColor =
    variant === "light"
      ? "text-stone-100"
      : variant === "dark"
        ? "text-stone-900"
        : "text-stone-900 dark:text-stone-100";
  const accentColor = "text-amber-600 dark:text-amber-400";

  const wordmarkColor =
    variant === "light"
      ? "text-stone-100"
      : variant === "dark"
        ? "text-stone-900"
        : "text-stone-900 dark:text-stone-100";

  const wordmark = (
    <span className={`${sizeClass} font-semibold tracking-tight inline-flex items-baseline`}>
      {style === "split" && (
        <>
          <span className={baseColor}>True</span>
          <span className={accentColor}>scale</span>
        </>
      )}

      {style === "italic" && (
        <>
          <span className={baseColor}>True</span>
          <span className={`${accentColor} italic font-normal ml-0.5`}>
            scale
          </span>
        </>
      )}

      {style === "dot" && (
        <span className={`${baseColor} lowercase`}>
          true
          <span className={`${accentColor} mx-[0.15em]`}>·</span>
          scale
        </span>
      )}

      {style === "caps" && (
        <span
          className={`${baseColor} uppercase font-medium`}
          style={{ letterSpacing: "0.18em" }}
        >
          Truescale
        </span>
      )}

      {style === "underline" && (
        <>
          <span className={`${baseColor} lowercase`}>true</span>
          <span
            className={`${accentColor} lowercase`}
            style={{
              borderBottom: "0.1em solid currentColor",
              paddingBottom: "0.02em",
            }}
          >
            scale
          </span>
        </>
      )}
    </span>
  );

  // The mark inherits its ring colour from `currentColor`, so we wrap it in
  // the same colour class that drives the wordmark — that way both adapt
  // together to light / dark / auto variants.
  const content = withMark ? (
    <span className={`inline-flex items-center gap-2.5 ${wordmarkColor}`}>
      <LogoMark size="md" />
      {wordmark}
    </span>
  ) : (
    wordmark
  );

  if (!linkToHome) return content;
  return (
    <Link
      href={`/${locale}`}
      className="inline-block hover:opacity-90 transition-opacity"
      aria-label="Truescale home"
    >
      {content}
    </Link>
  );
}
