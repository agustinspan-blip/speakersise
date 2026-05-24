"use client";

import { useState, useMemo, useRef, useEffect, useId } from "react";
import type { Speaker } from "@/lib/types";

/**
 * Progressive three-step speaker selector for the compare form:
 *   1. brand          → visible by default
 *   2. type           → appears once a brand is picked
 *   3. speaker model  → appears once a type is picked
 *
 * Only the final dropdown carries the form `name`, so the URL stays clean
 * (`?a=<id>`). The previous selection (from the URL) hydrates all three
 * dropdowns when the component mounts so users can edit a comparison
 * without losing context.
 *
 * Keyboard support on the speaker listbox:
 *   - ArrowDown / ArrowUp: open and/or move highlight
 *   - Home / End:          jump to first / last option
 *   - Enter / Space:       select the highlighted option
 *   - Escape:              close, return focus to the trigger
 *   - Letter keys:         type-ahead, jumps to the next option whose
 *                          model name starts with the buffered letters
 *                          (buffer resets after 600 ms of inactivity)
 */
export function SpeakerPicker({
  name,
  label,
  pickBrandLabel,
  pickTypeLabel,
  pickSpeakerLabel,
  sideViewLabel,
  typeLabels,
  options,
  selected,
}: {
  name: string;
  label: string;
  pickBrandLabel: string;
  pickTypeLabel: string;
  pickSpeakerLabel: string;
  /**
   * Tooltip / aria text for the small cube glyph that appears next to
   * any speaker whose JSON ships an `images.side` asset. Hints to the
   * user that picking this model will unlock the Profile view in
   * /compare (when paired with another side-view-equipped speaker).
   */
  sideViewLabel: string;
  /**
   * Localised display name per SpeakerType. Receiving the full map (vs
   * one prop per type) keeps the API stable when new types are added —
   * adding "hybrid" alongside bookshelf/floorstander is a one-line
   * change at the caller, not a new prop here.
   */
  typeLabels: Record<Speaker["type"], string>;
  options: Speaker[];
  selected?: string;
}) {
  const initial = selected
    ? options.find((s) => s.id === selected)
    : undefined;

  const [brand, setBrand] = useState<string>(initial?.brand ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "");
  const [speakerId, setSpeakerId] = useState<string>(selected ?? "");
  const [speakerOpen, setSpeakerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const speakerListRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeAheadBuf = useRef<string>("");
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const brands = useMemo(
    () => Array.from(new Set(options.map((s) => s.brand))).sort(),
    [options]
  );

  const typesAvailable = useMemo(() => {
    if (!brand) return [];
    return Array.from(
      new Set(
        options.filter((s) => s.brand === brand).map((s) => s.type)
      )
    );
  }, [options, brand]);

  const speakersAvailable = useMemo(() => {
    if (!brand || !type) return [];
    return options
      .filter((s) => s.brand === brand && s.type === type)
      .sort((a, b) => a.model.localeCompare(b.model));
  }, [options, brand, type]);

  // Opening/closing the listbox is funnelled through these helpers so the
  // highlight reset stays co-located with the user gesture that toggled
  // visibility — keeps effects free of cascading setState calls.
  const openListbox = () => {
    const idx = speakersAvailable.findIndex((s) => s.id === speakerId);
    setActiveIndex(idx >= 0 ? idx : 0);
    setSpeakerOpen(true);
  };
  const closeListbox = () => {
    setSpeakerOpen(false);
    setActiveIndex(-1);
  };

  // Close speaker dropdown on outside-click.
  useEffect(() => {
    if (!speakerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        speakerListRef.current &&
        !speakerListRef.current.contains(e.target as Node)
      ) {
        closeListbox();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [speakerOpen]);

  // Keep the active option visible when arrow-keying past the viewport.
  useEffect(() => {
    if (activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const commitSelection = (id: string) => {
    setSpeakerId(id);
    closeListbox();
    triggerRef.current?.focus();
  };

  const handleTypeAhead = (key: string) => {
    if (typeAheadTimer.current) clearTimeout(typeAheadTimer.current);
    typeAheadBuf.current = (typeAheadBuf.current + key).toLowerCase();
    const buf = typeAheadBuf.current;
    const start = activeIndex >= 0 ? activeIndex : 0;
    const n = speakersAvailable.length;
    // Search from the next item forward, wrapping around. Single-letter
    // repeats (typing "d" twice) advance through matches one at a time;
    // multi-letter buffers anchor at the start.
    const offset = buf.length === 1 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const idx = (start + offset + i) % n;
      if (speakersAvailable[idx].model.toLowerCase().startsWith(buf)) {
        setActiveIndex(idx);
        break;
      }
    }
    typeAheadTimer.current = setTimeout(() => {
      typeAheadBuf.current = "";
    }, 600);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const n = speakersAvailable.length;
    if (n === 0) return;

    // Open the listbox on first navigation gesture, then handle the key
    // again as a movement once the highlight state is ready.
    if (!speakerOpen) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        openListbox();
        return;
      }
      // Letter keys also open + seed the buffer.
      if (e.key.length === 1 && /\S/.test(e.key)) {
        e.preventDefault();
        openListbox();
        handleTypeAhead(e.key);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % n);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + n) % n);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(n - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) commitSelection(speakersAvailable[activeIndex].id);
        break;
      case "Escape":
        e.preventDefault();
        closeListbox();
        triggerRef.current?.focus();
        break;
      case "Tab":
        // Don't trap focus — close and let the browser move on.
        closeListbox();
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          e.preventDefault();
          handleTypeAhead(e.key);
        }
    }
  };

  const selectClass =
    "w-full h-10 px-3 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm";

  return (
    <fieldset className="block space-y-2">
      <legend className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
        {label}
      </legend>

      <select
        aria-label={pickBrandLabel}
        value={brand}
        onChange={(e) => {
          setBrand(e.target.value);
          setType("");
          setSpeakerId("");
        }}
        className={selectClass}
      >
        <option value="">{pickBrandLabel}</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {/*
        Tailwind's `invisible` already removes the element from the
        accessibility tree (visibility:hidden), so we don't add aria-hidden
        — pairing aria-hidden with focusable descendants violates ARIA.
      */}
      <select
        aria-label={pickTypeLabel}
        tabIndex={brand ? 0 : -1}
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setSpeakerId("");
        }}
        className={`${selectClass} ${brand ? "" : "invisible"}`}
      >
        <option value="">{pickTypeLabel}</option>
        {typesAvailable.map((tp) => (
          <option key={tp} value={tp}>
            {typeLabels[tp]}
          </option>
        ))}
      </select>

      {/*
        Custom listbox for the speaker model — replaces a native <select> so
        each option can show a thumbnail of the cabinet alongside the name.
        The form value is carried by a hidden <input> so the surrounding
        <form method="get"> still submits ?<name>=<id> as before.
      */}
      <div
        ref={speakerListRef}
        className={`relative ${brand && type ? "" : "invisible"}`}
      >
        <input type="hidden" name={name} value={speakerId} />
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={speakerOpen}
          aria-controls={listboxId}
          aria-label={pickSpeakerLabel}
          aria-activedescendant={
            speakerOpen && activeIndex >= 0
              ? `${listboxId}-opt-${activeIndex}`
              : undefined
          }
          tabIndex={brand && type ? 0 : -1}
          onClick={() => (speakerOpen ? closeListbox() : openListbox())}
          onKeyDown={onTriggerKeyDown}
          className={`w-full h-10 pl-2 pr-3 rounded-md border bg-white dark:bg-stone-900 text-sm flex items-center gap-2 transition-colors ${
            speakerOpen
              ? "border-stone-500 dark:border-stone-400"
              : "border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600"
          }`}
        >
          {(() => {
            const sel = speakersAvailable.find((s) => s.id === speakerId);
            const thumb = sel
              ? sel.images.hero ?? sel.images.front
              : undefined;
            return (
              <>
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-7 w-7 object-contain shrink-0"
                  />
                )}
                <span
                  className={`flex-1 text-left truncate inline-flex items-center gap-1 ${
                    sel
                      ? "text-stone-900 dark:text-stone-100"
                      : "text-stone-500"
                  }`}
                >
                  <span className="truncate">
                    {sel
                      ? `${sel.model}${sel.generation ? ` ${sel.generation}` : ""}`
                      : pickSpeakerLabel}
                  </span>
                  {sel?.images.side && (
                    <SideViewMark title={sideViewLabel} />
                  )}
                </span>
                <span
                  aria-hidden
                  className={`text-stone-400 transition-transform ${
                    speakerOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </>
            );
          })()}
        </button>

        {speakerOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={pickSpeakerLabel}
            className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl shadow-stone-900/10 max-h-72 overflow-auto py-1"
          >
            {speakersAvailable.map((s, idx) => {
              const isSelected = s.id === speakerId;
              const isActive = idx === activeIndex;
              const thumb = s.images.hero ?? s.images.front;
              return (
                <li
                  key={s.id}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    type="button"
                    tabIndex={-1}
                    onClick={() => commitSelection(s.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 w-full text-left px-2 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                        : isActive
                          ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                          : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-12 w-12 object-contain shrink-0 rounded bg-white dark:bg-stone-950 p-0.5"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0" />
                    )}
                    <span className="truncate inline-flex items-center gap-1">
                      <span className="truncate">
                        {s.model}
                        {s.generation && (
                          <span className="ml-1 text-stone-400 font-normal">
                            {s.generation}
                          </span>
                        )}
                      </span>
                      {s.images.side && (
                        <SideViewMark title={sideViewLabel} />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </fieldset>
  );
}

/**
 * Inline cube glyph used in the picker rows + selected-button to flag
 * speakers that ship an `images.side` asset (i.e. profile-mode capable
 * in /compare). Same Lucide-style "Box" shape as the SideViewBadge that
 * floats on the hero card, just sized for inline text flow instead of
 * an overlay pill. Amber-tinted so the visual matches the rest of the
 * site's affordance palette without competing with the row's hover/
 * selected highlight.
 */
function SideViewMark({ title }: { title: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-amber-600 dark:text-amber-400"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
