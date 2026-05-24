import Link from "next/link";
import type { UnitSystem } from "@/lib/units";

/**
 * Small two-pill segmented control for switching the comparator's
 * displayed units between metric (mm/kg) and imperial (in/lb).
 *
 * Stateless on purpose: each pill is a plain {@link Link} pointing to
 * the same page with `?units=…` flipped, so navigating preserves all
 * other URL params (a, b, view, person, …) without needing client JS.
 * The hrefs are computed by the caller — that's where the per-page URL
 * builder lives (`compareHref` for /compare, an inline builder for
 * /compare4).
 */
export function UnitsToggle({
  current,
  metricHref,
  imperialHref,
  label,
  metricLabel,
  imperialLabel,
}: {
  current: UnitSystem;
  metricHref: string;
  imperialHref: string;
  /** Visible group label, e.g. "Units". */
  label: string;
  /** Visible label for the metric pill, e.g. "mm / kg". */
  metricLabel: string;
  /** Visible label for the imperial pill, e.g. "in / lb". */
  imperialLabel: string;
}) {
  const pillBase =
    "h-7 px-3 rounded-full text-xs font-medium transition-colors inline-flex items-center";
  const active = "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900";
  const inactive =
    "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100";

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-0.5"
    >
      <Link
        href={metricHref}
        aria-pressed={current === "metric"}
        className={`${pillBase} ${current === "metric" ? active : inactive}`}
        scroll={false}
      >
        {metricLabel}
      </Link>
      <Link
        href={imperialHref}
        aria-pressed={current === "imperial"}
        className={`${pillBase} ${current === "imperial" ? active : inactive}`}
        scroll={false}
      >
        {imperialLabel}
      </Link>
    </div>
  );
}
