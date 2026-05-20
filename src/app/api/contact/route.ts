import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Contact-form endpoint. Posts a JSON payload, validates it server-side, and
 * forwards the message to the project's mailbox via Resend.
 *
 * Required environment variables:
 *   RESEND_API_KEY  — secret. Create one at https://resend.com/api-keys.
 *   RESEND_TO       — destination address (the actual mailbox to deliver to).
 *                     Falls back to truescaleaudio@gmail.com if unset, which
 *                     keeps things working until the domain is in Cloudflare
 *                     Email Routing.
 *   RESEND_FROM     — verified sender, e.g. "TrueScale <hello@truescaleaudio.com>".
 *                     Until the truescaleaudio.com domain is verified inside
 *                     Resend, you can only send from `onboarding@resend.dev`
 *                     and only to the account-owner's email — Resend's
 *                     testing-mode limitation.
 *
 * If any of the three is missing the route returns 503 so the build/runtime
 * keeps working before you've wired up the email — the rest of the site
 * doesn't depend on this endpoint.
 */

/** Max byte length for free-text fields. Prevents Resend abuse and DB-style oversized payloads. */
const MAX_NAME = 100;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

/** Naive but adequate email shape check — server doesn't need to be strict. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Per-IP rate limit: max 3 requests per 5 minutes. In-memory Map — best-effort
 * only: on Vercel's serverless runtime each cold-start instance has its own
 * Map and multiple instances can serve traffic concurrently, so a determined
 * attacker can defeat this. The honeypot field below is the real defense.
 * Replace with Vercel KV / Upstash if abuse becomes real.
 */
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 3;
const rateBuckets = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (bucket.length >= RATE_MAX) {
    rateBuckets.set(ip, bucket);
    return false;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return true;
}

interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Locale of the page submitting the form — included in the email subject. */
  locale?: "en" | "es";
  /**
   * Honeypot field. Real users never fill this (it's hidden in the form);
   * bots that scrape and submit every input will set it, and we drop the
   * request silently.
   */
  hp?: string;
}

export async function POST(request: Request): Promise<Response> {
  // 1. Parse + shape-check the body. Anything malformed is a 400.
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  // 2. Honeypot: pretend success so the bot doesn't retry.
  if (body.hp && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 3. Field validation. Trim first so trailing whitespace doesn't pass a length check it shouldn't.
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  const locale = body.locale === "es" ? "es" : "en";

  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ ok: false, error: "invalid-name" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT) {
    return NextResponse.json({ ok: false, error: "invalid-subject" }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json({ ok: false, error: "invalid-message" }, { status: 400 });
  }

  // 4. Rate limit by client IP. Vercel populates x-forwarded-for; in local dev
  //    that header is missing so we fall back to a constant key (single bucket).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate-limited" },
      { status: 429 }
    );
  }

  // 5. Resolve env. Missing-key path returns 503 so the build keeps green
  //    until the user finishes the Resend setup.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO ?? "truescaleaudio@gmail.com";
  const from =
    process.env.RESEND_FROM ?? "TrueScale <onboarding@resend.dev>";
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "email-not-configured" },
      { status: 503 }
    );
  }

  // 6. Send. Wrap the SDK call so unexpected errors surface as a 502 — the
  //    user gets a clean error code and we still log the cause server-side.
  const resend = new Resend(apiKey);
  const fullSubject = `[TrueScale · ${locale}] ${
    subject || `Mensaje de ${name}`
  }`;

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: fullSubject,
      text: [
        `From: ${name} <${email}>`,
        `Locale: ${locale}`,
        ``,
        message,
      ].join("\n"),
    });
    if (error) {
      console.error("[contact] resend error:", error);
      return NextResponse.json(
        { ok: false, error: "send-failed" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[contact] unexpected:", err);
    return NextResponse.json(
      { ok: false, error: "send-failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Reject all non-POST methods explicitly so the route doesn't 405 silently. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: false, error: "method-not-allowed" }, { status: 405 });
}
