import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Newsletter-signup endpoint. Stores nothing — just forwards each new
 * subscriber to the project mailbox so the maintainer can add them to
 * the real list (Buttondown / Mailchimp / Resend Audiences) manually.
 * When the list grows past a few dozen we'll swap this out for the
 * provider's native API.
 *
 * Reuses the same `RESEND_API_KEY`, `RESEND_TO` and `RESEND_FROM` env
 * vars as /api/contact; missing key returns 503 so the build stays
 * green before the user wires Resend up.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Per-IP rate limit: 3 signups per 5 minutes. Same caveats as the
 * contact endpoint — best-effort only on Vercel's serverless runtime,
 * the honeypot is the real defense.
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

interface SubscribePayload {
  email: string;
  locale?: "en" | "es";
  /** Honeypot — real users never fill this. */
  hp?: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: SubscribePayload;
  try {
    body = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid-json" },
      { status: 400 }
    );
  }

  // Honeypot — silently succeed so the bot doesn't retry.
  if (body.hp && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const locale = body.locale === "es" ? "es" : "en";

  if (!email || !EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json(
      { ok: false, error: "invalid-email" },
      { status: 400 }
    );
  }

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

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `[TrueScale · subscribe] ${email}`,
      text: [
        `New newsletter subscriber: ${email}`,
        `Locale: ${locale}`,
        `IP: ${ip}`,
        ``,
        `(Add to mailing list provider; this endpoint just notifies.)`,
      ].join("\n"),
    });
    if (error) {
      console.error("[subscribe] resend error:", error);
      return NextResponse.json(
        { ok: false, error: "send-failed" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[subscribe] unexpected:", err);
    return NextResponse.json(
      { ok: false, error: "send-failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    { ok: false, error: "method-not-allowed" },
    { status: 405 }
  );
}
