# Portfolio critique and remediation — kavindu-rakn.xyz

## Context

The site is live on Vercel at a custom domain. The user asked for a brutal critique of the whole
thing, then pushed back on several findings and added their own. This document merges both.

Assessed from: 10 live screenshots (`C:\Users\User\OneDrive\Pictures\Screenshots\portfolio\`,
spanning before and after the LinkedIn fix and build stamp), a full read of `portfolio/src`,
`portfolio/scripts` and `portfolio/package.json`, and the user's own observations from testing
on Android and iOS.

**Verdict:** the engineering craft is real and mostly good. The problems are that the site is
about the projects rather than the person, reads like a newspaper at a moment when nobody is
reading, encodes perishable facts as prose so it decays untouched, publishes a false claim about
its own rigour, and spends its single heaviest dependency on an interaction the author himself
cannot justify.

---

## The root cause behind half of this: perishable facts encoded as prose

The user's own framing, and it is the correct one:

> "I keep building projects sometimes two-three per week. I revisit my old projects and add
> fixes/improvements/revamps. So I shouldn't have to adjust outdated website content every
> single time I do something."

Every fact with an expiry date currently lives in hand-written prose, where it cannot be
validated, cannot be derived, and cannot self-correct:

| Perishable fact | Where it lives now | Already wrong? |
|---|---|---|
| "Twelve months" | `about.astro:28`, `:16`, `:38`; `index.astro:62` | Yes — 12.5 months as of 2026-09-02 |
| Internship dates under `## Now` | `about.astro:76` prose | Yes — ended August 2026 |
| "No React Native, no Flutter…" | `about.astro:68` prose | Yes — user is now building with RN + Expo |
| Per-project status | frontmatter `status` (good — already data) | No |
| Per-project last-touched | nowhere | n/a — should exist |

The remedy is architectural, not editorial: **no fact with an expiry date may be written as
prose.** It is computed, or it is a single-value constant, or it is not on the site.

---

## Tier 1 — Actively costing him the job

### 1.1 The build strip states something that is false

`SiteNotice.astro:33-35` — "the deploy gate refuses to pass until every one is supplied."

Corrected account of why (the earlier draft overstated this — Vercel *is* a real build pipeline
and does build every push):

- Vercel's build command is `npm run build`, which ends in `node scripts/lint-content.mjs`
  **without `--strict`** (`package.json:10`).
- The placeholder check is strict-only (`lint-content.mjs:178-185`). The non-strict path
  `console.log`s the outstanding list and exits 0.
- `check:ship` — the real gate (`package.json:15`) — is a manual local command, and there is no
  GitHub Actions check that runs it. The only workflow in the repo is `snake.yml`, for the
  profile README.

So nothing blocks a deploy carrying unresolved placeholders, and the live site proves it.
`SCREENSHOT_REQUIRED` is in `PLACEHOLDER_TOKENS` (`lint-content.mjs:83`) and renders as visible
text on every case study, so **`npm run check:ship` fails right now**.

Note in mitigation, from the user: deploying in this state was *useful* — it is how they found
real bugs on Android and iOS. Shipping early was correct. The defect is the sentence, not the
deploy.

Fix: make the claim true (GitHub Actions running `check:ship` on PR, or point Vercel's build
command at it) **and** soften the strip's wording to something that stays true either way.

### 1.2 "Twelve months" decays on a clock, and the fix must not require a commit

Today is 2026-09-02; first commit 2025-08-17. That is 12.5 months and climbing. It appears as
the `<h1>` of `/about`, the index aside heading, the OG description, and in body prose.

`lint-content.mjs` bans percentages, LOC figures and the word "passionate" — and passes the one
number on the site that rots unattended.

**The user asked directly: does deriving it mean pushing a commit to refresh it? No.** Three
layers, all of them:

1. **Build-time derivation** from a `FIRST_COMMIT = '2025-08-17'` constant in `consts.ts`.
   Correct at deploy, drifts afterwards.
2. **Vercel Deploy Hook + Cron**, fired monthly. The site rebuilds itself with no commit and no
   content edit. This is what removes the maintenance burden.
3. **Runtime self-correction.** Ship the build-time value inside a `<time datetime="…">`, plus
   ~10 lines of inline script that recompute on load and rewrite the text if it has gone stale.
   Crawlers and no-JS visitors get a correct-at-deploy figure; humans always get the true one.

Also add a lint rule rejecting hardcoded durations ("twelve months", "N years") in rendered HTML,
so this cannot come back.

### 1.3 `## Now` is in the past tense, and `## What I do not do` is now false

- `about.astro:76` lists "Intern, SLT Mobitel, January–**August 2026**" under a heading that says
  **Now**. That ended last month.
- `about.astro:68` — "No React Native, no Flutter, no Swift, no Kotlin" — the user is **actively
  building with React Native and Expo**. The site is currently disqualifying him from work he
  can do.

The second is the more serious of the two. It is a section written to narrow his own candidacy,
and it is factually wrong in the direction that costs him. Recommend deleting the section
outright rather than correcting it; a portfolio does not need a heading announcing what its
author cannot build.

Neither should have been prose. See the root-cause section.

### 1.4 The site is about the projects, not about the person

The user's own words: *"I sometimes felt like this website is about my projects, not about me and
my skills. And it's like a newspaper because there is way too much to read. No recruiter is
reading all these. Even I am lazy."*

Confirmed structurally, and it is worse than it looks:

- **There is no skills data structure anywhere in the codebase.** No list, no const, no
  collection. Capabilities exist only as `techStack` badges scattered across six separate cards,
  so nobody can answer "what does he know" without reading all six.
- **No résumé, no CV, no contact page, no CTA.** The only contact affordance on the entire site
  is a `mailto:` in the footer (`SiteFooter.astro:27`) — after 240vh of hero and seven cards.
- **Availability** — the single most commercially important fact — is a footer detail row in
  11px mono.
- **Reading load.** Six case studies, each with five `##` sections of dense prose, and no
  summary layer anywhere. Nothing on the site can be consumed in under a minute.

**The user has an updated résumé and has offered it.** That one file plausibly resolves the
missing skills section, the stale `Now` block, and the availability question together — it should
be obtained before this tier is built.

### 1.5 Imagery: the schema cannot hold what is coming

Known and in progress: 11 hazard-hatched `MissingAsset` blocks currently ship. The user's plan
is **two screen recordings per project (Luna included, it currently has only one figure), plus a
mobile-view recording for every project.**

The blocker nobody has hit yet: **the content schema has no video support.**

- `figures[].src` is `image()` from `astro:assets` — it will not accept an `.mp4`/`.webm`.
- `[slug].astro:107-119` renders `<Image>` only.
- `MissingAsset.astro` is hardcoded to a 16:9 slot, so a 9:16 mobile recording has nowhere
  correct to render.

This has to be built *before* the assets land, not after. Needs: a discriminated figure type
(`image` | `video`), a `viewport: 'desktop' | 'mobile'` field driving aspect ratio, `<video>`
with `poster`, `muted`, `loop`, `playsinline`, `preload="metadata"`, and a reduced-motion path
that shows the poster instead of autoplaying.

Separately: while assets are outstanding, suppress the Imagery section rather than rendering a
picture of a missing picture.

---

## Tier 2 — The design works against the content

### 2.1 The 3D hero — the author's own verdict is the harshest one

> "Every time I visit this site, I question this 3D component. Why did I choose a product tree
> to be the 3D component I build with Three.js in my most important website, out of all the cool
> and unique things people build in their portfolios? There is nothing cool/immersive/useful/
> unique about it. It glitches hard on mobile when scrolling, and glitches hard when I hover on
> and off nodes on desktop."

Corroborating evidence:

- **The SVG fallback renders better than the Three.js version.** Screenshot 1 (crisp line
  drawing, genuinely blueprint-like, sits correctly in the paper palette) versus screenshots 2–4
  (grey plastic slabs with drop shadows that fight the design). ~600KB producing the worse image.
- **290ms TBT** on the landing page, per the project's own README. Google's "good" bar is 200ms.
- **The taxonomy is empty.** `ROOT → SYSTEMS / PRODUCT / CRAFT → six names`. Those three
  categories appear nowhere else on the site, are not filters, are not links, are never
  explained. It diagrams the grid directly beneath it.
- **`HOVER A NODE`** is hover-only — dead on touch. The readout prints the tagline already
  visible in the card below.
- **The nodes are links that are not links.** `blueprint-hero.ts:436-442` does
  `canvas.click → window.location.href`: no keyboard path, no focus ring, no middle-click, no
  open-in-new-tab, no href in the status bar.
- **240vh** of scroll before the first project.
- Two reproducible glitches reported by the user (mobile scroll, desktop hover on/off) that
  nobody has diagnosed.

Decision required from the user — cut it, or replace it with something that actually earns
Three.js. Not worth debugging in place.

### 2.2 The draughtsman conceit lost its purpose

User: *"This was not talking about Horologia. It was supposed to do something with the 3D model
and with all the projects as I remember, but somehow it slipped out of scope, which is wrong."*

So "Sheet 01 · Exploded assembly · Schema tree" is currently a costume with no mechanism behind
it. Its fate is tied to 2.1: if the 3D goes, the conceit needs either a real job or removal.

### 2.3 One typographic note played on everything

11px uppercase mono at 0.12em tracking does nav, annotations, status labels, tech badges, sheet
numbers, footer links, figure captions, the build strip, and "hover a node." Screenshot 5 shows
**eleven** instances inside a single card. When everything wears the accent treatment there is no
hierarchy left — and it is simultaneously the least legible setting available, applied to the
status information that matters most.

Everything is additionally a 2px hard-cornered rectangle: cards inside cards inside rules, no
elevation, no radius, one accent blue and one hazard red.

### 2.4 The card grid breaks visibly

`ProjectCard` uses `mt-auto` footers in an equal-height grid, so a card with fewer highlights
gets a void. Screenshot 5: Hotel Tamarind Tree (5 bullets) beside TalentHub (8) shows a ~150px
gap above its badges. Luna (2 bullets, screenshots 6 and 9) has a chasm. It reads as a rendering
bug.

### 2.5 The "00 / About" card is an about link cosplaying as a project

Same border, same header, numbered `00` (`index.astro:51-78`) — it reads as a seventh project
called "Twelve months." Its copy duplicates `about.astro` verbatim with no shared source.
`index.astro:46-50` admits it exists to fill the cell six cards leave empty: layout dictating
content, and it breaks the moment a seventh study is added — which the README advertises as
"writing a file, not editing a component," and which at 2–3 projects a week will happen soon.

### 2.6 The wordmark — keep it, fix the break

The blackletter R is the user's mark and stays. Withdrawing the aesthetic objection entirely.

The real defect, found by the user on mobile: the h1 wraps as **"Kavindu R" / "anathunga"** —
the glyph `<span>` in `Wordmark.astro` creates a break opportunity mid-surname. Fix with a
non-breaking wrapper around the surname (`white-space: nowrap` on a span containing the R plus
"anathunga"), and verify at 320px, 360px and 390px.

---

## Tier 3 — The writing

Genuinely strong in places. TalentHub's "the feature degrades instead of breaking when the API is
unavailable" is the best sentence on the site, and "What I would do differently" on every study
is rare and persuasive. What undercuts it:

- **The hero thesis is retrofitted.** "Every project below makes an invisible mechanism visible."
  Horologia and Luna do; SchemaShift arguably. A hotel booking platform and an internship
  management system do not. A checkable claim, false at the stated scope, on a site whose brand
  is not overstating things.
- **`## What I do not do`** — see 1.3. Delete.
- **"6 sheets · ordered by weight, not by date"** is defensive; it points at the small count and
  the recent dates before the reader had noticed either.
- **The footer credit** — "Built with Astro and Three.js · No analytics · No cookies." Nobody
  hiring cares what the portfolio is built with.
- **Length.** See 1.4. Every study needs a scannable summary layer above the prose.

---

## Tier 4 — Engineering hygiene (the site invites this audit at `about.astro:83`)

- **No repo-level check.** Vercel builds every push, but runs the non-strict linter; no GitHub
  Actions workflow runs `check:ship`. (Corrected from the earlier draft's "no CI at all.")
- **No tests, no ESLint, no Prettier.**
- **The placeholder machinery — the thing the README brags about — is dormant.**
  `Placeholder.astro` renders **nowhere**. `liveUrlPlaceholder` and `techStackPlaceholder` appear
  in zero content files, so those branches (`ProjectCard.astro:96`, `[slug].astro:84`) are
  unreachable, as is `TechStack`'s fallback — which is also hardcoded to the TalentHub key inside
  a generic component (`TechStack.astro:34`). `PLACEHOLDERS.talenthubStack.value` is still `null`
  and cannot be caught, because the checker only looks for tokens that reach the HTML.
- **Stale comments contradicting the code.** `consts.ts:24` "Default Open Graph image. Does not
  exist yet" — it does. `Layout.astro:48-50` "the LinkedIn profile does not exist yet and must
  not be invented" — it exists, is linked in the footer, and `sameAs` still omits it.
- **~40 comments cite `BRIEF §n` / `CONTEXT §n` / `CONTEXT-FOR-CLAUDE-CODE.md`, which are not in
  the repo.** Every reader hits references to a source of truth they cannot open.
- **Dead tokens:** 19 of 22 palette colours unused; `--color-signal-600`, `PLACEHOLDERS.domain`,
  `SITE.legalName`, `BlueprintSVG`'s `class` prop all zero-reference.
- **Duplication:** five copies of the underline-link CSS recipe, five copies of the display-h1
  utility string, four copies of the colour palette (`@theme`, `blueprint-hero.ts`,
  `generate-og.mjs`, `favicon.svg`), the `LiveToken` block copy-pasted across two files, four
  independent `getCollection('work', …)` + sort calls with no shared helper.
- **Every build dirties the tree:** 14 committed OG artifacts (~370KB) regenerate on every build,
  and `SiteFooter.astro:17` stamps `new Date()` into every page.
- `blueprint-hero.ts` declares `FOV_DEGREES = 38` then hardcodes `38` at line 132.
- `generate-og.mjs:53-56` sizes text by character count "verified by eye" — a title longer than
  SchemaShift's silently overflows.

---

## Tier 5 — Accessibility and metadata

Baseline is above average: skip link, real landmarks, `role="img"` with `<title>`/`<desc>`,
`sr-only` R preserving the accessible name, and a capability gate that never fetches Three.js
under reduced motion. Which makes these stand out:

- `InheritanceDiagram.astro:283-286` kills the focus outline on the only text input on the site
  (specificity 0,2,0 beats the global `:focus-visible`).
- `role="img"` on the diagram SVG wraps children the script gives `role="button"` — focusable but
  not announced to most AT.
- `outline` on an SVG `<rect>` for `:focus-visible` is unreliable in WebKit.
- Nav and annotation links: 11px, no padding — touch targets far under 24×24.
- `role="status"` on a static build-time strip: a live region that never updates, announced on
  every page load.
- `aria-current="page"` on "Work" on case-study pages, which are not `/#work`.
- Metadata: `sameAs` omits the now-real LinkedIn; no `og:image:width`/`height`; `<html lang="en">`
  vs `og:locale=en_GB`; no `apple-touch-icon`, no manifest; repo README links the `www.` host
  while `astro.config.mjs` canonicalises to the apex.

---

## What is genuinely good (calibration)

- Zod `superRefine` turning editorial rules into build errors — `sourcePrivate && githubUrl`
  fails the build. A real idea, well executed, and rare.
- `lint-content.mjs` as a concept: banning LOC figures, percentages and self-description at the
  rendered-HTML level.
- Not inventing a LinkedIn URL, not linking a private repo, saying "internal platform · no public
  repository" out loud.
- The TalentHub write-up, and "What I would do differently" on every study.
- The Three.js capability gate, `teardown()` on `pagehide`, RAF stopped when hidden — better
  engineering than the feature it protects deserves.
- Static output, zero JS on 7 of 9 pages.

---

## Open decisions (blocking the build order)

1. **The 3D hero** — cut it, or replace it with something that earns Three.js?
2. **The résumé file** — path needed. Gates the skills section, the `Now` rewrite and availability.
3. **How far to restructure for scannability** — add a summary layer on top of the existing prose,
   or genuinely cut the prose down?

## Verification

- `cd portfolio && npm run check:ship` must exit 0 once imagery lands — the real gate, currently
  failing.
- `npm run build && npm run preview`, then walk `/`, `/about`, `/work/<each>`, `/404` at 320px,
  375px, 768px and 1440px, in both colour schemes. Confirm the wordmark never breaks mid-surname.
- Keyboard-only pass: tab from skip link to footer on `/` and `/work/schemashift`, confirming
  visible focus on every interactive element.
- Lighthouse on `/` before and after the hero decision; target TBT under 200ms.
- Verify the elapsed-time figure is correct in the built HTML *and* self-corrects with JS
  disabled-then-enabled.
- Confirm `https://www.kavindu-rakn.xyz` redirects to the apex.