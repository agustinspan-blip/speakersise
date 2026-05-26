"use client";

import { useCallback, useEffect, useState } from "react";
import { type UnitSystem, defaultUnitSystem, UNIT_SYSTEMS } from "@/lib/units";

/**
 * Client-side hook that persists the user's metric/imperial choice to
 * localStorage so a flip on, say, /ladder is remembered when the user
 * later visits /compare or /compare4.
 *
 * Priority order:
 *   1. The `initial` value passed in by the page (typically derived
 *      from the URL `?units=imperial` param). A shareable link is
 *      always authoritative — somebody sending you a comparator link
 *      "in imperial" overrides your stored personal preference.
 *   2. localStorage value (the personal preference) — only consulted
 *      if `initial` matches the global default, meaning the URL
 *      didn't force anything.
 *   3. The global default (`"metric"`).
 *
 * The setter writes through to localStorage so subsequent navigations
 * read it back automatically. Also listens for `storage` events so a
 * change in another tab updates this one.
 *
 * SSR-safe: on the very first render the hook returns `initial`. After
 * mount it rehydrates from storage if needed.
 */
const STORAGE_KEY = "truescale.units";

function readStored(): UnitSystem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (UNIT_SYSTEMS as readonly string[]).includes(raw)) {
      return raw as UnitSystem;
    }
  } catch {
    // Private-mode localStorage can throw — fall back to defaults.
  }
  return null;
}

export function useUnits(
  initial: UnitSystem = defaultUnitSystem
): { units: UnitSystem; setUnits: (next: UnitSystem) => void } {
  const [units, setUnitsState] = useState<UnitSystem>(initial);

  // Rehydrate from storage on mount. Skipped when `initial` is non-
  // default — that means the caller (URL param) is being authoritative.
  useEffect(() => {
    if (initial !== defaultUnitSystem) return;
    const stored = readStored();
    if (stored && stored !== units) setUnitsState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      if (
        e.newValue &&
        (UNIT_SYSTEMS as readonly string[]).includes(e.newValue)
      ) {
        setUnitsState(e.newValue as UnitSystem);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setUnits = useCallback((next: UnitSystem) => {
    setUnitsState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Same private-mode concern as above.
    }
  }, []);

  return { units, setUnits };
}
