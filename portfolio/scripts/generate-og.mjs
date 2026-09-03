/**
 * Generates the Open Graph cards under public/og/ at 1200×630.
 *
 * These are the images link-preview cards show in WhatsApp, LinkedIn, Slack and
 * email. They never appear on the site itself.
 *
 * One card per case study plus a default identity card, so a project link
 * previews with that project's name, sheet index, flagship badge, and tech stack
 * rather than a generic card.
 *
 * The R is read out of src/assets/wordmark-r.svg rather than duplicated here,
 * so the cards, the favicon and the headline all come from a single file.
 *
 *   node scripts/generate-og.mjs
 */

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'public', 'og');
const WORK_DIR = join(ROOT, 'src', 'content', 'work');

const wordmark = readFileSync(join(ROOT, 'src', 'assets', 'wordmark-r.svg'), 'utf8');
const glyph = wordmark.match(/<g[\s\S]*<\/g>/)?.[0];
const glyphViewBox = wordmark.match(/viewBox="([^"]+)"/)?.[1];
if (!glyph || !glyphViewBox) {
  throw new Error('Could not read the R glyph out of src/assets/wordmark-r.svg');
}

/*
 * The card palette, read out of the stylesheet rather than restated here.
 *
 * These values are parsed from global.css to avoid theme drift.
 * The dark values are used deliberately: a dark card stands out in a feed of
 * white preview cards and reads correctly in both light and dark viewer clients.
 */
function readPalette() {
  const css = readFileSync(join(process.cwd(), 'src', 'styles', 'global.css'), 'utf8');

  // Every literal token: --color-name: #hex;
  const literals = new Map();
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    literals.set(m[1], m[2]);
  }

  // The dark block's semantic assignments, which point at those literals.
  const darkBlock = css.match(
    /@media \(prefers-color-scheme: dark\)\s*{\s*:root\s*{([^}]*)}/,
  );
  if (!darkBlock) throw new Error('generate-og: no dark :root block in global.css');

  const semantic = new Map();
  for (const m of darkBlock[1].matchAll(
    /--color-([a-z-]+):\s*var\(--color-([a-z0-9-]+)\)\s*;/g,
  )) {
    const value = literals.get(m[2]);
    if (!value) throw new Error(`generate-og: --color-${m[2]} has no literal value`);
    semantic.set(m[1], value);
  }

  const need = ['ground', 'ground-raised', 'figure', 'figure-muted', 'rule', 'accent'];
  for (const key of need) {
    if (!semantic.has(key)) throw new Error(`generate-og: --color-${key} not resolved`);
  }
  return semantic;
}

const PALETTE = readPalette();
const GROUND = PALETTE.get('ground');
const GROUND_RAISED = PALETTE.get('ground-raised');
const RULE = PALETTE.get('rule');
const FIGURE = PALETTE.get('figure');
const MUTED = PALETTE.get('figure-muted');
const ACCENT = PALETTE.get('accent');

const W = 1200;
const H = 630;
const GRID = 40;
/* Content stays inside the registration marks — some platforms crop the edges. */
const LEFT = 450;
const RIGHT = 1110;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Rough advance-width fit. librsvg gives no text metrics, so the size is
 * estimated from character count and then verified by eye on the output.
 */
function fitSize(text, maxSize, available, ratio = 0.52) {
  const estimated = available / (text.length * ratio);
  return Math.min(maxSize, Math.floor(estimated));
}

const gridLines = [];
for (let x = GRID; x < W; x += GRID) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`);
for (let y = GRID; y < H; y += GRID) gridLines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`);

const SANS = 'Archivo, Segoe UI, Helvetica, Arial, sans-serif';
const MONO = 'IBM Plex Mono, Consolas, monospace';

function card({ eyebrow, title, subtitle, badge, tags = [], footnote }) {
  const titleSize = fitSize(title, 64, RIGHT - LEFT);
  const subtitleSize = subtitle ? fitSize(subtitle, 24, RIGHT - LEFT, 0.48) : 0;

  let tagX = LEFT;
  const tagElements = [];
  for (const tag of tags.slice(0, 4)) {
    const tagW = Math.max(64, Math.floor(tag.length * 8.5 + 24));
    if (tagX + tagW > RIGHT) break;
    tagElements.push(
      `<rect x="${tagX}" y="430" width="${tagW}" height="30" rx="4" fill="${GROUND_RAISED}" stroke="${RULE}" stroke-width="1.25"/>`,
      `<text x="${tagX + tagW / 2}" y="450" fill="${MUTED}" font-family="${MONO}" font-size="12" text-anchor="middle">${esc(tag)}</text>`,
    );
    tagX += tagW + 10;
  }

  const badgeW = 180;
  const badgeEl = badge
    ? `<rect x="${LEFT}" y="148" width="${badgeW}" height="26" rx="4" fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-width="1.25"/>
       <text x="${LEFT + badgeW / 2}" y="165" fill="${ACCENT}" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1.5" text-anchor="middle">${esc(badge)}</text>
       <text x="${LEFT + badgeW + 16}" y="166" fill="${MUTED}" font-family="${MONO}" font-size="13" letter-spacing="2.5">${esc(eyebrow)}</text>`
    : `<text x="${LEFT}" y="166" fill="${ACCENT}" font-family="${MONO}" font-size="14" letter-spacing="3">${esc(eyebrow)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${GROUND}"/>
  <g stroke="${RULE}" stroke-width="1" opacity="0.4">${gridLines.join('')}</g>
  <g stroke="${RULE}" stroke-width="2" fill="none">
    <path d="M40 40 H96 M40 40 V96"/>
    <path d="M1160 40 H1104 M1160 40 V96"/>
    <path d="M40 590 H96 M40 590 V534"/>
    <path d="M1160 590 H1104 M1160 590 V534"/>
  </g>

  <!-- Precision reticle around trademark R -->
  <g stroke="${RULE}" stroke-width="1" fill="none" opacity="0.5">
    <circle cx="230" cy="315" r="145" stroke-dasharray="4 6"/>
    <circle cx="230" cy="315" r="105" stroke-dasharray="2 4"/>
    <line x1="230" y1="140" x2="230" y2="490" stroke-dasharray="2 6"/>
    <line x1="55" y1="315" x2="405" y2="315" stroke-dasharray="2 6"/>
  </g>

  <svg x="100" y="195" width="260" height="240" viewBox="${glyphViewBox}" fill="${FIGURE}">
    ${glyph}
  </svg>

  ${badgeEl}

  <text x="${LEFT}" y="255" fill="${FIGURE}" font-family="${SANS}"
        font-size="${titleSize}" font-weight="800" letter-spacing="-1.2">${esc(title)}</text>

  <line x1="${LEFT}" y1="295" x2="${RIGHT}" y2="295" stroke="${RULE}" stroke-width="1.5"/>

  ${
    subtitle
      ? `<text x="${LEFT}" y="340" fill="${MUTED}" font-family="${SANS}"
        font-size="${subtitleSize}" font-weight="400">${esc(subtitle)}</text>`
      : ''
  }

  <g>${tagElements.join('')}</g>

  <text x="${LEFT}" y="525" fill="${MUTED}" font-family="${MONO}"
        font-size="13" letter-spacing="2">${esc(footnote)}</text>
</svg>`;
}

