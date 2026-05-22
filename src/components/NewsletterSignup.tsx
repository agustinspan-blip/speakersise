"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";
type ServerError =
  | "invalid-email"
  | "rate-limited"
  | "email-not-configured"
  | "send-failed"
  | "invalid-json"
  | "generic";

/**
 * Single-field newsletter signup. Lives inside `<BrandStrip>` so every
 * page that renders the dark footer gets it automatically. Rendered in
 * a light cream band (`bg-stone-100`) that contrasts with the dark
 * footer below — gives the form a clean call-to-action zone without
 * blending into the footer's marquee row.
 */
export function NewsletterSignup({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<ServerError | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setStatus("error");
      setErrorKey("invalid-email");
      return;
    }

    setStatus("submitting");
    setErrorKey(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale, hp }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: ServerError;
      };
      if (res.ok && data.ok) {
        setStatus("success");
        setEmail("");
        setHp("");
        return;
      }
      setStatus("error");
      setErrorKey(data.error ?? "generic");
    } catch {
      setStatus("error");
      setErrorKey("generic");
    }
  }

  const errMsg =
    errorKey === "invalid-email"
      ? t.newsletter.errors.invalidEmail
      : errorKey === "rate-limited"
        ? t.newsletter.errors.rateLimited
        : errorKey === "email-not-configured"
          ? t.newsletter.errors.notConfigured
          : t.newsletter.errors.generic;

  return (
    <div className="border-y border-stone-200 bg-stone-100">
      {/*
        Mobile gets generous vertical padding + a 6-unit gap between the
        text block and the form so the email input doesn't feel pinched
        against the subtitle above it. Desktop layout (two columns) keeps
        its tighter padding since the columns separate visually.
      */}
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-6 lg:py-5 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700 font-medium">
            {t.newsletter.eyebrow}
          </p>
          <h3 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight leading-tight text-stone-900">
            {t.newsletter.title}
          </h3>
          <p className="mt-1.5 text-sm text-stone-600 leading-snug max-w-xl">
            {t.newsletter.subtitle}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-2"
          aria-busy={status === "submitting"}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              {t.newsletter.placeholder}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletter.placeholder}
              autoComplete="email"
              maxLength={200}
              className="flex-1 h-14 sm:h-11 px-5 sm:px-3.5 rounded-md border border-stone-300 bg-white text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="h-14 sm:h-11 px-5 inline-flex items-center justify-center rounded-md bg-amber-600 hover:bg-amber-700 text-white text-base sm:text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === "submitting"
                ? t.newsletter.submitting
                : t.newsletter.submit}
            </button>
          </div>

          {/* Honeypot — visually hidden, off-tab. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="newsletter-hp">Leave this field empty</label>
            <input
              id="newsletter-hp"
              name="hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>

          <p
            role="status"
            aria-live="polite"
            className={`text-xs leading-snug min-h-[1.1rem] ${
              status === "success"
                ? "text-emerald-700"
                : status === "error"
                  ? "text-red-700"
                  : "text-stone-500"
            }`}
          >
            {status === "success" && t.newsletter.success}
            {status === "error" && errMsg}
            {status !== "success" &&
              status !== "error" &&
              t.newsletter.privacyHint}
          </p>
        </form>
      </div>
    </div>
  );
}
