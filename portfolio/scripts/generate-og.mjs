/**
 * Generates the Open Graph cards under public/og/ at 1200×630.
 *
 * These are the images link-preview cards show in WhatsApp, LinkedIn, Slack and
 * email. They never appear on the site itself.
 *
 * One card per case study plus a default identity card, so a project link
 * previews with that project's name rather than a generic one.
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
 * These five values used to be a fourth hand-written copy of the site's colours,
 * and they were still the old cyanotype long after the site itself had gone
 * black and white — so every shared link showed a blue card for a site that is
 * not blue. Parsing the source of truth costs a dozen lines and removes the
 * whole class of drift.
 *
 * The dark values are used deliberately: a dark card stands out in a feed of
 * white preview cards, and reads correctly whether the chat app is light or dark.
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
const RULE = PALETTE.get('rule');
const FIGURE = PALETTE.get('figure');
const MUTED = PALETTE.get('figure-muted');
const ACCENT = PALETTE.get('accent');

const W = 1200;
const H = 630;
const GRID = 40;
/* Content stays inside the registration marks — some platforms crop the edges. */
const LEFT = 452;
const RIGHT = 1104;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Rough advance-width fit. librsvg gives no text metrics, so the size is
 * estimated from character count and then verified by eye on the output.
 */
function fitSize(text, maxSize, available, ratio = 0.53) {
  const estimated = available / (text.length * ratio);
  return Math.min(maxSize, Math.floor(estimated));
}

const gridLines = [];
for (let x = GRID; x < W; x += GRID) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`);
for (let y = GRID; y < H; y += GRID) gridLines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`);

const SANS = 'Archivo, Segoe UI, Helvetica, Arial, sans-serif';
const MONO = 'IBM Plex Mono, Consolas, monospace';

function card({ eyebrow, title, subtitle, footnote }) {
  const titleSize = fitSize(title, 76, RIGHT - LEFT);
  const subtitleSize = subtitle ? fitSize(subtitle, 31, RIGHT - LEFT, 0.5) : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${GROUND}"/>
  <g stroke="${RULE}" stroke-width="1" opacity="0.45">${gridLines.join('')}</g>
  <g stroke="${RULE}" stroke-width="2" fill="none">
    <path d="M40 40 H96 M40 40 V96"/>
    <path d="M1160 40 H1104 M1160 40 V96"/>
    <path d="M40 590 H96 M40 590 V534"/>
    <path d="M1160 590 H1104 M1160 590 V534"/>
  </g>

  <svg x="96" y="184" width="292" height="262" viewBox="${glyphViewBox}" fill="${FIGURE}">
    ${glyph}
  </svg>

  <text x="${LEFT}" y="228" fill="${ACCENT}" font-family="${MONO}"
        font-size="22" letter-spacing="3.4">${esc(eyebrow)}</text>

  <text x="${LEFT}" y="330" fill="${FIGURE}" font-family="${SANS}"
        font-size="${titleSize}" font-weight="800" letter-spacing="-1.4">${esc(title)}</text>

  <line x1="${LEFT}" y1="372" x2="${RIGHT}" y2="372" stroke="${RULE}" stroke-width="2"/>

  ${
    subtitle
      ? `<text x="${LEFT}" y="424" fill="${MUTED}" font-family="${SANS}"
        font-size="${subtitleSize}">${esc(subtitle)}</text>`
      : ''
  }

  <text x="${LEFT}" y="480" fill="${MUTED}" font-family="${MONO}"
        font-size="21" letter-spacing="2.2">${esc(footnote)}</text>
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

/** Minimal frontmatter read — only the two scalar fields the cards need. */
function frontmatter(file) {
  const raw = readFileSync(join(WORK_DIR, file), 'utf8');
  const block = raw.split('---')[1] ?? '';
  const field = (key) => {
    const m = block.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    if (!m) return null;
    return m[1].trim().replace(/^['"]|['"]$/g, '');
  };
  return { title: field('title'), tagline: field('tagline') };
}

mkdirSync(OUT_DIR, { recursive: true });

const written = [];

written.push([
  'default',
  await write(
    'default',
    card({
      eyebrow: 'KAVINDU-RAKN.XYZ',
      title: 'Kavindu Ranathunga',
      subtitle: 'Product Engineer · Colombo, Sri Lanka',
      footnote: 'SHEET 01 · COVER',
    }),
  ),
]);

// .mdx as well as .md — a case study that embeds a component is still a case
// study, and filtering on .md alone would silently skip its card.
for (const file of readdirSync(WORK_DIR).filter((f) => /\.mdx?$/.test(f))) {
  const slug = file.replace(/\.mdx?$/, '');
  const { title, tagline } = frontmatter(file);
  if (!title) continue;
  written.push([
    slug,
    await write(
      slug,
      card({
        eyebrow: 'KAVINDU-RAKN.XYZ',
        title,
        subtitle: tagline ?? '',
        footnote: 'CASE STUDY · KAVINDU RANATHUNGA',
      }),
    ),
  ]);
}

/*
 * Apple touch icon.
 *
 * iOS ignores an SVG favicon: a page saved to the home screen without this falls
 * back to a screenshot of itself, which is both unrecognisable at that size and
 * a picture of whatever happened to be on screen. Safari uses it for pinned tabs
 * and bookmarks too.
 *
 * It cannot follow the colour scheme — the file is chosen once, at save time,
 * and iOS never revisits it. So it takes the dark treatment: a white mark on the
 * near-black ground, which holds against a light or dark wallpaper, where a
 * white tile would glare on one and a black mark would vanish on the other.
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
