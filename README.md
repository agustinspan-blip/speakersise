# TrueScale

Visual size-and-spec comparator for HiFi speakers — a clone of carsized.com
applied to bookshelf and floorstanding loudspeakers. Built on Next.js 16
with a fully bilingual ES/EN frontend and a JSON-based catalog.

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The catalog lives in `src/data/speakers/*.json` (one file per speaker) and
is read at build/runtime by `src/lib/speakers.ts`. Brand metadata
(country, theme colour, logo dimensions) lives in `src/lib/brands.ts`.

## Adding speakers and brands

Three prompts under `docs/` codify the workflow for adding new entries:

- `docs/add-speaker-prompt.md` — single speaker, full pipeline (scrape +
  image search + JSON)
- `docs/add-speakers-batch-prompt.md` — full series, agent finds the URLs
  and images itself
- `docs/quick-import-prompt.md` — fastest path: you pre-stage images in
  `data-imports/<Brand>/` and provide the URL list, the agent skips
  discovery and goes straight to specs + JSON + verification with a
  single confirmation gate

Both enforce the data conventions (driver vocabulary, image naming,
`series` without descriptive suffixes, etc.). Pasting either into a fresh
Claude Code session walks the model through scraping, image processing
and JSON generation end-to-end.

When dropping raw assets to import, use `data-imports/` as the staging
folder — `data-imports/README.md` describes the expected shape.

## Environment variables

Copy `.env.example` to `.env.local` and edit if you need to override
defaults. The only configurable variable today is `NEXT_PUBLIC_SITE_URL`,
which is consumed by:

- `app/layout.tsx` — `metadataBase` for resolving OG image URLs
- `app/sitemap.ts` — absolute URLs in `/sitemap.xml`
- `app/robots.ts` — `Sitemap:` and `Host:` directives

## Deploying to Vercel

1. Push the repo to GitHub and import it from the Vercel dashboard.
2. Vercel auto-detects Next.js — no build config needed.
3. **Set `NEXT_PUBLIC_SITE_URL`** in Project Settings → Environment
   Variables, for both **Production** and **Preview** scopes. Use the
   canonical site URL with no trailing slash (e.g. `https://truescale.app`).
   Without this, OG image unfurls fall back to `localhost:3000`.
4. After the first deploy, add the production domain in
   Settings → Domains and submit `https://<domain>/sitemap.xml` to Google
   Search Console.

## Project layout

```
src/
  app/
    [locale]/             # /en/* and /es/* — every user-facing page
      page.tsx              home + brand-filtered catalog
      brands/               brand directory
      compare/              2-way visual comparator
      compare4/             4-way spec comparator
      speaker/[id]/         per-speaker detail
      plan/                 mission page
      support/              donations + roadmap
    api/og/compare/       dynamic OG image for shared compare links
    layout.tsx            root layout, dynamic <html lang>
    sitemap.ts            auto-generated /sitemap.xml
    robots.ts             /robots.txt
  components/             shared UI (SiteHeader, SpeakerPicker, …)
  data/speakers/*.json    catalog source of truth
  lib/                    brands, i18n, metadata, site URL …
  locales/{en,es}.json    UI strings
public/
  brands/                 brand logos
  speakers/               speaker hero + front images (<id>-hero, <id>-front)
docs/                     workflow prompts for adding catalog entries
data-imports/             staging folder for new speaker imports
```

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript strict, no `any`
- Tailwind v4 (CSS-first configuration)
- `next/font` (Geist) for typography
- Server Components everywhere except the `SpeakerPicker` listbox and
  `ShareButton` (both interactive)
