/**
 * Content guard.
 *
 * The schema in src/content.config.ts makes bad *links* impossible. It cannot
 * see prose. This does — it reads the built HTML, which is what actually ships,
 * and fails the build on the language and numbers the brief rules out.
 *
 * It also reads src/ directly, for the one rule that cannot be checked against
 * output: a hardcoded duration. See DURATION below.
 *
 *   node scripts/lint-content.mjs            banned content only (runs in build)
 *   node scripts/lint-content.mjs --strict   also fails on unfilled placeholders
 *
 * The non-strict pass must always be green. The strict pass is the pre-deploy
 * gate: during development the placeholders are supposed to be there and loud.
 */

import { readFileSync, globSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STRICT = process.argv.includes('--strict');
const DIST = join(process.cwd(), 'dist');

/** Strip comments, script and style blocks, then all tags, leaving body text. */
function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ');
}

/*
 * CONTEXT §3 — NUMBERS THAT MUST NOT APPEAR.
 * "Numbers that describe the product are good. Numbers that describe him
 * typing are not."
 */
const BANNED = [
  {
    rule: 'lines-of-code figure',
    // The specific figures the user rejected, plus the general forms.
    pattern:
      /([+−-]\s*)?\b(36,853|22,892|32,573|84,000|6,386)\b|\blines of code\b|\bLOC\b|\bSLOC\b/gi,
    why: 'Line count is a discredited metric and reads as padding.',
  },
  {
    rule: 'percentage',
    pattern: /\b\d+(\.\d+)?\s?%/g,
    why: 'Raw counts only — "207 of 652", never a derived percentage.',
  },
  {
    rule: 'self-description language',
    pattern: /\b(passionate|hard[\s-]?working|team player|journey)\b/gi,
    why: 'Explicitly rejected. The facts carry it.',
  },
  {
    rule: 'false controller count',
    pattern: /\b31\s+(backend\s+)?controllers\b/gi,
    why: 'False — 33 controllers exist, five import the module, plus four services.',
  },
];

/*
 * A positive assertion, not a prohibition: the corrected phrasing must be
 * present, so the false figure cannot be quietly dropped rather than fixed.
 */
const REQUIRED = [
  {
    rule: 'working-days module consumers',
    pattern: /five controllers and four services/i,
    where: 'index.html',
    why: 'CONTEXT §2 requires the corrected consumer count to be stated explicitly.',
  },
];

/** Tokens that must not survive to production. */
const PLACEHOLDER_TOKENS = [
  'LIVE_URL_SCHEMASHIFT',
  'LIVE_URL_TAMARIND',
  'LINKEDIN_URL',
  'TALENTHUB_STACK',
  'SCREENSHOT_REQUIRED',
  'OG_IMAGE_DEFAULT',
  'SITE_DOMAIN',
];

let pages;
try {
  pages = globSync('**/*.html', { cwd: DIST }).map((p) => join(DIST, p));
} catch {
  pages = [];
}

if (pages.length === 0) {
  console.error('lint:content — no HTML found in dist/. Run `astro build` first.');
  process.exit(1);
}

const failures = [];
const placeholderHits = [];
const missingAssets = [];
const corpus = new Map();

/*
 * Some placeholders have no token in the rendered text — an absent Open Graph
 * image is just a <meta> pointing at a file that is not there. Checking only
 * for token strings would let those ship silently, so referenced assets are
 * resolved against dist as well.
 */
function checkReferencedAssets(html, file) {
  for (const match of html.matchAll(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g,
  )) {
    const url = match[1];
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    if (!existsSync(join(DIST, path))) {
      missingAssets.push({ file, path });
    }
  }
}

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  corpus.set(file, text);
  checkReferencedAssets(html, file);

  for (const { rule, pattern, why } of BANNED) {
    for (const match of text.matchAll(pattern)) {
      const start = Math.max(0, match.index - 50);
      failures.push({
        file,
        rule,
        why,
        found: match[0].trim(),
        context: text.slice(start, match.index + match[0].length + 50).trim(),
      });
    }
  }

  for (const token of PLACEHOLDER_TOKENS) {
    if (text.includes(token)) placeholderHits.push({ file, token });
  }
}

/*
 * Hardcoded durations — checked in SOURCE, not in dist.
 *
 * "Twelve months" was typed by hand in four places and was wrong within a year
 * of being written. It is now derived from FIRST_COMMIT (src/consts.ts), which
 * means the rendered HTML legitimately contains the phrase and this rule cannot
 * run against dist. It runs against the templates instead, where a typed
 * duration is always a latent bug.
 *
 * A duration describing a fixed past milestone is legitimate and must stay put.
 * Mark that line, or the line directly above it, `duration-ok`.
 */
const DURATION =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty[\s-]?(?:one|two|three|four)|\d{1,3})[\s-]+(month|year)s?\b/gi;

const SRC = join(process.cwd(), 'src');
let sources;
try {
  sources = globSync(['**/*.astro', '**/*.md', '**/*.mdx'], { cwd: SRC }).map((p) =>
    join(SRC, p),
  );
} catch {
  sources = [];
}

for (const file of sources) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    // The marker usually sits above the element wrapping the text, not
    // immediately above the text itself, so look back a short window.
    const marked = lines
      .slice(Math.max(0, i - 3), i + 1)
      .some((l) => /duration-ok/.test(l));
    if (marked) return;
    for (const match of line.matchAll(DURATION)) {
      failures.push({
        file: `${file}:${i + 1}`,
        rule: 'hardcoded duration',
        why: 'Derive it from FIRST_COMMIT, or mark the line `duration-ok` if it states a fixed past milestone.',
        found: match[0].trim(),
        context: line.trim(),
      });
    }
  });
}

for (const { rule, pattern, where, why } of REQUIRED) {
  const target = [...corpus].find(([file]) => file.endsWith(where));
  if (!target || !pattern.test(target[1])) {
    failures.push({
      file: where,
      rule: `MISSING — ${rule}`,
      why,
      found: '(absent)',
      context: 'Required phrasing did not appear in the built page.',
    });
  }
}

const rel = (f) => f.replace(process.cwd(), '').replace(/^[\\/]/, '');

if (failures.length > 0) {
  console.error(`\nlint:content — ${failures.length} violation(s)\n`);
  for (const f of failures) {
    console.error(`  ${rel(f.file)}`);
    console.error(`    rule    ${f.rule}`);
    console.error(`    found   ${JSON.stringify(f.found)}`);
    console.error(`    why     ${f.why}`);
    console.error(`    context …${f.context}…\n`);
  }
  process.exit(1);
}

const unfilledTokens = [...new Set(placeholderHits.map((h) => h.token))];
const unresolvedAssets = [...new Set(missingAssets.map((a) => a.path))];
const outstanding = unfilledTokens.length + unresolvedAssets.length;

if (outstanding > 0) {
  if (STRICT) {
    console.error(`\nlint:content --strict — ${outstanding} item(s) unresolved\n`);
    for (const token of unfilledTokens) console.error(`  placeholder  ${token}`);
    for (const path of unresolvedAssets) console.error(`  missing file ${path}`);
    console.error('\nSupply these before deploying. See PLACEHOLDERS in src/consts.ts.\n');
    process.exit(1);
  }
  console.log(`lint:content — clean. ${outstanding} item(s) still outstanding:`);
  for (const token of unfilledTokens) console.log(`  placeholder  ${token}`);
  for (const path of unresolvedAssets) console.log(`  missing file ${path}`);
} else {
  console.log('lint:content — clean. Nothing outstanding.');
}
