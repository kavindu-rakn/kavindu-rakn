// Liquid Damascus steel.
//
// Two rounds of strong domain warping fold simplex noise into the fine,
// layered lines of pattern-welded steel. Normals come from tight central
// differences, so every fold catches light. The light source is the pointer:
// moving it sweeps glints across the blade. Without a pointer (phones, or
// before the mouse moves) the light drifts on its own.

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uRes;        // drawing-buffer pixels
uniform vec2 uPointer;    // 0..1, y up: ripple origin and parallax
uniform float uPointerOn; // 0..1: fades pointer effects in and out
uniform vec2 uLight;      // 0..1, y up: where the light sits
uniform float uVelocity;  // pointer speed, drives ripple and dispersion
uniform vec2 uGyro;       // -1..1 device tilt
uniform float uTheme;     // 0 dark .. 1 light
uniform float uScroll;    // viewport heights scrolled

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 st = (gl_FragCoord.xy - 0.5 * uRes) / unit;
  vec2 ptr = (uPointer * uRes - 0.5 * uRes) / unit;
  vec2 lightPos = (uLight * uRes - 0.5 * uRes) / unit;

  // Parallax: the pointer, or the phone's tilt when there is one, leans the surface.
  vec2 lean = mix((uPointer - 0.5) * 0.8 * uPointerOn, uGyro * 0.6, step(0.001, length(uGyro)));
  vec2 p = st * 1.8 + lean * 0.3 + vec2(0.0, uScroll * 0.15);

  float t = uTime * 0.15;

  // Domain-warped folds: the Damascus layering.
  vec2 q = vec2(snoise(p + t), snoise(p + vec2(4.3, 2.8) + t * 0.8));
  vec2 r = vec2(
    snoise(p + 3.0 * q + vec2(1.7, 9.2) + 0.2 * t),
    snoise(p + 3.0 * q + vec2(8.3, 2.8) + 0.15 * t)
  );
  vec2 w = p + 3.5 * r;
  float wave = snoise(w);

  // A wake that spreads from the pointer while it is over the page.
  float d = length(st - ptr);
  wave += sin(d * 24.0 - t * 6.0) * exp(-d * 8.5) * (0.35 + uVelocity * 0.08) * uPointerOn;

  // Tight central differences: the sharp normals that make every line glint.
  const float eps = 0.01;
  float dX = snoise(w + vec2(eps, 0.0)) - snoise(w - vec2(eps, 0.0));
  float dY = snoise(w + vec2(0.0, eps)) - snoise(w - vec2(0.0, eps));
  vec3 n = normalize(vec3(-dX * 4.0, -dY * 4.0, 1.0));

  // The light radiates from the pointer.
  vec3 L = normalize(vec3((lightPos - st) * 1.8, 0.9));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 28.0) * 1.5;
  float fres = pow(1.0 - max(n.z, 0.0), 3.0);

  // Chromatic edge dispersion on fast movement.
  float disp = clamp(uVelocity * 0.006, 0.0, 0.045);
  vec3 tone = vec3(
    smoothstep(-0.6, 0.8, wave + disp),
    smoothstep(-0.6, 0.8, wave),
    smoothstep(-0.6, 0.8, wave - disp)
  );

  // Dark: obsidian steel with silver crests and white-hot glints.
  vec3 dark = mix(vec3(0.035, 0.040, 0.048), vec3(0.72, 0.78, 0.86), tone * 0.55);
  dark += vec3(0.98, 0.99, 1.0) * spec * 0.85;
  dark += vec3(0.85, 0.90, 0.96) * fres * 0.40;
  // The original drew this with alpha blending into a transparent canvas that
  // the browser then composited over the page: colour·a³ + page·(1 − a²).
  // That double application is what made it moody; reproduce it exactly.
  float a = clamp(mix(0.65, 0.90, fres + spec * 0.4), 0.0, 1.0);
  dark = clamp(dark, 0.0, 1.0) * a * a * a + vec3(0.031, 0.035, 0.047) * (1.0 - a * a);

  // Light: polished platinum. The same folds read as steel contour lines, and
  // the light adds shine (white glints and a soft pool) rather than shadow.
  vec3 platinum = vec3(0.925, 0.935, 0.952);
  vec3 steel = vec3(0.47, 0.51, 0.58);
  vec3 light = mix(platinum, steel, (1.0 - tone) * 0.46);
  light = mix(light, steel * 0.92, clamp(fres * 0.55, 0.0, 1.0));
  light = mix(light, vec3(1.0), clamp(spec * 0.62, 0.0, 1.0));
  light = mix(light, vec3(1.0), exp(-length(st - lightPos) * 3.4) * 0.22);

  gl_FragColor = vec4(mix(dark, light, uTheme), 1.0);
}
