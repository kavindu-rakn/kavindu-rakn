/**
 * Liquid-steel backdrop.
 *
 * One fullscreen triangle and one fragment shader on raw WebGL 1. A library
 * would add tens of kilobytes to draw a single triangle, so there is none.
 *
 * - Domain-warped simplex noise, lit as a brushed-metal height field
 * - Pointer light and ripple that fade in only while a pointer is present
 * - Gyroscope tilt on phones, scroll-coupled drift, velocity-driven dispersion
 * - Rendered below native resolution: the surface is soft by design, so the
 *   upscale is invisible and the fill cost drops by ~4x
 * - Shader compiles off the main thread where KHR_parallel_shader_compile exists
 * - The loop stops entirely when the tab is hidden or reduced motion is on
 */

const MAX_DPR = 1.5;
const RENDER_SCALE = 0.5;

const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uPointerOn;
uniform float uVelocity;
uniform vec2 uTilt;
uniform float uTheme;
uniform float uScroll;

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

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 st = (gl_FragCoord.xy - 0.5 * uRes) / unit;
  vec2 ptr = (uPointer * uRes - 0.5 * uRes) / unit;

  float t = uTime * 0.05;
  vec2 p = st * 1.15 + uTilt * 0.22 + ptr * 0.06 * uPointerOn + vec2(0.0, uScroll * 0.32);

  // Two rounds of domain warping: broad, slow folds rather than fine grain.
  vec2 q = vec2(snoise(p + t), snoise(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(
    snoise(p + 1.5 * q + vec2(1.7, 9.2) + 0.5 * t),
    snoise(p + 1.5 * q + vec2(8.3, 2.8) - 0.4 * t)
  );
  vec2 w = p + 1.7 * r;
  float h = snoise(w);

  // Pointer ripple, only while a pointer is actually over the page.
  float d = length(st - ptr);
  float ripple = sin(d * 22.0 - uTime * 2.4) * exp(-d * 7.0) * (0.18 + uVelocity * 0.02) * uPointerOn;
  h += ripple;

  // Height-field normal from forward differences.
  const float e = 0.02;
  float hx = snoise(w + vec2(e, 0.0)) + ripple;
  float hy = snoise(w + vec2(0.0, e)) + ripple;
  vec3 n = normalize(vec3((h - hx) / e * 0.22, (h - hy) / e * 0.22, 1.0));

  // Key light from the upper left, pulled toward the pointer when present.
  vec3 key = normalize(vec3(-0.45, 0.55, 0.7));
  vec3 toPtr = normalize(vec3((ptr - st) * 1.6, 0.75));
  vec3 L = normalize(mix(key, toPtr, 0.75 * uPointerOn));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 48.0);
  float fres = pow(1.0 - n.z, 2.0);

  // Chromatic dispersion on fast pointer movement.
  float disp = clamp(uVelocity * 0.004, 0.0, 0.035);
  vec3 tone = vec3(
    smoothstep(-0.75, 0.95, h + disp),
    smoothstep(-0.75, 0.95, h),
    smoothstep(-0.75, 0.95, h - disp)
  );

  // Dark: obsidian steel with restrained silver crests, so copy stays legible.
  vec3 darkBase = vec3(0.031, 0.035, 0.047);
  vec3 darkCrest = vec3(0.50, 0.54, 0.60);
  vec3 dark = mix(darkBase, darkCrest, tone * 0.26);
  dark += vec3(0.82, 0.86, 0.92) * spec * 0.30;
  dark += vec3(0.60, 0.65, 0.72) * fres * 0.10;
  float vignette = smoothstep(1.35, 0.25, length(st * vec2(0.9, 1.0)));
  dark *= mix(0.72, 1.0, vignette);

  // Light: platinum, sculpted with soft shadow instead of highlights.
  vec3 lightBase = vec3(0.985, 0.988, 0.995);
  vec3 lightShadow = vec3(0.70, 0.73, 0.78);
  vec3 light = mix(lightBase, lightShadow, (1.0 - tone) * 0.24 + fres * 0.10);
  light = mix(light, vec3(1.0), spec * 0.45);
  light = mix(light, lightShadow, exp(-d * 6.0) * 0.18 * uPointerOn);

  vec3 color = mix(dark, light, uTheme);

  // Sub-LSB dither against banding in the long, soft gradients.
  color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`;

type Uniforms = Record<
  'uTime' | 'uRes' | 'uPointer' | 'uPointerOn' | 'uVelocity' | 'uTilt' | 'uTheme' | 'uScroll',
  WebGLUniformLocation | null
>;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function initMetallicCanvas(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  });
  if (!gl) return; // No WebGL: the page background already matches the theme.

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const parallel = gl.getExtension('KHR_parallel_shader_compile');

  let program: WebGLProgram | null = null;
  let u: Uniforms | null = null;
  let raf = 0;
  let running = false;
  let lost = false;
  let revealed = false;

  // ── Inputs ─────────────────────────────────────────────────────────────────
  const state = {
    time: 0,
    last: 0,
    px: 0.5, py: 0.5, tpx: 0.5, tpy: 0.5,
    on: 0, ton: 0,
    vel: 0, tvel: 0,
    gx: 0, gy: 0, tgx: 0, tgy: 0,
    theme: root.classList.contains('light') ? 1 : 0,
    scroll: 0,
  };

  const setPointer = (clientX: number, clientY: number) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = clientX / w;
    const ny = 1 - clientY / h;
    state.tvel = Math.min(Math.hypot((nx - state.tpx) * w, (ny - state.tpy) * h) * 0.5, 15);
    state.tpx = nx;
    state.tpy = ny;
    state.ton = 1;
    start();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') setPointer(e.clientX, e.clientY);
  };
  const onPointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) state.ton = 0; // left the window
  };
  const onTouch = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) setPointer(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => {
    state.ton = 0;
  };

  // Gyroscope. iOS gates it behind a permission prompt that must be requested
  // from a real user activation (touchend or click, not touchstart).
  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;
    state.tgx = Math.max(-1, Math.min(1, e.gamma / 45));
    state.tgy = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
  };
  const Orientation = window.DeviceOrientationEvent as unknown as
    | { requestPermission?: () => Promise<'granted' | 'denied'> }
    | undefined;
  if (Orientation && typeof Orientation.requestPermission === 'function') {
    const ask = () => {
      Orientation.requestPermission?.()
        .then((s) => s === 'granted' && window.addEventListener('deviceorientation', onOrientation, { passive: true }))
        .catch(() => {});
    };
    window.addEventListener('touchend', ask, { once: true, passive: true });
  } else if (Orientation) {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerout', onPointerOut, { passive: true });
  window.addEventListener('touchstart', onTouch, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });

  const readScroll = () => window.scrollY / (window.innerHeight || 1);
  state.scroll = readScroll();

  // ── GL setup ───────────────────────────────────────────────────────────────
  const buffer = () => {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  };

  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  };

  function build() {
    const prog = gl!.createProgram()!;
    gl!.attachShader(prog, compile(gl!.VERTEX_SHADER, VERTEX));
    gl!.attachShader(prog, compile(gl!.FRAGMENT_SHADER, FRAGMENT));
    gl!.bindAttribLocation(prog, 0, 'aPos');
    gl!.linkProgram(prog);

    // Status queries block until compilation finishes. With the parallel
    // extension, poll its non-blocking flag across frames first.
    const finish = () => {
      if (lost) return;
      if (parallel && !gl!.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) {
        requestAnimationFrame(finish);
        return;
      }
      if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) return; // stay on the CSS background
      program = prog;
      gl!.useProgram(prog);
      buffer();
      gl!.enableVertexAttribArray(0);
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
      const loc = (name: keyof Uniforms) => gl!.getUniformLocation(prog, name);
      u = {
        uTime: loc('uTime'), uRes: loc('uRes'), uPointer: loc('uPointer'), uPointerOn: loc('uPointerOn'),
        uVelocity: loc('uVelocity'), uTilt: loc('uTilt'), uTheme: loc('uTheme'), uScroll: loc('uScroll'),
      };
      resize();
      if (reducedMotion.matches) drawOnce();
      else start();
    };
    finish();
  }

  // ── Sizing ─────────────────────────────────────────────────────────────────
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR) * RENDER_SCALE;
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
    }
    if (!running) drawOnce();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // ── Frame ──────────────────────────────────────────────────────────────────
  function draw() {
    if (!program || !u || lost) return;
    gl!.uniform1f(u.uTime, state.time);
    gl!.uniform2f(u.uRes, canvas.width, canvas.height);
    gl!.uniform2f(u.uPointer, state.px, state.py);
    gl!.uniform1f(u.uPointerOn, state.on);
    gl!.uniform1f(u.uVelocity, state.vel);
    gl!.uniform2f(u.uTilt, state.gx, state.gy);
    gl!.uniform1f(u.uTheme, state.theme);
    gl!.uniform1f(u.uScroll, state.scroll);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!revealed) {
      revealed = true;
      canvas.classList.add('is-ready');
    }
  }

  function step(now: number) {
    const dt = Math.min((now - state.last) / 1000, 0.1);
    state.last = now;
    state.time += dt;
    state.px = lerp(state.px, state.tpx, 0.1);
    state.py = lerp(state.py, state.tpy, 0.1);
    state.on = lerp(state.on, state.ton, 0.06);
    state.tvel *= 0.9;
    state.vel = lerp(state.vel, state.tvel, 0.12);
    state.gx = lerp(state.gx, state.tgx, 0.05);
    state.gy = lerp(state.gy, state.tgy, 0.05);
    state.theme = lerp(state.theme, root.classList.contains('light') ? 1 : 0, 0.08);
    state.scroll = lerp(state.scroll, readScroll(), 0.08);
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    step(now);
    draw();
  }

  function start() {
    if (running || !program || lost || document.hidden || reducedMotion.matches) return;
    running = true;
    state.last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // Reduced motion: a single still frame, redrawn only when something changes.
  let pending = 0;
  function drawOnce() {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      state.theme = root.classList.contains('light') ? 1 : 0;
      state.on = 0;
      draw();
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      stop();
      drawOnce();
    } else {
      start();
    }
  });

  new MutationObserver(() => (running ? undefined : drawOnce())).observe(root, {
    attributes: true,
    attributeFilter: ['class'],
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    stop();
    program = null;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    build();
  });

  build();
}
