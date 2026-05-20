"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

type ServerError =
  | "invalid-name"
  | "invalid-email"
  | "invalid-subject"
  | "invalid-message"
  | "rate-limited"
  | "email-not-configured"
  | "send-failed"
  | "invalid-json"
  | "generic";

/**
 * Client-side contact form posting to /api/contact. Server-side validation
 * (same regex, same length caps) is the source of truth — these client
 * checks are just for UX so the user gets immediate feedback before
 * hitting the network.
 */
export function ContactForm({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — real users never touch this. The field is positioned
  // off-screen via Tailwind's `sr-only`, so screen readers expose nothing
  // either (which is fine: it's tagged aria-hidden + tabIndex=-1).
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<ServerError | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    // Client-side guard rails — match the server caps so we never POST
    // something we know will be rejected.
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName) return setLocalError("invalid-name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail))
      return setLocalError("invalid-email");
    if (!trimmedMessage || trimmedMessage.length > 5000)
      return setLocalError("invalid-message");

    setStatus("submitting");
    setErrorKey(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: subject.trim() || undefined,
          message: trimmedMessage,
          locale,
          hp,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: ServerError;
      };
      if (res.ok && data.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
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

  function setLocalError(key: ServerError) {
    setStatus("error");
    setErrorKey(key);
  }

  const f = t.contact.fields;
  const errMsg =
    errorKey === "invalid-name"
      ? t.contact.errors.invalidName
      : errorKey === "invalid-email"
        ? t.contact.errors.invalidEmail
        : errorKey === "invalid-message" || errorKey === "invalid-subject"
          ? t.contact.errors.invalidMessage
          : errorKey === "rate-limited"
            ? t.contact.errors.rateLimited
            : errorKey === "email-not-configured"
              ? t.contact.errors.notConfigured
              : t.contact.errors.generic;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5"
      aria-busy={status === "submitting"}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          id="contact-name"
          label={f.nameLabel}
          required
          value={name}
          onChange={setName}
          placeholder={f.namePlaceholder}
          autoComplete="name"
          maxLength={100}
        />
        <Field
          id="contact-email"
          type="email"
          label={f.emailLabel}
          required
          value={email}
          onChange={setEmail}
          placeholder={f.emailPlaceholder}
          autoComplete="email"
          maxLength={200}
        />
      </div>
      <Field
        id="contact-subject"
        label={f.subjectLabel}
        value={subject}
        onChange={setSubject}
        placeholder={f.subjectPlaceholder}
        maxLength={200}
      />
      <TextArea
        id="contact-message"
        label={f.messageLabel}
        required
        value={message}
        onChange={setMessage}
        placeholder={f.messagePlaceholder}
        maxLength={5000}
        rows={6}
      />

      {/* Honeypot — visually hidden, off-tab. Real users never see/fill it. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-hp">Leave this field empty</label>
        <input
          id="contact-hp"
          name="hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-md bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? t.contact.submitting : t.contact.submit}
        </button>

        {/* Live region for status. Single node + role=status lets the
            assistive tech announce success/error without yanking focus. */}
        <p
          role="status"
          aria-live="polite"
          className={`text-sm min-h-[1.25rem] ${
            status === "success"
              ? "text-emerald-700 dark:text-emerald-400"
              : status === "error"
                ? "text-red-700 dark:text-red-400"
                : "text-stone-500"
          }`}
        >
          {status === "success" && t.contact.success}
          {status === "error" && errMsg}
        </p>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  autoComplete,
  maxLength,
}: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
        {label}
        {required && <span className="text-amber-600 ml-1">*</span>}
      </span>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="w-full h-10 px-3 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
      />
    </label>
  );
}

interface TextAreaProps extends Omit<FieldProps, "type" | "autoComplete"> {
  rows?: number;
}

function TextArea({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  maxLength,
  rows = 5,
}: TextAreaProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
        {label}
        {required && <span className="text-amber-600 ml-1">*</span>}
      </span>
      <textarea
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors resize-y"
      />
    </label>
  );
}
