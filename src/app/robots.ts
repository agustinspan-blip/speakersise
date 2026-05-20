import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Robots policy. Next.js 16 exposes the result at `/robots.txt`.
 * Allows all crawlers everywhere, blocks the API namespace (machine-only
 * endpoints like the dynamic OG image — no value indexing them), and
 * points to the sitemap so search engines discover the full URL set
 * without crawling.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
