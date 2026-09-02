# kavindu-rakn.xyz

Portfolio site. Astro 7, Tailwind 4, vanilla Three.js. Static output, no SSR.

Seven of the nine pages ship **zero JavaScript**. Only the landing page loads
any, and only after a capability gate passes.

## Commands

Run from this directory.

| Command | Does |
| :-- | :-- |
| `npm run dev` | Dev server on `localhost:4321` |
| `npm run build` | OG cards → type-check → build → content lint |
| `npm run build:fast` | Build only. For quick iteration |
| `npm run check` | Type-check without building |
| `npm run og` | Regenerate the Open Graph cards |
| `npm run lint:content` | Banned language and numbers |
| `npm run check:ship` | **Pre-deploy gate.** Fails while anything is unfilled |
| `npm run preview` | Serve `dist/` locally |

`npm run build` is deliberately permissive: it reports outstanding placeholders
but does not fail on them, so the site stays deployable while it is being
finished. `npm run check:ship` is the one that refuses.

## The guardrails

This site's argument is *check my work*, so a wrong number is worse than a
missing one. Three mechanisms enforce that, and none of them rely on care.

**1. The content schema** (`src/content.config.ts`) fails the build on:

- a `github.com` link to a repository that is private — it renders a 404 to
  logged-out visitors, which does not read as "private", it reads as fabricated
- any link at all on an employment entry, which has no public repository
- a technology stack that was inferred rather than verified — an entry must
  carry either a real `techStack` or an explicit placeholder token
- an image without alt text

**2. `scripts/lint-content.mjs`** reads the *built HTML* — what actually ships —
and fails on lines-of-code figures, percentages derived from them, and
self-description language. It also asserts a required string: the working-days
module is imported by **five controllers and four services**. An earlier draft
of the CV said "31 controllers". That figure is false, and the linter makes it
impossible to reintroduce or to quietly drop instead of correcting.

**3. Placeholders are loud.** Anything unsupplied renders as a signal-red hazard
block — see `PLACEHOLDERS` in `src/consts.ts`. Signal red is used for nothing
else. `check:ship` refuses to pass while any remain, including Open Graph images
that are referenced but absent from disk.

## Adding a case study

One file in `src/content/work/`. Use `.mdx` only if it embeds a component.

Structure the body: what it is → why it exists → the hard problem → the
decisions → what I would do differently. The last one is the section people
actually read.

## Adding a screenshot

Each figure carries the brief for its own capture, and renders as a hazard block
until the image exists:

```yaml
figures:
  - spec: The impact dialog mid-change, with a destructive row expanded.
    src: ./impact-dialog.png
    alt: Impact dialog showing the values that will not survive.
```

Drop the file beside the markdown. Astro handles WebP conversion and the
responsive `srcset`. `alt` is required when `src` is present.

## Deployment

Vercel, static. **Root Directory must be set to `portfolio`** — the repository
root is the GitHub profile README, not this project.

`site` in `astro.config.mjs` drives canonical tags, Open Graph URLs, the sitemap
and `robots.txt`. Change it in that one place.

## Performance

Measured with Lighthouse, mobile, simulated throttling:

| Page | Performance | TBT |
| :-- | :-- | :-- |
| Landing (3D hero) | 94 | 290 ms |
| Case study | 100 | 0 ms |

Accessibility, Best Practices and SEO are 100 on both.

The landing page's blocking time is Three.js parsing and is irreducible — once
`WebGLRenderer` is used, the whole renderer core comes with it. It is confined to
the one page that needs it, behind a gate that never fetches it for
reduced-motion, low-core, low-memory or non-WebGL2 visitors. Those get a static
SVG blueprint, which is a designed state rather than a fallback.

The LCP element is text on every page. That is a constraint, not an accident.
