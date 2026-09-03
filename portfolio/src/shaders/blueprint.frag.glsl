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
vec2 floorGrid(vec2 xz) {
  // The filter width is widened well past one pixel. At a grazing angle a
  // ground plane compresses many grid cells into a single pixel, and a filter
  // sized for the near field leaves the far field sampling noise — which is the
  // dashed, speckled floor rather than a receding grid.
  vec2 w = fwidth(xz) * 2.2 + 0.002;
  vec2 g = abs(fract(xz) - 0.5);
  vec2 minorLine = smoothstep(w, vec2(0.0), g);
  // Fade the minor grid out entirely once a cell is thinner than its own
  // filter: below that it is not a grid any more, it is noise.
  float minorFade = 1.0 - smoothstep(0.18, 0.5, max(w.x, w.y));
  float minor = max(minorLine.x, minorLine.y) * minorFade;

  vec2 w5 = fwidth(xz / 5.0) * 2.2 + 0.002;
  vec2 g5 = abs(fract(xz / 5.0) - 0.5);
  vec2 majorLine = smoothstep(w5, vec2(0.0), g5);
  float majorFade = 1.0 - smoothstep(0.2, 0.5, max(w5.x, w5.y));
  float major = max(majorLine.x, majorLine.y) * majorFade;

  return vec2(minor, major);
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

    /*
     * Outline, not shading — and specifically not `fwidth(t)`.
     *
     * Ray depth changes fast across ANY tilted surface, not only at its
     * boundary, so a depth-derivative test inks whole faces. That is what
     * filled the frame with grey slabs: the detector was reporting the middle
     * of a plate as an edge because the plate was seen at an angle.
     *
     * A silhouette is where the surface turns away from the ray. That is what
     * `n · rd` measures, and it is true at the boundary and nowhere else.
     */
    float rim = 1.0 - abs(dot(n, rd));
    float silhouette = smoothstep(0.90, 0.998, rim);

    // A crease is a real discontinuity between neighbouring rays' normals.
    float crease = smoothstep(0.7, 1.6, length(fwidth(n)) * 6.0);

    float edge = clamp(max(silhouette, crease), 0.0, 1.0);

    // The ground carries the drawing grid; the plates stay bare.
    float onGround = step(abs(p.y + 1.55), 0.02);
    vec2 rule = floorGrid(p.xz) * onGround;
    float grid = clamp(rule.x * 0.30 + rule.y * 0.85, 0.0, 1.0);

    float amount = clamp(max(edge, grid), 0.0, 1.0);

    // Distance is the only thing that dims a line. No light source exists.
    float haze = 1.0 - smoothstep(6.0, FAR * 0.82, t);
    amount *= haze;

    /*
     * The accent belongs to the datum lines, not to a band at a fixed world
     * position. The previous version painted a hardcoded stripe near x = 5.6,
     * which read as a light leak across the frame rather than as a drawing
     * convention. Here the every-fifth rule is inked differently from the
     * construction grid, which is what a real sheet does.
     */
    float datum = rule.y * (1.0 - rule.x * 0.5);
    vec3 lineColour = mix(uInk, uAccent, clamp(datum * 0.7, 0.0, 0.7));

    col = mix(uPaper, lineColour, amount);
  }

  // Vignette toward the paper, so the space has no visible far edge.
  float v = 1.0 - 0.35 * dot(uv * vec2(0.42, 0.62), uv * vec2(0.42, 0.62));
  col = mix(uPaper, col, clamp(v, 0.0, 1.0));

  // Fade out as the section leaves, so nothing competes with the work grid.
  col = mix(col, uPaper, smoothstep(0.72, 1.0, uScroll));

  fragColor = vec4(col, 1.0);
}
