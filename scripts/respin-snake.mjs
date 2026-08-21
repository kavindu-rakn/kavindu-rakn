#!/usr/bin/env node
/**
 * Re-spins a Platane/snk generated SVG.
 *
 * snk fetches the contribution calendar and lays out the grid, which it does
 * well, but its animation is fixed: constant 4-segment snake, fixed speed, and
 * a progress bar that fills left to right. It exposes no options for any of it.
 *
 * So snk stays the data source. This script reads the grid and the per-cell
 * contribution levels straight back out of the SVG it produced, re-simulates
 * the snake, and rewrites the animation:
 *
 *   - the path is solved with a BFS that treats the snake's own body as a wall,
 *     so the head can never enter it
 *   - the snake grows one segment per GROWTH contributions eaten
 *   - speed is set by STEP (ms per cell)
 *   - the progress bar fills from the centre outwards
 *
 * usage: node scripts/respin-snake.mjs <file.svg> [--out=<file.svg>]
 *                                      [--bar=#000000] [--track=#ebedf0]
 *                                      [--step=150] [--length=4] [--growth=18]
 *
 * --out defaults to overwriting the input. Prefer pointing it elsewhere: snk is
 * a Docker action running as root, so the files it leaves in dist/ are
 * root-owned and a normal runner step cannot write over them. Reading them is
 * fine. Writing to a fresh directory also keeps this re-runnable, since a
 * re-spun SVG no longer carries the cell classes this parses.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("usage: respin-snake.mjs <file.svg> [--bar=#000] [--step=85] ...");
  process.exit(1);
}

const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

// snk moves at ~100ms/cell (measured off its own keyframes: 30 cells in 3001ms).
// 150 is that pace slowed by half again.
const STEP = Number(opt("step", process.env.SNAKE_STEP_MS ?? 150));
const INITIAL = Number(opt("length", process.env.SNAKE_INITIAL_LENGTH ?? 4));
const GROWTH = Number(opt("growth", process.env.SNAKE_GROWTH_INTERVAL ?? 18));
const BAR = opt("bar", "#000000");
const TRACK = opt("track", "#ebedf0");
const OUT = opt("out", file);

const PITCH = 16;
const key = (p) => `${p.c},${p.r}`;

// ── read the grid back out of snk's output ──────────────────────────────────

const src = readFileSync(file, "utf8");

const svgTag = src.match(/<svg[^>]*>/)?.[0];
const rootVars = src.match(/:root\{([^}]*)\}/)?.[1];
const style = src.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if (!svgTag || !rootVars || !style) throw new Error(`${file}: not an snk SVG`);

// ".c.c0{fill:var(--c1)" -> the contribution level that cell was drawn at
const levelOfClass = new Map();
for (const m of style.matchAll(/\.c\.(c[0-9a-zA-Z]+)\{fill:var\(--(c\d)\)/g)) {
  levelOfClass.set(m[1], m[2]);
}

const cells = [];
for (const m of src.matchAll(
  /<rect class="c(?: (c[0-9a-zA-Z]+))?" x="(-?[\d.]+)" y="(-?[\d.]+)"/g,
)) {
  cells.push({ x: +m[2], y: +m[3], level: m[1] ? levelOfClass.get(m[1]) : null });
}
if (!cells.length) throw new Error(`${file}: no grid cells found`);

const minX = Math.min(...cells.map((c) => c.x));
const minY = Math.min(...cells.map((c) => c.y));
for (const cell of cells) {
  cell.c = Math.round((cell.x - minX) / PITCH);
  cell.r = Math.round((cell.y - minY) / PITCH);
}
const cols = Math.max(...cells.map((c) => c.c)) + 1;
const rows = Math.max(...cells.map((c) => c.r)) + 1;

// keep snk's bar geometry so the layout does not shift
const barY = Number(src.match(/class="u u\w+"[^>]*y="([\d.]+)"/)?.[1] ?? minY + rows * PITCH + 34);

// ── simulate ────────────────────────────────────────────────────────────────

const food = new Set(cells.filter((c) => c.level).map(key));
const totalFood = food.size;
const maxLen = INITIAL + Math.floor(totalFood / GROWTH);

/** BFS from `head` to the nearest cell in `targets`, routing around `blocked`. */
function routeTo(head, targets, blocked) {
  const seen = new Set([key(head)]);
  const queue = [{ p: head, prev: null }];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node.prev && targets.has(key(node.p))) {
      const out = [];
      for (let n = node; n.prev; n = n.prev) out.push(n.p);
      return out.reverse();
    }
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const p = { c: node.p.c + dc, r: node.p.r + dr };
      if (p.c < 0 || p.r < 0 || p.c >= cols || p.r >= rows) continue;
      const k = key(p);
      if (seen.has(k) || blocked.has(k)) continue;
      seen.add(k);
      queue.push({ p, prev: node });
    }
  }
  return null;
}

