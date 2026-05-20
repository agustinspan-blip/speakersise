"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  locales,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

/**
 * Set the locale preference cookie so the proxy can route future visits
 * to the user's chosen language. Extracted to a module-level helper so
 * the call site inside the component stays a plain function invocation —
 * the `react-hooks/immutability` rule flags `document.cookie = ...`
 * written directly inside a component/hook body even from an event
 * handler.
 */
function persistLocaleCookie(next: Locale) {
  document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageSwitcher({
  locale,
  dict,
  variant = "auto",
}: {
  locale: Locale;
  dict: Dictionary;
  /** "light" = component sits on a dark surface (white text variant). */
  variant?: "auto" | "light";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const newPath = pathname.replace(
      new RegExp(`^/(${locales.join("|")})`),
      `/${next}`
    );
    persistLocaleCookie(next);
    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
  };

  const onLight = variant !== "light";
  const containerBorder = onLight
    ? "border-stone-300 dark:border-stone-700"
    : "border-stone-700";
  const activeClass = onLight
    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
    : "bg-stone-100 text-stone-900";
  const idleClass = onLight
    ? "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
    : "text-stone-400 hover:bg-stone-800";
  return (
    <div
      role="group"
      aria-label={dict.locale.label}
      className={`inline-flex rounded-md border ${containerBorder} overflow-hidden text-xs`}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          className={`px-2.5 py-1 font-medium transition-colors ${
            l === locale ? activeClass : idleClass
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
