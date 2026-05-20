"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LOGOS, BRAND_INFO } from "@/lib/brands";
import type { Dictionary, Locale } from "@/lib/i18n";

interface Entry {
  name: string;
  status: "live" | "planned";
  flag?: string;
  src: string;
  width: number;
  height: number;
  darkInvert?: boolean;
  tintColor?: string;
}

/**
 * Compact brand search entry-point in the site header. Renders as a single
 * magnifier button; clicking (or pressing `/` anywhere on the page) opens
 * a centred command-palette-style panel with a typeahead input and a
 * keyboard-navigable result list.
 *
 * Live brands navigate to `/[locale]?brand=…`; planned brands route to
 * `/[locale]/brands` since they have no catalog filter to apply.
 */
export function BrandSearch({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Flatten BRAND_LOGOS once. Live brands first, planned second; each
  // group is sorted alphabetically so the result order is stable.
  const entries = useMemo<Entry[]>(() => {
    return Object.entries(BRAND_LOGOS)
      .map(([name, logo]) => ({
        name,
        status: (logo.status ?? "live") as "live" | "planned",
        flag: BRAND_INFO[name]?.countryFlag,
        src: logo.src,
        width: logo.width,
        height: logo.height,
        darkInvert: logo.darkInvert,
        tintColor: logo.tintColor,
      }))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "live" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, query]);

  // Open / close the panel through these helpers instead of calling
  // setOpen directly, so the side effects of state changes (resetting
  // the highlight, clearing the query) stay co-located with the user
  // gesture that caused them — keeps effects free of cascading setState.
  const openPanel = () => {
    setActiveIdx(0);
    setOpen(true);
  };
  const closePanel = () => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  };

  // Focus the input as soon as the panel mounts. Pure DOM side effect,
  // no React state involved.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Global hotkey: `/` opens the panel (unless the user is already
  // typing inside another input/textarea). Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        openPanel();
      } else if (e.key === "Escape" && open) {
        closePanel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function selectEntry(entry: Entry) {
    closePanel();
    if (entry.status === "live") {
      router.push(`/${locale}?brand=${encodeURIComponent(entry.name)}`);
    } else {
      router.push(`/${locale}/brands`);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[activeIdx];
      if (entry) selectEntry(entry);
    }
  }

  // Keep the active row in view as the user arrows past the visible window.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={t.brandSearch.buttonLabel}
        title={`${t.brandSearch.buttonLabel} ( / )`}
        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <SearchIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.brandSearch.buttonLabel}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] bg-stone-950/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-stone-900 border border-stone-700 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-stone-800 px-4 py-3">
              <SearchIcon className="text-stone-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder={t.brandSearch.placeholder}
                className="flex-1 bg-transparent text-stone-100 placeholder:text-stone-500 outline-none text-base"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-block text-[10px] tracking-wide text-stone-500 border border-stone-700 rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">
                {t.brandSearch.empty}
              </p>
            ) : (
              <ul ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                {results.map((entry, i) => (
                  <li key={entry.name}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => selectEntry(entry)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                        i === activeIdx
                          ? "bg-stone-800"
                          : "hover:bg-stone-800/60"
                      }`}
                    >
                      <BrandThumb entry={entry} />
                      <span className="flex-1 min-w-0 truncate text-sm text-stone-100">
                        {entry.name}
                      </span>
                      {entry.flag && (
                        <span aria-hidden className="text-base leading-none">
                          {entry.flag}
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase tracking-[0.15em] font-semibold ${
                          entry.status === "live"
                            ? "text-amber-400"
                            : "text-stone-500"
                        }`}
                      >
                        {entry.status === "live"
                          ? t.brandSearch.live
                          : t.brandSearch.planned}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-stone-800 px-4 py-2 flex items-center justify-between text-[11px] text-stone-500">
              <span>{t.brandSearch.hint}</span>
              <span className="flex items-center gap-2">
                <kbd className="border border-stone-700 rounded px-1.5 py-0.5">↑↓</kbd>
                <kbd className="border border-stone-700 rounded px-1.5 py-0.5">↵</kbd>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BrandThumb({ entry }: { entry: Entry }) {
  // Uniform 32x20 thumb that letterboxes any logo so wide wordmarks
  // and square badges sit in the same bounding box.
  if (entry.tintColor) {
    return (
      <span
        aria-hidden
        className="block h-5 w-8 shrink-0"
        style={{
          backgroundColor: entry.tintColor,
          WebkitMaskImage: `url(${entry.src})`,
          maskImage: `url(${entry.src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.src}
      alt=""
      aria-hidden
      width={entry.width}
      height={entry.height}
      className={`h-5 w-8 shrink-0 object-contain ${
        entry.darkInvert !== false ? "invert" : ""
      }`}
    />
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