async function write(name, svg) {
  writeFileSync(join(OUT_DIR, `${name}.svg`), svg, 'utf8');
  // Rasterise at 2x for clean type, then resize to the 1200×630 the spec wants.
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(OUT_DIR, `${name}.png`), png);
  return png.length;
}

/** Frontmatter read — parses title, tagline, order and techStack. */
function frontmatter(file) {
  const raw = readFileSync(join(WORK_DIR, file), 'utf8');
  const block = raw.split('---')[1] ?? '';
  const field = (key) => {
    const m = block.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    if (!m) return null;
    return m[1].trim().replace(/^['"]|['"]$/g, '');
  };
  const listField = (key) => {
    const m = block.match(new RegExp(`^${key}:\\s*\\n((?:\\s*-\\s*.*\\n?)+)`, 'm'));
    if (!m) return [];
    return m[1]
      .split('\n')
      .map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  };
  return {
    title: field('title'),
    tagline: field('tagline'),
    order: Number(field('order')) || 0,
    techStack: listField('techStack'),
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const written = [];

written.push([
  'default',
  await write(
    'default',
    card({
      eyebrow: 'ENGINEERING PORTFOLIO',
      title: 'Kavindu Ranathunga',
      subtitle: 'Product engineer in Colombo · Systems, WebGL & Modern Web',
      tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      footnote: 'SHEET 00 · KAVINDU-RAKN.XYZ',
    }),
  ),
]);

// .mdx as well as .md — a case study that embeds a component is still a case
// study, and filtering on .md alone would silently skip its card.
for (const file of readdirSync(WORK_DIR).filter((f) => /\.mdx?$/.test(f))) {
  const slug = file.replace(/\.mdx?$/, '');
  const { title, tagline, order, techStack } = frontmatter(file);
  if (!title) continue;

  const isFlagship = slug === 'schemashift' || slug === 'talenthub';
  const sheetNum = String(order).padStart(2, '0');

  written.push([
    slug,
    await write(
      slug,
      card({
        badge: isFlagship ? 'FLAGSHIP CASE STUDY' : undefined,
        eyebrow: `SHEET ${sheetNum} · PORTFOLIO`,
        title,
        subtitle: tagline ?? '',
        tags: techStack,
        footnote: 'KAVINDU RANATHUNGA · PRODUCT ENGINEER',
      }),
    ),
  ]);
}

/*
 * Apple touch icon.
 *
 * iOS ignores an SVG favicon: a page saved to the home screen without this falls
 * back to a screenshot of itself. Safari uses it for pinned tabs and bookmarks too.
 *
 * Takes the dark treatment: a white mark on the near-black ground.
 */
const TOUCH = 180;
const TOUCH_INSET = 26;

const touchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TOUCH}" height="${TOUCH}" viewBox="0 0 ${TOUCH} ${TOUCH}">
  <rect width="${TOUCH}" height="${TOUCH}" fill="${GROUND}"/>
  <svg x="${TOUCH_INSET}" y="${TOUCH_INSET}" width="${TOUCH - TOUCH_INSET * 2}" height="${TOUCH - TOUCH_INSET * 2}" viewBox="${glyphViewBox}" fill="${FIGURE}">
    ${glyph}
  </svg>
</svg>`;

const touchBytes = await sharp(Buffer.from(touchSvg))
  .resize(TOUCH, TOUCH, { fit: 'contain' })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(join(ROOT, 'public', 'apple-touch-icon.png'), touchBytes);
console.log(`  apple-touch-icon.png — ${(touchBytes.length / 1024).toFixed(1)} KiB`);

for (const [name, bytes] of written) {
  console.log(`  og/${name}.png — ${(bytes / 1024).toFixed(1)} KiB`);
}
console.log(`${written.length} card(s) written to public/og/`);