const startRow = Math.floor(rows / 2);
const path = [];
for (let i = maxLen; i >= 1; i--) path.push({ c: -i, r: startRow }); // slide in from off-grid
path.push({ c: 0, r: startRow });

const eatenAt = new Map(); // step -> cell key
const eatenBy = []; // step -> running total
let eaten = 0;

const consume = (step) => {
  const k = key(path[step]);
  if (food.has(k)) {
    food.delete(k);
    eaten++;
    eatenAt.set(step, k);
  }
  eatenBy[step] = eaten;
};
for (let i = 0; i < path.length; i++) consume(i);

const lengthAfter = (n) => INITIAL + Math.floor(n / GROWTH);

/** Body cells that count as wall: everything but the head (start) and the tail (moves off). */
const wall = () => {
  const len = lengthAfter(eaten);
  const body = path.slice(Math.max(0, path.length - len), path.length);
  return new Set(body.slice(1, -1).map(key));
};

let guard = 0;
while (food.size && guard++ < 10000) {
  const leg = routeTo(path[path.length - 1], food, wall());
  if (!leg) break; // boxed in: stop hunting, exit cleanly below
  for (const p of leg) {
    path.push(p);
    consume(path.length - 1);
  }
}
const unreached = food.size;

// exit stage right so the loop restarts cleanly
const rightEdge = new Set();
for (let r = 0; r < rows; r++) rightEdge.add(`${cols - 1},${r}`);
const exitLeg = routeTo(path[path.length - 1], rightEdge, wall());
for (const p of exitLeg ?? []) {
  path.push(p);
  eatenBy[path.length - 1] = eaten;
}
const last = path[path.length - 1];
for (let i = 1; i <= maxLen + 2; i++) {
  path.push({ c: last.c + i, r: last.r });
  eatenBy[path.length - 1] = eaten;
}

// ── verify the snake never enters its own body ──────────────────────────────

let collisions = 0;
for (let t = 0; t < path.length; t++) {
  const len = lengthAfter(eatenBy[t] ?? 0);
  const body = path.slice(Math.max(0, t - len + 1), t);
  if (body.some((p) => p.c === path[t].c && p.r === path[t].r)) collisions++;
}
if (collisions > 0) {
  throw new Error(`${file}: solver produced ${collisions} self-collisions — refusing to write`);
}

// ── render ──────────────────────────────────────────────────────────────────

const steps = path.length - 1;
const duration = Math.round(path.length * STEP);
const pct = (t) => ((t / steps) * 100).toFixed(3).replace(/\.?0+$/, "");

/** Where segment `i` sits at step `t`. Segments not yet grown into ride on the tail. */
const segmentAt = (i, t) => {
  const len = lengthAfter(eatenBy[t] ?? 0);
  return path[Math.max(0, t - Math.min(i, len - 1))];
};

/** Drop points that sit on a straight run — CSS interpolates those exactly. */
function condense(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    const collinear = dx1 * dy2 - dy1 * dx2 === 0;
    const sameWay = Math.sign(dx1) === Math.sign(dx2) && Math.sign(dy1) === Math.sign(dy2);
    if (collinear && sameWay) continue;
    out.push(b);
  }
  out.push(points[points.length - 1]);
  return out;
}

const css = [];
css.push(
  `:root{${rootVars};--cbar:${BAR};--cbt:${TRACK}}`,
  `.c{shape-rendering:geometricPrecision;fill:var(--ce);stroke-width:1px;stroke:var(--cb);` +
    `animation:none ${duration}ms linear infinite;width:12px;height:12px}`,
);

