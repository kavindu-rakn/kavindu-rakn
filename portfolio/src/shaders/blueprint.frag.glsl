/*
 * The blueprint space.
 *
 * There is no geometry behind this. The whole image is one full-screen triangle
 * pair and this shader: signed distance fields, sphere-traced, and drawn as ink
 * rather than lit. That is the point — the previous hero spent ~600KB of
 * Three.js on grey plastic slabs whose own SVG fallback read better. Here the
 * surfaces are never shaded at all. They are found, and then their edges are
 * drawn, which is what a drafting pen actually does.
 *
 * Cost is entirely per-pixel, which is why uMaxSteps and the drawing-buffer
 * scale are uniforms rather than constants: a weak device gets a coarser march,
 * not a dropped frame.
 */

uniform vec2 uResolution;
uniform float uTime;
/** 0 at the top of the hero, 1 when it has been scrolled past. */
uniform float uScroll;
/** Cursor in NDC, smoothed on the CPU. Drives parallax only. */
uniform vec2 uPointer;
uniform float uMaxSteps;

uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uAccent;

out vec4 fragColor;

const float FAR = 46.0;
const float SURFACE = 0.0018;

// ── distance fields ────────────────────────────────────────────────────────

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/** Rectangular frame: a box with its middle removed. A drawing's border. */
float sdFrame(vec3 p, vec3 b, float t) {
  float outer = sdBox(p, b);
  float inner = sdBox(p, vec3(b.x - t, b.y - t, b.z + 0.1));
  return max(outer, -inner);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

/*
 * Plates on a limited lattice.
 *
 * Domain repetition with a clamped cell index rather than a bare mod(): an
 * unbounded repeat lies to the ray about how far it may safely travel, and the
 * march punches through surfaces at grazing angles. Clamping keeps the field
 * honest at the edges of the set.
 */
float plates(vec3 p) {
  const vec3 CELL = vec3(4.6, 0.0, 5.4);

  vec3 id = round(p / max(CELL, vec3(1.0)));
  id.x = clamp(id.x, -2.0, 2.0);
  id.y = 0.0;
  id.z = clamp(id.z, -6.0, 1.0);

  vec3 q = p - CELL * id;

  float r = hash21(id.xz);
  // Slow, unsynchronised drift. Nothing here snaps to the scroll position.
  float lift = 0.34 * sin(uTime * 0.21 + r * 6.2831 + id.z * 0.6);
  float thickness = 0.10 + 0.09 * r;

  float plate = sdBox(q - vec3(0.0, lift, 0.0), vec3(1.45, thickness, 0.92));

  // Every third cell carries a frame instead: a title block, floating.
  float frame = sdFrame(q - vec3(0.0, lift + 0.9, 0.0), vec3(1.0, 0.62, 0.04), 0.1);
  float pick = step(0.72, r);

  return mix(plate, min(plate, frame), pick);
}

float sceneSDF(vec3 p) {
  float ground = p.y + 1.55;
  return min(ground, plates(p));
}

/** Gradient of the field, by central differences. */
vec3 normalAt(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0016;
  return normalize(
    e.xyy * sceneSDF(p + e.xyy) + e.yyx * sceneSDF(p + e.yyx) +
    e.yxy * sceneSDF(p + e.yxy) + e.xxx * sceneSDF(p + e.xxx)
  );
}

// ── ink ────────────────────────────────────────────────────────────────────

/*
 * The floor rule. Anti-aliased against the screen-space derivative of the
 * coordinate itself, so the grid fades out as it recedes instead of turning
 * into the moire that a naive fract() grid produces at the horizon.
 */
float floorGrid(vec2 xz) {
  vec2 g = abs(fract(xz) - 0.5);
  vec2 w = fwidth(xz) * 1.1;
  vec2 line = smoothstep(w, vec2(0.0), g);
  float minor = max(line.x, line.y);

  vec2 g5 = abs(fract(xz / 5.0) - 0.5);
  vec2 w5 = fwidth(xz / 5.0) * 1.1;
  vec2 line5 = smoothstep(w5, vec2(0.0), g5);
  float major = max(line5.x, line5.y);

  return clamp(minor * 0.35 + major * 0.75, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

  // Camera. Scroll pushes it forward through the set; the cursor only tilts it.
  vec3 ro = vec3(uPointer.x * 0.55, 0.55 + uPointer.y * 0.22, 7.5 - uScroll * 9.0);
  vec3 ta = vec3(uPointer.x * 0.25, -0.15, ro.z - 6.0);

  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.55 * fwd);

  float t = 0.0;
  float d = FAR;
  bool hit = false;

  for (int i = 0; i < 128; i++) {
    if (float(i) >= uMaxSteps) break;
    vec3 p = ro + rd * t;
    d = sceneSDF(p);
    // 0.85 rather than 1.0: the clamped repetition above is not a strict bound.
    t += d * 0.85;
    if (d < SURFACE * t) { hit = true; break; }
    if (t > FAR) break;
  }

  vec3 col = uPaper;

  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);

    // Edges, from discontinuity rather than from lighting. A depth break is a
    // silhouette; a normal break is a crease. Both are lines a pen would draw.
    float depthEdge = smoothstep(0.012, 0.09, fwidth(t) / max(t, 1.0) * 14.0);
    float creaseEdge = smoothstep(0.35, 1.05, length(fwidth(n)) * 5.0);
    float edge = clamp(max(depthEdge, creaseEdge), 0.0, 1.0);

    // The ground carries the drawing grid; the plates stay bare.
    float onGround = step(abs(p.y + 1.55), 0.02);
    float grid = floorGrid(p.xz) * onGround;

    float amount = clamp(max(edge, grid), 0.0, 1.0);

    // Distance is the only thing that dims a line. No light source exists.
    float haze = 1.0 - smoothstep(6.0, FAR * 0.82, t);
    amount *= haze;

    // A single accent line, far off, so the palette has one warm mark in it.
    float accentBand = smoothstep(0.55, 0.0, abs(p.x - 5.6)) * onGround * haze;
    vec3 lineColour = mix(uInk, uAccent, clamp(accentBand, 0.0, 0.85));

    col = mix(uPaper, lineColour, amount);
  }

  // Vignette toward the paper, so the space has no visible far edge.
  float v = 1.0 - 0.35 * dot(uv * vec2(0.42, 0.62), uv * vec2(0.42, 0.62));
  col = mix(uPaper, col, clamp(v, 0.0, 1.0));

  // Fade out as the section leaves, so nothing competes with the work grid.
  col = mix(col, uPaper, smoothstep(0.72, 1.0, uScroll));

  fragColor = vec4(col, 1.0);
}
