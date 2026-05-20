import type { NextConfig } from "next";

/**
 * Security headers applied to every response. These are conservative,
 * compatible with the entire site, and add no runtime cost — Vercel
 * attaches them at the edge.
 *
 *   - X-Content-Type-Options: blocks MIME-sniffing attacks.
 *   - Referrer-Policy: send origin (no path) on cross-origin nav so
 *     outbound clicks to manufacturer pages don't leak query state.
 *   - X-Frame-Options: prevents clickjacking via iframing.
 *   - Permissions-Policy: deny browser APIs we never use.
 *   - Strict-Transport-Security: HSTS, preload-eligible. Only meaningful
 *     in production over HTTPS; harmless on localhost.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
