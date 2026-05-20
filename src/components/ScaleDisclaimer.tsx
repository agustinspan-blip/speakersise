import type { Dictionary } from "@/lib/i18n";

/**
 * Small print shown beneath every TrueScale comparison reminding the user
 * that rendered proportions and inter-model size relationships are
 * best-effort, not certified accurate — the silhouettes depend on the
 * source photography we can find for each speaker.
 */
export function ScaleDisclaimer({ t }: { t: Dictionary }) {
  return (
    <aside
      role="note"
      className="mt-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/40 px-4 py-3 text-xs leading-relaxed text-stone-600 dark:text-stone-400"
    >
      <span className="font-semibold text-stone-700 dark:text-stone-300 mr-1">
        ⓘ
      </span>
      {t.compare.scaleDisclaimer}
    </aside>
  );
}
