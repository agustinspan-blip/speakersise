"use client";

import { useRouter } from "next/navigation";

/**
 * Tiny client wrapper around a native `<select>` that navigates to the
 * pre-computed `href` of the chosen option. Each option carries the URL the
 * server already built, so this component only needs to call `router.push`
 * on change — no function props (which can't cross the server→client
 * boundary).
 *
 * Keeping the URL as the source of truth lets the rest of the comparison
 * view stay server-rendered and shareable.
 */
export function ReferenceSelect({
  label,
  currentValue,
  options,
}: {
  label: string;
  currentValue: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
        {label}
      </span>
      <select
        value={currentValue}
        onChange={(e) => {
          const next = options.find((o) => o.value === e.target.value);
          if (next) router.push(next.href);
        }}
        className="h-10 px-3 pr-8 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
