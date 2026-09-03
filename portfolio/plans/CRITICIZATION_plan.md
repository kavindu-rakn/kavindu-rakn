# Portfolio critique and remediation — kavindu-rakn.xyz

## Context

The site is live on Vercel at a custom domain. The user asked for a brutal critique, pushed back
on several findings, added their own, and chose a direction for the three open design decisions.
This document is the merged result and the work plan.

Assessed from: 10 live screenshots (`C:\Users\User\OneDrive\Pictures\Screenshots\portfolio\`),
a full read of `portfolio/src`, `portfolio/scripts`, `portfolio/package.json`, and the user's own
testing on Android and iOS.

**Verdict.** The engineering craft is real. The problems are that the site is about the projects
rather than the person, reads like a newspaper, encodes perishable facts as prose so it decays
untouched, publishes a false claim about its own rigour, and spends its heaviest dependency on an
interaction the author cannot justify.

## Decisions taken

| Decision | Choice |
|---|---|
| 3D hero | **Replace** the schema tree with a **raymarched SDF blueprint space** |
| Reading load | **Add a scan layer**, keep the prose intact |
| Blueprint conceit | **Keep it and give it a real job** |

## Outstanding input needed

- **The résumé file path.** The user has an updated résumé and offered it; it is not yet supplied.
  It gates the skills matrix, the `Now` rewrite and the availability statement (Phase 1).

---

## Root cause behind half the findings: perishable facts encoded as prose

The user's framing, and it is correct:

> "I keep building projects sometimes two-three per week. I revisit my old projects and add
> fixes/improvements/revamps. So I shouldn't have to adjust outdated website content every
> single time I do something."

| Perishable fact | Lives in | Already wrong? |
|---|---|---|
| "Twelve months" | `about.astro:28,16,38`; `index.astro:62` | Yes — 12.5 months as of 2026-09-02 |
| Internship dates under `## Now` | `about.astro:76` prose | Yes — ended August 2026 |
| "No React Native, no Flutter…" | `about.astro:68` prose | Yes — user now builds with RN + Expo |
| Per-project last-touched | nowhere | Should exist, derived |

**Principle to adopt: no fact with an expiry date may be written as prose.** It is computed, or
it is a single constant, or it is not on the site.

## Findings summary

**Tier 1 — costing him the job**

1. **`SiteNotice.astro:33` states something false** — "the deploy gate refuses to pass until every
   one is supplied." Vercel runs `npm run build`, which calls `lint-content.mjs` **without
   `--strict`** (`package.json:10`); the placeholder check is strict-only
   (`lint-content.mjs:178-185`). `check:ship` is manual and no GitHub Actions workflow runs it —
   the only workflow is `snake.yml` for the profile README. `SCREENSHOT_REQUIRED` is a tracked
   token (`lint-content.mjs:83`) rendering as visible text site-wide, so **`check:ship` fails
   right now**. On a site whose brand is "audit me," the one self-referential claim is the one
   that breaks. *(Deploying in this state was still correct — it is how the mobile bugs were
   found. The defect is the sentence.)*
2. **"Twelve months" decays on a clock** and the lint script that bans percentages and LOC figures
   passes it.
3. **`## Now` is past tense; `## What I do not do` is now factually false** and actively narrows
   his candidacy in the wrong direction.
4. **No way to hire him.** No résumé, no contact page, no CTA — only a footer `mailto:` after
   240vh of hero and seven cards. **No skills data structure exists anywhere in the codebase**;
   capabilities appear only as badges scattered across six cards. Availability is a footer row in
   11px mono. Six studies of five `##` sections each, with no summary layer anywhere.
5. **The content schema cannot hold the incoming media.** `figures[].src` is `image()` from
   `astro:assets` and will not take `.mp4`/`.webm`; `[slug].astro:107-119` renders `<Image>` only;
   `MissingAsset` is hardcoded 16:9 so 9:16 mobile recordings have nowhere correct to go. Luna has
   one figure where every other study has two. This must be built **before** the assets land.

**Tier 2 — design against content**

6. The 3D hero: SVG fallback renders better than the Three.js version (screenshot 1 vs 2–4); 290ms
   TBT against a 200ms bar; `SYSTEMS/PRODUCT/CRAFT` appear nowhere else and do nothing; `HOVER A
   NODE` is dead on touch and prints a tagline already visible below; nodes are
   `canvas.click → location.href` (`blueprint-hero.ts:436-442`) with no keyboard, focus ring, or
   middle-click; 240vh before the first project; user-reported glitches on mobile scroll and
   desktop hover.
7. **One typographic note on everything** — 11px uppercase mono at 0.12em does nav, annotations,
   status, badges, sheet numbers, footer, captions, the strip. Eleven instances in one card
   (screenshot 5). No hierarchy left, in the least legible setting available.
8. **Card voids** — `mt-auto` footers in an equal-height grid leave ~150px gaps (Tamarind beside
   TalentHub, screenshot 5; Luna, screenshots 6/9). Reads as a bug.
9. **The "00 / About" card** is an about link cosplaying as a seventh project, duplicating
   `about.astro` verbatim, existing to fill a grid cell (`index.astro:46-50`) — and it breaks the
   moment a seventh study is added, which at 2–3 projects a week is soon.
10. **Wordmark wraps as "Kavindu R" / "anathunga"** on mobile — the glyph span creates a break
    opportunity mid-surname. *(The blackletter R itself stays. It is his mark.)*

**Tier 3 — writing.** Hero thesis is retrofitted (a hotel booking platform does not "make an
invisible mechanism visible"); "ordered by weight, not by date" is defensive; the Astro/Three.js
footer credit serves nobody. The prose itself is strong — TalentHub's write-up and "What I would
do differently" on every study are the site's best assets and must survive.

**Tier 4 — hygiene.** `Placeholder.astro` renders **nowhere** (the machinery the README brags
about is dormant: `liveUrlPlaceholder`/`techStackPlaceholder` appear in zero content files;
`talenthubStack` is `null` and uncatchable). Stale comments contradict the code (`consts.ts:24`,
`Layout.astro:48-50`). ~40 comments cite `BRIEF §n`/`CONTEXT-FOR-CLAUDE-CODE.md`, absent from the
repo. 19 of 22 palette tokens unused. Five copies of the link CSS, five of the display-h1 string,
four of the palette. 14 committed OG artifacts regenerate every build; `SiteFooter.astro:17`
stamps `new Date()` into every page. No tests, no ESLint, no Prettier.

**Tier 5 — a11y/meta.** Focus outline killed on the only text input
(`InheritanceDiagram.astro:283-286`); `role="img"` wrapping `role="button"` children; `outline` on
SVG `<rect>` unreliable in WebKit; 11px links with no padding (touch targets under 24×24);
`role="status"` on a static strip; `aria-current="page"` on Work on non-`/#work` pages; `sameAs`
omits the now-real LinkedIn; no `og:image:width`/`height`; `lang="en"` vs `og:locale=en_GB`.

**Genuinely good, and to be preserved.** Zod `superRefine` turning editorial rules into build
errors. `lint-content.mjs` as a concept. Refusing to invent a LinkedIn URL or link a private repo.
The TalentHub write-up. The capability gate + `teardown()` + RAF-pause architecture. Static output,
zero JS on 7 of 9 pages.

---

# Work plan

Ordered by what gets him hired, not by what is most fun. **Phase 3 is the exciting one and it is
deliberately not first.**

## Phase 0 — Stop the site arguing against him (small, do first)

- **`SiteNotice.astro`** — rewrite the claim so it is true, or drop the sentence. Also replace
  `role="status"` (a live region that never updates) with a plain `<aside>`.
- **`.github/workflows/site.yml`** (new) — `npm ci && npm run check:ship` on push and PR. This is
  what makes the gate real. Point Vercel's build command at `check:ship` too, once imagery lands.
- **`consts.ts`** — add `FIRST_COMMIT = '2025-08-17'`. Derive the elapsed figure at build time and
  render it inside `<time datetime="…">`.
- **Runtime self-correction** — ~10 lines of inline script recomputing the elapsed figure on load
  and rewriting it if stale. Crawlers and no-JS get correct-at-deploy; humans always get truth.
- **Vercel Deploy Hook + Cron**, monthly. The site refreshes itself with no commit. *(This is the
  direct answer to "do I have to push a commit?" — no.)*
- **`lint-content.mjs`** — new rule rejecting hardcoded durations in rendered HTML.
- **`about.astro`** — delete `## What I do not do` outright. Replace the `## Now` prose list with
  a `CURRENT` const in `consts.ts`.

## Phase 1 — Make him hireable (blocked on the résumé file)

- **`src/data/skills.ts`** (new) — grouped capabilities with context, sourced from the résumé.
  There is currently no skills structure of any kind in the codebase.
- **Skills matrix** rendered on `/about`, plus a compact band on `/` above the work grid.
- **`public/` résumé PDF**, linked from `SiteHeader`, `/about`, and the footer.
- **Contact block** after the work grid and at the end of `/about` — email, LinkedIn, GitHub,
  availability. Promote availability out of the 11px footer row.
- **Scan layer:** add a `summary` field to the content schema (one sentence — what it does plus
  the hardest thing solved), rendered above the fold on each case study and reused in
  `ProjectCard`. **No prose is deleted.**
- **`Layout.astro`** — add LinkedIn to `sameAs`; add `og:image:width`/`height`; align `lang` with
  `og:locale`.

## Phase 2 — Media schema, before the recordings land

- **`content.config.ts`** — make `figures[]` a discriminated union:
  `{ kind: 'image' | 'video', viewport: 'desktop' | 'mobile', src?, poster?, alt, spec }`.
  Keep the existing `superRefine` discipline: a `video` without a `poster` fails the build, as
  `src` without `alt` already does.
- **`[slug].astro`** — render `<video muted loop playsinline preload="metadata" poster>` for
  `kind: 'video'`; under `prefers-reduced-motion`, render the poster only.
- **`MissingAsset.astro`** — aspect ratio from `viewport` (16:9 / 9:16) instead of hardcoded 16:9.
- **Suppress the Imagery section entirely** when a study has no resolved figures, rather than
  rendering a picture of a missing picture.
- **`luna.md`** — add the second figure spec so it matches every other study; add mobile-recording
  specs across all six.

## Phase 3 — The raymarched blueprint space

Replaces `BlueprintHero` + `blueprint-hero.ts` (644 lines of scene/mesh code).

**Keep unchanged** — this architecture was good: `shouldRender3D()` capability gate,
`IntersectionObserver({rootMargin:'200px'})`, `requestIdleCallback` dynamic import, `teardown()`
on `pagehide`, RAF stopped when hidden, `webglcontextlost` → SVG, and **`BlueprintSVG` as the
fallback** (it already renders better than what it replaces).

**What changes.** No meshes, no scene graph, no lighting. One `PlaneGeometry(2,2)` +
`ShaderMaterial` + `OrthographicCamera`; the entire image is a fragment shader. Three.js survives
only as context/resize/uniform management — every line of the picture is GLSL, which is the
learning goal.

**Shader work** (`src/shaders/blueprint.frag.glsl`, new):
- SDF primitives and boolean/smooth-union operators for the drafting forms
- Sphere-traced march with analytic normals from the gradient
- **Ink rendering, not shading** — edge detection from the distance field, drawn as line weight on
  paper. This is what fixes the grey-plastic-slab problem at the root and keeps the paper palette.
- Infinite receding grid with screen-space-derivative anti-aliasing (the classic moiré problem —
  and good learning)
- Distance fog so forms emerge and dissolve
- Uniforms: scroll progress, cursor, time, resolution, quality tier

**Performance discipline** — raymarching is fragment-bound, and this site already has a
mobile-scroll glitch:
- Render at half resolution into a `WebGLRenderTarget`, upscale on composite
- Cap DPR at 1.5 (not 2) for the raymarched path
- Quality tiers driven by the existing capability gate: max step count and march precision scale
  down on low-end devices
- **Fix the reported mobile-scroll glitch by construction** — the canvas is `position: fixed` and
  fully decoupled from scroll; scroll only writes a uniform. Nothing reads layout during scroll.
- Cut the section from **240vh to ~100vh**

**Accessibility** — this actually simplifies. Canvas stays `aria-hidden`; **delete the
canvas-click navigation entirely** (`blueprint-hero.ts:436-442`), since it was a keyboard-
inaccessible pseudo-link and the real links already exist in the grid below. The section becomes
honestly atmospheric.

## Phase 4 — Give the blueprint conceit its job, then clean up

**The conceit, made load-bearing:**
- Sheet numbers become stable identifiers — `order` drives `Sheet NN`, used as anchors and
  referenced in prose, not decoration.
- Figures get plate numbers (`Plate 03-A`) that the case-study text actually cites ("as shown in
  Plate 02"), which is what a real technical document does.
- Hazard hatching stays reserved exclusively for unfilled assets. Keep that discipline.

**Design fixes:**
- Reduce the uppercase-mono treatment to two roles (sheet numbers, status). Tech badges and figure
  captions move to the sans face.
- Fix the card voids — cap grid highlights at 4, or drop `mt-auto`.
- Restyle the About card so it is not a numbered project; source its copy from a shared const.
- **Wordmark:** wrap the R glyph plus "anathunga" in a `white-space: nowrap` span. Verify at
  320/360/390px.
- Cut "ordered by weight, not by date" and the Astro/Three.js footer credit.
- Narrow the hero thesis to the projects it actually describes.

**Hygiene:**
- Remove the dormant placeholder machinery, or wire it to something real; resolve `talenthubStack`.
- Fix the stale comments; delete the `BRIEF`/`CONTEXT` references to documents not in the repo.
- Extract the link recipe and display-h1 into shared classes; extract a `getWork()` helper.
- Gitignore `public/og/*.png`.
- `FOV_DEGREES` duplication disappears with `blueprint-hero.ts`.

**Accessibility:**
- Restore the focus outline on the `InheritanceDiagram` input.
- Resolve the `role="img"` / `role="button"` conflict; replace SVG `outline` with a rendered focus
  rect.
- Pad nav and annotation links to a 24×24 minimum target.
- Fix `aria-current` on case-study pages.

---

## Verification

- `cd portfolio && npm run check:ship` exits 0 once imagery lands. It **fails today** — that is
  the baseline to beat.
- The new GitHub Actions workflow goes green on a PR.
- `npm run build && npm run preview`; walk `/`, `/about`, `/work/<each>`, `/404` at 320, 375, 768
  and 1440px in both colour schemes. **The wordmark must never break mid-surname.**
- Elapsed-time figure correct in built HTML, and self-corrects with JS disabled then enabled.
- Keyboard-only pass: skip link → footer on `/` and `/work/schemashift`, visible focus throughout.
- **Phase 3 specifically:** Lighthouse on `/` before and after — target TBT under 200ms (currently
  290ms). Scroll `/` on a real Android and iOS device and confirm the reported glitch is gone.
  Confirm the SVG fallback renders under `prefers-reduced-motion` and with WebGL2 disabled.
- Confirm `https://www.kavindu-rakn.xyz` redirects to the apex.