/**
 * Single source of truth for the deployed origin. Read by:
 *   - `app/layout.tsx` for `metadataBase` (resolves relative OG image URLs)
 *   - `app/sitemap.ts` for the absolute URLs in /sitemap.xml
 *   - `app/robots.ts` for the `Sitemap:` and `Host:` directives
 *
 * Set `NEXT_PUBLIC_SITE_URL` in the deployment platform (e.g. Vercel
 * project settings → Environment Variables) to the canonical site URL,
 * with no trailing slash, e.g. `https://truescale.app`. In dev it falls
 * back to localhost so previews still work in unfurl debuggers.
 *
 * `NEXT_PUBLIC_*` env vars are inlined at build time and safe for client
 * code, but every consumer here is a server component so the value never
 * ships to the browser bundle.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
