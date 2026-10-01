# kavindu-rakn.xyz

Portfolio v2. Astro 7, Tailwind 4, a raw-WebGL liquid Damascus steel backdrop, Lenis smooth scroll. One static page.

Lighthouse (mobile and desktop, light and dark): 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO, 100 Agentic Browsing.

## Commands

Run from this directory.

| Command | Does |
| :-- | :-- |
| `npm run dev` | Dev server on `localhost:4321` |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run build:fast` | Build only |
| `npm run check` | Type-check only |
| `npm run preview` | Serve `dist/` |

## Editing content

Everything visible comes from [`src/data/portfolioData.ts`](src/data/portfolioData.ts): identity, contact links, the stack matrix and the project ledger. `llms-full.txt` is generated from the same file, so it never drifts.

When a project goes live, give it an `href`: its name becomes the link.

The résumé is deliberately not on the site. The old v1 résumé URL redirects to the Connect section.

## How it stays fast

- **No render-blocking requests.** CSS is inlined; fonts are self-hosted variable WOFF2 with metric-matched fallbacks (no layout shift on swap). Only the two faces painted above the fold are preloaded.
- **The backdrop waits.** The shader ([`src/shaders/`](src/shaders/), driven by [`AmbientCanvas.astro`](src/components/AmbientCanvas.astro)) boots after `load` on an idle callback, compiles off the main thread where `KHR_parallel_shader_compile` exists, and stops when the tab is hidden. Reduced-motion visitors get one still frame. Without WebGL the themed background simply shows.
- **Lenis waits too.** It starts at idle, so its first measurement never forces a reflow during first paint. Native scrolling works until then, and in-page links land under the header via `scroll-padding-top` either way.

## Brand assets

`public/favicon.svg`, `public/apple-touch-icon.png`, `public/og-image.jpg` and the path in `src/components/BlackletterR.astro` were generated from the source artwork in `_planning/` (local only, gitignored): the blackletter R traced to vector curves, and the KAVINDU-RAKN banner letterboxed to a 1200×630 card.

## Deployment

Vercel project `kavindu-rakn`, **Root Directory `portfolio`**: the repository root is the GitHub profile README. Pushing to `main` deploys to production. [`vercel.json`](vercel.json) carries security headers, long-lived caching for hashed assets, and permanent redirects from v1's routes (`/about`, `/work/*`, the old résumé URL).

The snake workflow's `output` branch carries a stub `portfolio/vercel.json` that opts it out of Vercel, so its daily pushes don't show up as failed deployments.

`site` in `astro.config.mjs` drives the canonical URL, Open Graph URLs, JSON-LD and the sitemap.

## Versions

This folder is always the live portfolio. When it is replaced, it moves out of the repository to `Career/portfolio-vN` and the new one takes its place here. v1 lives at `Career/portfolio-v1` with its full history.
