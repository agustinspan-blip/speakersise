"use client";

import { useState, useRef, useEffect } from "react";
import type { Dictionary } from "@/lib/i18n";

type Status = "idle" | "copied" | "failed";

export function ShareButton({ t }: { t: Dictionary }) {
  const [status, setStatus] = useState<Status>("idle");
  const [shareUrl, setShareUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-clear "copied" after a short while; "failed" sticks until the
  // user dismisses by clicking elsewhere or trying again.
  useEffect(() => {
    if (status !== "copied") return;
    const id = setTimeout(() => setStatus("idle"), 1600);
    return () => clearTimeout(id);
  }, [status]);

  // When the failure UI mounts, select the URL inside the readonly input
  // so the user can hit Cmd/Ctrl-C immediately.
  useEffect(() => {
    if (status === "failed") inputRef.current?.select();
  }, [status]);

  const onClick = async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    setShareUrl(url);
    try {
      // `navigator.clipboard` may be undefined entirely on insecure
      // contexts (HTTP outside localhost) — guard before calling.
      if (!navigator.clipboard?.writeText) throw new Error("no-clipboard");
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  if (status === "failed") {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={shareUrl}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t.share.failed}
          className="h-9 px-2 w-64 max-w-[60vw] rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs font-mono text-amber-900 dark:text-amber-200"
        />
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      aria-label={t.share.aria}
    >
      {status === "copied" ? t.share.copied : t.share.copyLink}
    </button>
  );
}
