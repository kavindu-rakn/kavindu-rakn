# Portfolio critique — kavindu-rakn.xyz

## Context

The site is live at a custom domain and the user asked for a brutal critique of the whole
thing: design, content, engineering. Screen recordings and screenshots are known to be
outstanding and are being worked on separately — so "you have no images" is not the finding.
The finding is what the site currently *says about itself* while they are missing, and the
gap between the site's claims of rigour and what an audit of it actually turns up.

Assessed from: 10 live screenshots (`C:\Users\User\OneDrive\Pictures\Screenshots\portfolio\`,
spanning both before and after the LinkedIn fix and build stamp), plus a full read of
`portfolio/src`, `portfolio/scripts`, and `portfolio/package.json`.

Verdict in one line: **a very well-engineered container that is currently arguing against its
own author.** The craft is real. The problems are that the site decays on a timer, publishes a
false claim about its own rigour, buries the only commercially useful facts, and spends its
heaviest asset (Three.js) producing a worse image than its own free fallback.

---

## Tier 1 — Actively costing him the job (fix before anything else)

### 1.1 The build strip states something that is false

`SiteNotice.astro:33-35` — "the deploy gate refuses to pass until every one is supplied."

It does not. Verified:
- Vercel runs `npm run build` → `node scripts/lint-content.mjs` **without `--strict`**
  (`package.json:10`).
- The placeholder check is strict-only (`lint-content.mjs:178-185`); non-strict just
  `console.log`s the outstanding list and exits 0.
- `check:ship` (the actual gate, `package.json:15`) is a manual local command.
- There is **no CI that builds the site at all** — the only workflow is `snake.yml`, which
  renders the profile-README snake.

So the live site is the counterexample to its own sentence. Worse: `SCREENSHOT_REQUIRED` is in
`PLACEHOLDER_TOKENS` (`lint-content.mjs:83`) and renders as literal visible text on every case
study — meaning `npm run check:ship` **fails right now**. The site is deployed in a state its
own tooling classifies as un-shippable, while displaying a banner claiming that cannot happen.

This is the single most damaging thing on the site, because the whole editorial posture is
"every number here is verified, audit me." The one self-referential claim is the one that
breaks.

Fix: either make the claim true (add CI running `check:ship` on PR, block the deploy) or delete
the sentence. Recommend both — make it true, and still soften the strip to one clause.

### 1.2 "Twelve months" is a hardcoded relative date and it is already wrong

Today is 2026-09-02. First commit was 2025-08-17. That is **twelve and a half months**, and
climbing every day.

"Twelve months" is currently: the `<h1>` of `/about` (`about.astro:28`), the heading of the
index aside (`index.astro:62`), and the body of the OG description (`about.astro:16`). The
prose repeats it: "Twelve months later I was the largest contributor…" (`about.astro:38`).

The lint script polices percentages, LOC figures and the word "passionate" — and lets through
the one number on the site that rots on a clock. In three months a visitor reads "twelve
months" under a date that is fifteen months old, and every other verified number on the page
loses its credibility by association.

Fix: derive the elapsed figure from a `FIRST_COMMIT` constant at build time, or restate the
claim in absolute terms that never decay ("Since August 2025"). Add a lint rule for hardcoded
durations.

### 1.3 The `Now` section is in the past tense

`about.astro:76` — "Full-stack Developer Intern, Sri Lanka Telecom Mobitel, January–August
2026" — under a heading that says **Now**. As of today that internship ended last month. The
most time-sensitive block on the site is stale, under the one heading that promises it isn't.

Also unanswered, and it is the first question any recruiter has: *is he available, and when?*
"Open to full-time and freelance" exists only as a footer detail row in 11px mono.

### 1.4 There is no way to hire him

- **No CV/résumé download.** Anywhere. Not linked, not in `public/`.
- **No contact page and no contact CTA.** The only contact affordance on the entire site is a
  `mailto:` in the footer (`SiteFooter.astro:27`) — reached after 240vh of hero plus seven
  cards.
- No phone, no availability date, no "hire me" moment at any point in the scroll.

A recruiter who is convinced by the SchemaShift write-up has nowhere to go. The site
successfully argues the case and then provides no verdict form.

Fix: a résumé PDF linked from the header, a contact block at the end of `/about` and after the
work grid, and availability promoted out of the footer.

### 1.5 Zero product imagery, on a portfolio

Five shipped products and the visitor never sees one of them. 11 hazard-hatched
`MissingAsset` blocks ship instead. On `/work/luna` the first thing below the fold is a
full-bleed red hatched box (screenshot 7).

Understood that recordings are in progress. The point to keep after they land: a case study
whose Imagery section renders a picture of a missing picture is strictly worse than a case
study with no Imagery section. Until the assets exist, suppress the section rather than
advertise the hole.

---

## Tier 2 — The design is working against the content

### 2.1 The 3D hero is a net loss

- **240vh** of scroll (`BlueprintHero`) before the first project. ~2.4 screens of a box
  diagram before the visitor learns anything.
- **The SVG fallback looks better than the Three.js render.** Compare screenshot 1 (crisp line
  drawing, genuinely blueprint-like, on-brand) with screenshots 2–4 (grey plastic slabs with
  drop shadows, muddy fills that fight the paper palette). ~600KB of dependency produces the
  worse image. This is the finding to sit with.
- **The taxonomy is empty.** `ROOT → SYSTEMS / PRODUCT / CRAFT → six names`. Those three
  categories appear nowhere else on the site, are not filters, are not links, and are never
  explained. It is an org chart of nothing, diagramming the grid immediately below it.
- **`HOVER A NODE`** is a hover-only affordance — dead on every touch device. The readout it
  populates ("Luna — Real-time moon phase, orbital position and sky panel") is verbatim the
  tagline already printed in the card below.
- **The nodes are links that are not links.** `blueprint-hero.ts:436-442` does
  `canvas.addEventListener('click') → window.location.href`: no keyboard path, no focus ring,
  no middle-click, no open-in-new-tab, no href in the status bar.
- README's own number: **TBT 290ms** on the landing page. Google's "good" threshold is 200ms.
  The hero measurably degrades the one page every visitor lands on.

Recommend: keep the SVG, ship the 3D as an opt-in or drop it, and cut the section to ~100vh.

### 2.2 One typographic note, played on everything

11px uppercase mono at 0.12em tracking is doing: nav, annotations, status labels, tech badges,
sheet numbers, footer links, figure captions, the build strip, and "hover a node." Screenshot 5
has **eleven** separate pieces of it inside a single card. When every element wears the accent
treatment, there is no hierarchy left — and this setting is also the least legible option
available, applied to the status information that matters most.

Everything is additionally a 2px hard-cornered black rectangle. Cards inside cards inside
rules. No elevation, no radius, no colour beyond one accent blue and one hazard red.

### 2.3 The card grid breaks visibly

`ProjectCard` uses `mt-auto` footers in an equal-height grid, so a card with fewer highlights
gets a void. Screenshot 5: Hotel Tamarind Tree (5 bullets) sits beside TalentHub (8 bullets)
and shows a ~150px gap between its last bullet and its tech badges. Luna (2 bullets, screenshots
6 and 9) has a chasm. It reads as a rendering bug, not as breathing room.

### 2.4 The "00 / About" card is an about link cosplaying as a project

Same border, same header, same numbering scheme, numbered `00` (`index.astro:51-78`). It reads
as a seventh project called "Twelve months." Its copy is duplicated verbatim from `about.astro`
with no shared source, so the two will drift. And `index.astro:46-50` openly admits it exists to
fill the cell the six cards leave empty — layout dictating content, and it breaks the moment a
seventh case study is added (which the README advertises as "writing a file, not editing a
component").

### 2.5 The blackletter R

In the h1, the header brand, and the favicon — the three places a visitor decides whether this
is a professional site. At a glance (screenshot 1) it does not read as a considered wordmark; it
reads as a webfont that failed to load. The `--wordmark-r-*` tuning tokens are documented as
"set by eye," which is honest and is also the tell.

---

## Tier 3 — The writing

Genuinely strong in places. TalentHub's "the feature degrades instead of breaking when the API
is unavailable" is the best sentence on the site, and every case study having a "What I would do
differently" section is rare and persuasive. What undercuts it:

- **The hero thesis is retrofitted.** "Every project below makes an invisible mechanism visible."
  Two of six do (Horologia, Luna). SchemaShift arguably. A hotel booking platform and an
  internship management system do not. The claim is checkable and it is false at the stated scope.
- **The draughtsman conceit is a costume.** "Sheet 01 · Exploded assembly · Schema tree" applied
  to CRUD web apps. Horologia earns it. Nothing else does.
- **"What I do not do"** — an unprompted disqualification list, with its own `<h2>`, on his own
  portfolio. The intent (confidence, honesty) is not what a scanning recruiter takes from a
  heading that announces what he cannot build.
- **"6 sheets · ordered by weight, not by date"** is defensive. It draws attention to the count
  being small and the dates being recent — neither of which the reader had noticed.
- **The footer credit** — "Built with Astro and Three.js · No analytics · No cookies." Nobody
  hiring cares what the portfolio is built with, and it is a privacy flex on a page with nothing
  to protect.

---

## Tier 4 — Engineering hygiene (matters because the site invites the audit)

`about.astro:83` says "the fastest way to judge any of this is to read the code." Taking that
invitation:

- **No CI for the site.** No build, no typecheck, no lint on push or PR. See 1.1.
- **No tests, no ESLint, no Prettier.** Nothing.
- **The placeholder machinery — the thing the README brags about — is dormant.**
  `Placeholder.astro` currently renders **nowhere**. `liveUrlPlaceholder` and
  `techStackPlaceholder` appear in zero content files, so those branches in
  `ProjectCard.astro:96` and `[slug].astro:84` are unreachable, as is `TechStack`'s fallback
  (which is also hardcoded to the TalentHub key inside a generic component,
  `TechStack.astro:34`). `PLACEHOLDERS.talenthubStack.value` is still `null` and *cannot* be
  caught, because the checker only looks for tokens that reach the HTML.
- **Stale comments that contradict the code.** `consts.ts:24` "Default Open Graph image. Does
  not exist yet" — it does. `Layout.astro:48-50` "the LinkedIn profile does not exist yet and
  must not be invented" — it exists and is linked in the footer, and `sameAs` still omits it.
- **~40 comments cite `BRIEF §n` / `CONTEXT §n` / `CONTEXT-FOR-CLAUDE-CODE.md`, which are not in
  the repo.** Every reader hits references to a source of truth they cannot open.
- **Dead tokens:** 19 of 22 palette colours unused. `--color-signal-600`, `PLACEHOLDERS.domain`,
  `SITE.legalName`, `BlueprintSVG`'s `class` prop: zero references.
- **Duplication:** five copies of the underline-link CSS recipe, five copies of the display-h1
  utility string, four copies of the colour palette (`@theme`, `blueprint-hero.ts`,
  `generate-og.mjs`, `favicon.svg`), the `LiveToken` block copy-pasted between two files, and
  four independent `getCollection('work', …)` + sort calls with no shared helper.
- **Every build dirties the tree:** 14 OG artifacts (~370KB) are committed and regenerated on
  every build, and `SiteFooter.astro:17` stamps `new Date()` into every page, so every page's
  HTML changes on every build regardless of content.
- `blueprint-hero.ts` declares `FOV_DEGREES = 38` and then hardcodes `38` in the
  `PerspectiveCamera` constructor (line 132).
- `generate-og.mjs:53-56` sizes text by character count "verified by eye" — a title longer than
  SchemaShift's silently overflows the card.

---

## Tier 5 — Accessibility and metadata

The a11y baseline is above average — skip link, real landmarks, `role="img"` with `<title>`/
`<desc>`, `sr-only` R preserving the accessible name, and a JS capability gate that never even
fetches Three.js under reduced-motion. Which makes these stand out:

- `InheritanceDiagram.astro:283-286` kills the focus outline on the only text input on the site
  (specificity 0,2,0 beats the global `:focus-visible`), replacing it with a border-colour change.
- `role="img"` on the diagram SVG wraps children the script gives `role="button"` — focusable but
  not announced to most AT.
- `outline` on an SVG `<rect>` for `:focus-visible` is not reliably rendered (WebKit).
- Nav and annotation links: 11px, no padding — touch targets far under 24×24.
- `role="status"` on a static build-time strip: a live region that never updates, announced on
  every page load.
- `aria-current="page"` on "Work" on case-study pages, which are not `/#work`.
- Metadata leftovers: `sameAs` omits the now-real LinkedIn; no `og:image:width`/`height`;
  `<html lang="en">` vs `og:locale=en_GB`; no `apple-touch-icon`, no manifest; repo README links
  the `www.` host while `astro.config.mjs` canonicalises to the apex.

---

## What is genuinely good (so the above is calibrated)

- Zod `superRefine` turning editorial rules into build errors — `sourcePrivate && githubUrl`
  fails the build. That is a real idea, well executed, and rare.
- `lint-content.mjs` as a concept: banning LOC figures, percentages and self-description at the
  rendered-HTML level.
- Not inventing a LinkedIn URL, not linking a private repo, saying "internal platform · no public
  repository" out loud.
- The TalentHub write-up, and "What I would do differently" on every study.
- The Three.js capability gate (reduced-motion / cores / memory / WebGL2 → never fetched),
  `teardown()` on `pagehide`, RAF stopped when hidden.
- Static output, zero JS on 7 of 9 pages.

---

## Proposed remediation, in order

**Ship-blockers (do first):**
1. Delete or correct the false sentence in `SiteNotice.astro`, and add a GitHub Actions workflow
   running `npm run check:ship` on push/PR so the claim becomes true.
2. Derive the "twelve months" figure at build time from a `FIRST_COMMIT` constant in
   `consts.ts`; add a lint rule for hardcoded durations.
3. Rewrite the `Now` list in `about.astro` to reflect post-August-2026 status and state
   availability explicitly.
4. Add a résumé PDF to `public/`, link it from `SiteHeader` and `/about`; add a contact block
   after the work grid and at the end of `/about`.
5. Suppress the Imagery section when a study has no resolved figures, instead of rendering
   hazard blocks.

**Design (next):**
6. Cut the hero to ~100vh; make the SVG the default render and the 3D opt-in (or remove it).
   Give the hero nodes real `<a>` elements over the canvas.
7. Give the schema tree's three categories a job (filters, or labels reused in the grid) or
   flatten it.
8. Reduce the uppercase-mono treatment to two roles (sheet numbers + status), and set tech
   badges and figure captions in the sans face.
9. Fix the card-height voids — cap highlights at 4 on the grid, or drop `mt-auto` and let cards
   size naturally.
10. Restyle the About card so it is not a numbered project; source its copy from a shared const.

**Copy:**
11. Narrow the hero thesis to the projects it actually describes.
12. Cut "What I do not do" or fold it into a single sentence.
13. Cut "ordered by weight, not by date" and the Astro/Three.js credit.

**Hygiene:**
14. Remove the dormant placeholder machinery (`liveUrlPlaceholder`, `techStackPlaceholder`,
    unreachable branches) or wire it to something real; resolve `talenthubStack`.
15. Fix the stale comments; delete or vendor the `BRIEF`/`CONTEXT` references.
16. Extract the link recipe and display-h1 into shared classes; extract a `getWork()` helper.
17. Gitignore `public/og/*.png`; generate at build.
18. Fix the a11y items in Tier 5 (focus outline, role conflict, `role="status"`, `aria-current`).
19. Add LinkedIn to `sameAs`; add `og:image:width`/`height`; align `lang`/`og:locale`.

## Verification

- `cd portfolio && npm run check:ship` must exit 0 once imagery lands — that is the real gate,
  and it currently fails.
- `npm run build && npm run preview`, then walk `/`, `/about`, `/work/<each>`, `/404` at 375px,
  768px and 1440px, in both colour schemes.
- Keyboard-only pass: tab from the skip link to the footer on `/` and on `/work/schemashift`,
  confirming every interactive element takes visible focus.
- Lighthouse on `/` before and after the hero change; target TBT under 200ms.
- Confirm `https://www.kavindu-rakn.xyz` redirects to the apex.