// cells: hold their contribution colour, then snap to empty the moment they are eaten
const cellClass = new Map();
let n = 0;
for (const [step, k] of eatenAt) {
  const cls = `e${(n++).toString(36)}`;
  cellClass.set(k, cls);
  const at = Number(pct(step));
  const after = Math.min(at + 0.02, 100);
  const cell = cells.find((c) => key(c) === k);
  css.push(
    `@keyframes ${cls}{${at}%{fill:var(--${cell.level})}${after}%,100%{fill:var(--ce)}}`,
    `.c.${cls}{fill:var(--${cell.level});animation-name:${cls}}`,
  );
}
// anything the snake could not reach just stays lit
for (const cell of cells) {
  if (cell.level && !cellClass.has(key(cell))) {
    const cls = `e${(n++).toString(36)}`;
    cellClass.set(key(cell), cls);
    css.push(`.c.${cls}{fill:var(--${cell.level})}`);
  }
}

// snake
css.push(
  `.s{shape-rendering:geometricPrecision;fill:var(--cs);animation:none ${duration}ms linear infinite}`,
);
for (let i = 0; i < maxLen; i++) {
  const points = condense(
    Array.from({ length: path.length }, (_, t) => {
      const p = segmentAt(i, t);
      return { t, x: minX + p.c * PITCH, y: minY + p.r * PITCH };
    }),
  );
  const frames = points
    .map((p) => `${pct(p.t)}%{transform:translate(${p.x}px,${p.y}px)}`)
    .join("");
  css.push(`@keyframes s${i}{${frames}}`, `.s.s${i}{animation-name:s${i}}`);
}

// progress bar, filling out from the centre
const barX = minX;
const barW = cols * PITCH - (PITCH - 12);
const barCentre = barX + barW / 2;
const fillFrames = [`0%{transform:scaleX(0)}`];
for (const [step] of eatenAt) {
  const done = eatenBy[step] / totalFood;
  fillFrames.push(`${pct(step)}%{transform:scaleX(${done.toFixed(4)})}`);
}
fillFrames.push(`100%{transform:scaleX(1)}`);
css.push(
  `.ut{fill:var(--cbt)}`,
  `.uf{fill:var(--cbar);transform-origin:${barCentre}px 0;transform:scaleX(0);` +
    `animation:uf ${duration}ms linear infinite}`,
  `@keyframes uf{${fillFrames.join("")}}`,
);

// elements
const body = [];
for (const cell of cells) {
  const cls = cellClass.get(key(cell));
  body.push(`<rect class="c${cls ? ` ${cls}` : ""}" x="${cell.x}" y="${cell.y}" rx="2" ry="2"/>`);
}
body.push(
  `<rect class="ut" x="${barX}" y="${barY}" width="${barW}" height="12"/>`,
  `<rect class="uf" x="${barX}" y="${barY}" width="${barW}" height="12"/>`,
);
for (let i = 0; i < maxLen; i++) {
  const size = maxLen > 1 ? 14.4 - (i / (maxLen - 1)) * 5.4 : 14.4;
  const inset = ((PITCH - size) / 2).toFixed(1);
  const r = (size / 3.2).toFixed(1);
  body.push(
    `<rect class="s s${i}" x="${inset}" y="${inset}" ` +
      `width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${r}" ry="${r}"/>`,
  );
}

const out =
  svgTag +
  `<desc>Generated with https://github.com/Platane/snk, re-spun by scripts/respin-snake.mjs</desc>` +
  `<style>${css.join("")}</style>` +
  body.join("") +
  `</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out);

console.log(
  `${file} -> ${OUT}\n` +
    `  grid           ${cols}x${rows}, ${totalFood} contribution cells\n` +
    `  path           ${path.length} steps, ${duration}ms loop (${STEP}ms/cell)\n` +
    `  snake          ${INITIAL} -> ${maxLen} segments (+1 per ${GROWTH} eaten)\n` +
    `  self-collisions ${collisions}\n` +
    `  unreached      ${unreached}\n` +
    `  bar            ${BAR}, centre-out from ${barCentre}px`,
);
