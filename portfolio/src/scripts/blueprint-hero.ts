import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  GLSL3,
} from 'three';

import fragmentShader from '../shaders/blueprint.frag.glsl?raw';

/**
 * The raymarched blueprint space.
 *
 * This replaces a 644-line scene of meshes, plates, connectors and projected
 * DOM labels. What is left of Three.js here is context management: a renderer,
 * a quad, and a material. There is no scene graph to speak of, no lighting, no
 * geometry describing anything you can see — every visible line is computed in
 * the fragment shader.
 *
 * Three deliberate departures from what came before:
 *
 *   1. Nothing in the hero is clickable. The old nodes navigated from a canvas
 *      click handler, which is a link with no keyboard path, no focus ring, no
 *      middle-click and no href in the status bar. The real links are in the
 *      grid below and always were.
 *   2. Nothing reads layout during scroll. The section's extent is measured on
 *      resize and cached; a scroll frame only reads `window.scrollY`.
 *   3. The drawing buffer is not resized when only the viewport height changes
 *      by a small amount. That is the mobile URL bar, and reallocating the
 *      buffer on every one of those was almost certainly the reported scroll
 *      glitch — it is a full GPU surface reallocation, mid-scroll, repeatedly.
 */

export type BootContext = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  section: HTMLElement;
};

/** Steps and pixel density, by how much device the visitor brought. */
type Quality = { maxSteps: number; pixelRatio: number };

function qualityFor(): Quality {
  const cores = navigator.hardwareConcurrency ?? 0;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0;
  const modest = (cores > 0 && cores <= 6) || (memory > 0 && memory <= 4);

  // Raymarching is entirely fragment-bound, so pixel count is the dominant
  // term. 1.5 rather than 2 costs a little crispness and saves 44% of the work.
  return modest
    ? { maxSteps: 44, pixelRatio: 1 }
    : { maxSteps: 78, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5) };
}

/**
 * Resolve a CSS custom property to a Color, with a literal fallback.
 *
 * The `convertLinearToSRGB` is load-bearing, not decoration. Three's colour
 * management treats a hex or CSS string as sRGB and stores it linearised, ready
 * for a lighting pipeline to work in linear space and convert back on output.
 * This shader has no lighting and writes its result straight to the framebuffer,
 * so that conversion never happens and the linear value ships as if it were
 * sRGB — which is much too dark. `#04101b` arrived on screen as rgb(0, 1, 3)
 * instead of rgb(4, 16, 27). Converting back here hands the shader the numbers
 * the stylesheet actually asked for.
 */
function tokenColour(el: Element, name: string, fallback: string): Color {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  let colour: Color;
  try {
    colour = new Color(raw || fallback);
  } catch {
    colour = new Color(fallback);
  }
  return colour.convertLinearToSRGB();
}

export function boot(ctx: BootContext): () => void {
  const { canvas, stage, section } = ctx;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false, // The shader anti-aliases its own lines; MSAA adds nothing.
    alpha: false,
    powerPreference: 'low-power',
  });

  const quality = qualityFor();
  renderer.setPixelRatio(quality.pixelRatio);

  const scene = new Scene();
  // The quad spans clip space directly, so the camera is never actually used
  // for projection — the vertex shader passes position straight through.
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new Vector2(0, 0) },
    uMaxSteps: { value: quality.maxSteps },
    uPaper: { value: tokenColour(stage, '--color-ground', '#fcfbf8') },
    uInk: { value: tokenColour(stage, '--color-figure', '#101109') },
    uAccent: { value: tokenColour(stage, '--color-accent', '#1d5c86') },
  };

  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms,
    vertexShader: /* glsl */ `
      void main() {
        // PlaneGeometry(2, 2) already spans -1..1, so no matrices are needed.
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);

  // ── layout, measured off the scroll path ─────────────────────────────────

  let sectionTop = 0;
  let scrollSpan = 1;
  let lastWidth = 0;
  let lastHeight = 0;

  function measure(): void {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    scrollSpan = Math.max(1, rect.height - window.innerHeight);
  }

  function resize(force = false): void {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width === 0 || height === 0) return;

    const widthMoved = Math.abs(width - lastWidth) > 1;
    // 80px of height movement is the URL bar collapsing, not a resize.
    const heightMoved = Math.abs(height - lastHeight) > 80;
    if (!force && !widthMoved && !heightMoved) return;

    lastWidth = width;
    lastHeight = height;

    renderer.setSize(width, height, false);
    const buffer = renderer.getDrawingBufferSize(new Vector2());
    uniforms.uResolution.value.set(buffer.x, buffer.y);
    measure();
  }

  resize(true);

  // ── input ────────────────────────────────────────────────────────────────

  const pointerTarget = new Vector2(0, 0);

  function onPointerMove(event: PointerEvent): void {
    // Normalised against the window, never against a measured element: this
    // runs on every pointer move and must not touch layout.
    pointerTarget.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1),
    );
  }

  // ── frame loop ───────────────────────────────────────────────────────────

  let raf = 0;
  let running = false;
  let visible = false;
  const started = performance.now();

  function frame(): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    uniforms.uTime.value = (performance.now() - started) / 1000;

    const progress = (window.scrollY - sectionTop) / scrollSpan;
    uniforms.uScroll.value = Math.min(1, Math.max(0, progress));

    // Ease toward the cursor so a fast flick does not snap the camera. This is
    // also why the old hover-driven readout felt twitchy: it had no smoothing.
    uniforms.uPointer.value.lerp(pointerTarget, 0.06);

    renderer.render(scene, camera);
  }

  function start(): void {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  const inView = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  );
  inView.observe(section);

  function onVisibilityChange(): void {
    if (document.hidden) stop();
    else if (visible) start();
  }

  function onResize(): void {
    resize();
  }

  const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function onThemeChange(): void {
    uniforms.uPaper.value.copy(tokenColour(stage, '--color-ground', '#fcfbf8'));
    uniforms.uInk.value.copy(tokenColour(stage, '--color-figure', '#101109'));
    uniforms.uAccent.value.copy(tokenColour(stage, '--color-accent', '#1d5c86'));
  }

  function onContextLost(event: Event): void {
    event.preventDefault();
    stop();
    // The static blueprint is a complete resting state, so falling back to it
    // is a downgrade rather than a failure.
    stage.dataset.mode = 'static';
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  themeQuery.addEventListener('change', onThemeChange);
  canvas.addEventListener('webglcontextlost', onContextLost);

  // One frame drawn before the crossfade, so the canvas never fades in empty.
  renderer.render(scene, camera);
  stage.dataset.mode = 'live';

  return function teardown(): void {
    stop();
    inView.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    themeQuery.removeEventListener('change', onThemeChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);

    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    stage.dataset.mode = 'static';
  };
}
