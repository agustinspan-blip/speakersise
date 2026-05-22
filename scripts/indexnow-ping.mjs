#!/usr/bin/env node
/**
 * IndexNow ping — notify Bing + Yandex (and any other IndexNow-aware
 * search engine) that the sitemap has changed, so they refresh their
 * crawl queue immediately instead of waiting for the next scheduled
 * sweep.
 *
 * Wired to run via `postbuild` only on Vercel production deploys
 * (skips preview / local / dev). On other targets it no-ops with a
 * single log line so CI doesn't fail when env vars are missing.
 *
 * IndexNow protocol:
 *   - Provider hosts a key file at `https://<host>/<key>.txt` whose
 *     body is the key string. That proves we control the domain.
 *   - We POST JSON to https://api.indexnow.org/indexnow:
 *       { host, key, keyLocation, urlList }
 *     Up to 10 000 URLs per call. We split into chunks of 1 000 to
 *     stay comfortably under the limit and surface partial failures.
 *
 * Inputs:
 *   - NEXT_PUBLIC_SITE_URL  — same env the runtime uses; required.
 *   - VERCEL_ENV (auto)     — only ping when "production".
 *
 * The script swallows network errors so a flaky IndexNow doesn't break
 * the deploy. Successes and failures both print one summary line.
 */

const KEY = "631105e53f02dd1155b8b63497eff30e";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? ""
).replace(/\/+$/, "");
const VERCEL_ENV = process.env.VERCEL_ENV ?? "local";
const CHUNK_SIZE = 1000;

async function main() {
  if (VERCEL_ENV !== "production") {
    console.log(
      `[indexnow] skip (VERCEL_ENV=${VERCEL_ENV}, only production triggers a ping)`
    );
    return;
  }
  if (!SITE_URL) {
    console.log("[indexnow] skip (NEXT_PUBLIC_SITE_URL not set)");
    return;
  }

  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  let xml;
  try {
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
      console.log(
        `[indexnow] skip (sitemap fetch ${res.status} from ${sitemapUrl})`
      );
      return;
    }
    xml = await res.text();
  } catch (err) {
    console.log(`[indexnow] skip (sitemap fetch failed: ${err?.message ?? err})`);
    return;
  }

  // Cheap XML extraction — every <loc>…</loc> in the document. The
  // sitemap also carries hreflang `<xhtml:link>` siblings, but those
  // duplicate URLs that already appear as their own <loc> entries.
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(SITE_URL));

  if (urls.length === 0) {
    console.log("[indexnow] skip (no URLs extracted from sitemap)");
    return;
  }

  const host = new URL(SITE_URL).host;
  const keyLocation = `${SITE_URL}/${KEY}.txt`;

  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const body = JSON.stringify({
      host,
      key: KEY,
      keyLocation,
      urlList: chunk,
    });
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      // Per spec: 200 OK, 202 Accepted are success; 422/400 = invalid;
      // others are transient. We log but never throw.
      if (res.status === 200 || res.status === 202) okCount += chunk.length;
      else {
        failCount += chunk.length;
        console.log(
          `[indexnow] chunk ${i}-${i + chunk.length} returned ${res.status}`
        );
      }
    } catch (err) {
      failCount += chunk.length;
      console.log(`[indexnow] chunk ${i} network error: ${err?.message ?? err}`);
    }
  }

  console.log(
    `[indexnow] sent ${okCount}/${urls.length} URLs (${failCount} failed) to ${host}`
  );
}

main().catch((err) => {
  console.log(`[indexnow] unexpected error: ${err?.message ?? err}`);
});
