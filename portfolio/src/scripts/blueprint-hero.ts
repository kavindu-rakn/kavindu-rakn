/**
 * The Blueprint hero — vanilla Three.js.
 *
 * This module is only ever reached through a dynamic import, and only after the
 * capability gate in BlueprintHero.astro has already passed. Three.js is
 * roughly 600 KB, so it must never sit in the initial bundle (BRIEF §2).
 *
 * Performance budget enforced here:
 *   · devicePixelRatio capped at 2
 *   · render loop fully stopped when off-screen (IntersectionObserver)
 *   · render loop fully stopped when the tab is hidden (visibilitychange)
 *   · no textures at all — geometry is boxes and lines
 *   · no shadow maps
 *   · scroll read once per scroll event, not once per frame
 *
 * `boot` returns a teardown function that disposes every GPU resource it made.
 */

/*
 * Named imports document exactly which of Three.js this island depends on.
 *
 * They do NOT make the bundle smaller: the emitted chunk is byte-identical to
 * the `import * as THREE` version, because WebGLRenderer transitively reaches
 * most of the library anyway. Lighthouse reports ~41% of this chunk as "unused
 * JavaScript", but that figure is runtime code coverage — branches not taken
 * during load — not dead code a bundler could remove. Measured, not assumed.
 */
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { SCHEMA_TREE, SCHEMA_EDGES, nodeById, type SchemaNode } from '../data/schema-tree';

export type BootContext = {
  canvas: HTMLCanvasElement;
  /** Wrapper that owns the crossfade classes. */
  stage: HTMLElement;
  /** The tall section that drives scroll progress. */
  section: HTMLElement;
  /** Empty container that receives one positioned label per node. */
  labels: HTMLElement;
  /** Readout elements for the hovered node. */
  readout: HTMLElement;
  readoutLabel: HTMLElement;
  readoutNote: HTMLElement;
  /** Slugs that have a real case study. Only these become clickable. */
  linkable: ReadonlySet<string>;
};

// Leaf pitch is 1 grid unit; the widest leaf plate is 1.02, so the grid must be
// scaled past that or neighbouring plates intersect.
const X = (gx: number) => gx * 1.15;
const Y = (gy: number) => gy * 0.95;

const FOV_DEGREES = 38;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

type PlateDims = { w: number; h: number; d: number };
const dimsFor = (depth: 0 | 1 | 2): PlateDims =>
  depth === 0
    ? { w: 1.0, h: 0.4, d: 0.18 }
    : depth === 1
      ? { w: 1.12, h: 0.36, d: 0.15 }
      : { w: 1.02, h: 0.34, d: 0.12 };

type Plate = {
  node: SchemaNode;
  mesh: Mesh;
  edges: LineSegments;
  assembled: Vector3;
  exploded: Vector3;
  half: number;
};

function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    line: new Color(pick('--color-accent', '#1d5c86')),
    solid: new Color(pick('--color-ground-raised', '#f5f3ec')),
    figure: new Color(pick('--color-figure', '#101109')),
  };
}

export function boot(ctx: BootContext): () => void {
  const { canvas, stage, section, labels, readout, readoutLabel, readoutNote, linkable } =
    ctx;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    // Context creation can still fail after the capability gate passed.
    // Leave the static blueprint exactly as it is.
    return () => {};
  }

  // Hard cap. Uncapped DPR on a retina laptop spins the fans for no visible gain.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  const group = new Group();
  scene.add(group);

  let theme = readTheme();

  // ── Materials ─────────────────────────────────────────────────────────────
  // One shared material per kind; per-plate opacity is uniform across the tree.
  const lineMaterial = new LineBasicMaterial({
    color: theme.line,
    transparent: true,
    opacity: 1,
  });
  const connectorMaterial = new LineBasicMaterial({
    color: theme.line,
    transparent: true,
    opacity: 0.75,
  });
  const solidMaterial = new MeshStandardMaterial({
    color: theme.solid,
    roughness: 0.62,
    metalness: 0.12,
    transparent: true,
    opacity: 0,
  });
  const highlightMaterial = new MeshStandardMaterial({
    color: theme.line,
    roughness: 0.45,
    metalness: 0.2,
    transparent: true,
    opacity: 0,
  });

  // ── Lights (start dark — the blueprint state is unlit) ────────────────────
  const ambient = new AmbientLight(theme.figure, 0);
  const key = new DirectionalLight(0xffffff, 0);
  key.position.set(2.5, 3.5, 4);
  const rim = new DirectionalLight(theme.line, 0);
  rim.position.set(-3, -1.5, 2);
  scene.add(ambient, key, rim);

  // ── Plates ────────────────────────────────────────────────────────────────
  const plates: Plate[] = [];
  const geometries: BufferGeometry[] = [];

  /**
   * Worst-case half-extents of each plate in each state, used to derive the
   * camera distance. Framing is computed from the geometry rather than from
   * hand-tuned constants, so a plate can never end up outside the frustum.
   */
  type Extent = { x: number; y: number; z: number };
  const explodedExtents: Extent[] = [];
  const assembledExtents: Extent[] = [];

  for (const node of SCHEMA_TREE) {
    const { w, h, d } = dimsFor(node.depth);
    const box = new BoxGeometry(w, h, d);
    const edgeGeo = new EdgesGeometry(box);
    geometries.push(box, edgeGeo);

    const mesh = new Mesh(box, solidMaterial);
    const edges = new LineSegments(edgeGeo, lineMaterial);

    const assembled = new Vector3(X(node.gx), Y(node.gy), 0);
    /*
     * Exploded state. The separation is mostly vertical and toward the camera —
     * a large horizontal explosion throws the outer leaves out of frame and
     * their connectors stretch across the viewport, which reads as broken
     * rather than as an exploded assembly.
     */
    const exploded = new Vector3(
      assembled.x * 1.12,
      assembled.y * 1.28,
      0.8 + node.depth * 0.85,
    );

    explodedExtents.push({
      x: Math.abs(exploded.x) + w / 2,
      y: Math.abs(exploded.y) + h / 2,
      z: exploded.z,
    });
    assembledExtents.push({
      x: Math.abs(assembled.x) + w / 2,
      y: Math.abs(assembled.y) + h / 2,
      z: assembled.z,
    });

    mesh.position.copy(exploded);
    edges.position.copy(exploded);
    mesh.userData.nodeId = node.id;

    group.add(mesh, edges);
    plates.push({ node, mesh, edges, assembled, exploded, half: h / 2 });
  }

  const plateById = new Map(plates.map((p) => [p.node.id, p]));

  /*
   * Node labels as a DOM overlay, projected from world space each frame.
   *
   * Chosen over TextGeometry (needs a font file on the critical path) and over
   * canvas-texture sprites (blurry, and texture memory for something the DOM
   * renders for free). These stay crisp at any pixel ratio, inherit the type
   * scale and theme tokens from CSS, and cost one transform write per frame.
   */
  const labelEls = new Map<string, HTMLElement>();
  for (const plate of plates) {
    const el = document.createElement('span');
    el.className = 'hero-node-label';
    el.dataset.depth = String(plate.node.depth);
    el.dataset.hovered = 'false';
    el.textContent = plate.node.short;
    labels.appendChild(el);
    labelEls.set(plate.node.id, el);
  }

  // ── Connectors ────────────────────────────────────────────────────────────
  // Right-angle routing, rebuilt each frame as the plates travel.
  const SEGMENTS_PER_EDGE = 3;
  const connectorGeo = new BufferGeometry();
  const connectorPositions = new Float32Array(
    SCHEMA_EDGES.length * SEGMENTS_PER_EDGE * 2 * 3,
  );
  connectorGeo.setAttribute(
    'position',
    new BufferAttribute(connectorPositions, 3),
  );
  geometries.push(connectorGeo);
  const connectors = new LineSegments(connectorGeo, connectorMaterial);
  group.add(connectors);

  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const dV = new Vector3();

  function writeSegment(i: number, from: Vector3, to: Vector3) {
    const o = i * 6;
    connectorPositions[o] = from.x;
    connectorPositions[o + 1] = from.y;
    connectorPositions[o + 2] = from.z;
    connectorPositions[o + 3] = to.x;
    connectorPositions[o + 4] = to.y;
    connectorPositions[o + 5] = to.z;
  }

  function updateConnectors() {
    let seg = 0;
    for (const [parentId, childId] of SCHEMA_EDGES) {
      const p = plateById.get(parentId)!;
      const k = plateById.get(childId)!;
      const parentBottom = p.mesh.position.y - p.half;
      const childTop = k.mesh.position.y + k.half;
      const bus = (parentBottom + childTop) / 2;

      a.set(p.mesh.position.x, parentBottom, p.mesh.position.z);
      b.set(p.mesh.position.x, bus, p.mesh.position.z);
      c.set(k.mesh.position.x, bus, k.mesh.position.z);
      dV.set(k.mesh.position.x, childTop, k.mesh.position.z);

      writeSegment(seg++, a, b);
      writeSegment(seg++, b, c);
      writeSegment(seg++, c, dV);
    }
    connectorGeo.attributes.position.needsUpdate = true;
  }

  // ── Camera framing ────────────────────────────────────────────────────────
  const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(FOV_DEGREES) / 2);

  /**
   * Smallest camera distance that keeps every extent inside the frustum.
   * A plate nearer the camera sees a smaller frustum, so `z` is added back in
   * rather than ignored — that was what pushed the outer leaves off-screen.
   */
  function requiredZ(extents: Extent[], aspect: number): number {
    let z = 0;
    for (const e of extents) {
      z = Math.max(
        z,
        e.z + e.y / HALF_FOV_TAN,
        e.z + e.x / (HALF_FOV_TAN * aspect),
      );
    }
    return z * 1.06;
  }

  let zExploded = 10;
  let zAssembled = 7;
  // CSS pixel size of the canvas, used to project world space to label offsets.
  let viewW = 1;
  let viewH = 1;

  /*
   * Cached canvas box. Reading getBoundingClientRect() inside pointermove
   * forces a synchronous layout on every mouse event, and positionLabels()
   * writes transforms every frame — read-after-write is a layout thrash that
   * shows up as stutter while the pointer moves. The box only changes on
   * resize and on scroll, so it is measured there instead.
   */
  let canvasRect = canvas.getBoundingClientRect();

  function applyCameraDistance(assembleT: number) {
    camera.position.set(0, 0, zExploded + (zAssembled - zExploded) * assembleT);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvasRect = rect;
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    viewW = w;
    viewH = h;
    const aspect = w / h;
    camera.aspect = aspect;
    zExploded = requiredZ(explodedExtents, aspect);
    zAssembled = requiredZ(assembledExtents, aspect);
    applyCameraDistance(easeInOutCubic(clamp01(currentProgress)));
    camera.updateProjectionMatrix();
  }

  // ── Scroll progress ───────────────────────────────────────────────────────
  // Read on scroll, not per frame, so the render loop never forces layout.
  let targetProgress = 0;
  let currentProgress = 0;

  function measureProgress() {
    const rect = section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    targetProgress = travel <= 0 ? 1 : clamp01(-rect.top / travel);
  }

  // ── Pointer / hover ───────────────────────────────────────────────────────
  const canHover = window.matchMedia('(hover: hover)').matches;
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  let pointerX = 0;
  let pointerY = 0;
  let raycastDirty = false;
  let hoveredId: string | null = null;
  const meshes = plates.map((p) => p.mesh);

  function onPointerMove(event: PointerEvent) {
    const rect = canvasRect;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    ndc.set(nx, ny);
    pointerX = nx;
    pointerY = ny;
    raycastDirty = true;
  }

  function setHovered(id: string | null) {
    if (id === hoveredId) return;
    hoveredId = id;

    for (const plate of plates) {
      plate.mesh.material = plate.node.id === id ? highlightMaterial : solidMaterial;
    }
    for (const [nodeId, el] of labelEls) {
      el.dataset.hovered = nodeId === id ? 'true' : 'false';
    }

    if (id) {
      const node = nodeById(id)!;
      readoutLabel.textContent = node.label;
      readoutNote.textContent = node.note;
      readout.dataset.state = 'active';
      canvas.style.cursor =
        node.slug && linkable.has(node.slug) ? 'pointer' : 'default';
    } else {
      readout.dataset.state = 'idle';
      canvas.style.cursor = 'default';
    }
  }

  /*
   * Hysteresis. Acquiring a node is instant; releasing it waits.
   *
   * Without this, a pixel of jitter at a plate edge flips the plate colour, the
   * label chip and the readout line all at once, many times a second. Delaying
   * only the release means a cursor that skims an edge, or crosses briefly
   * between two plates, does not produce a strobe.
   */
  const HOVER_RELEASE_MS = 140;
  let releaseTimer = 0;

  function requestHover(id: string | null) {
    if (id !== null) {
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = 0;
      }
      setHovered(id);
      return;
    }
    if (hoveredId === null || releaseTimer) return;
    releaseTimer = window.setTimeout(() => {
      releaseTimer = 0;
      setHovered(null);
    }, HOVER_RELEASE_MS);
  }

  function onClick() {
    if (!hoveredId) return;
    const node = nodeById(hoveredId);
    if (node?.slug && linkable.has(node.slug)) {
      window.location.href = `/work/${node.slug}`;
    }
  }

  // ── Theme changes ─────────────────────────────────────────────────────────
  const schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function onSchemeChange() {
    theme = readTheme();
    lineMaterial.color.copy(theme.line);
    connectorMaterial.color.copy(theme.line);
    solidMaterial.color.copy(theme.solid);
    highlightMaterial.color.copy(theme.line);
    ambient.color.copy(theme.figure);
    rim.color.copy(theme.line);
  }

  // ── Frame ─────────────────────────────────────────────────────────────────
  let rafId = 0;
  let onScreen = false;
  let contextLost = false;
  let firstFrameDone = false;

  function update() {
    currentProgress += (targetProgress - currentProgress) * 0.09;
    const p = currentProgress;
    const assemble = easeInOutCubic(clamp01(p));

    // Dolly in as the assembly closes up, so the finished object fills the
    // frame instead of shrinking into the middle of it.
    applyCameraDistance(assemble);

    for (const plate of plates) {
      plate.mesh.position.lerpVectors(plate.exploded, plate.assembled, assemble);
      plate.edges.position.copy(plate.mesh.position);
    }
    updateConnectors();

    // Wireframe recedes but never fully vanishes — the construction lines are
    // part of the finished object, not scaffolding to be thrown away.
    const lit = smoothstep(0.22, 0.92, p);
    lineMaterial.opacity = 1 - lit * 0.78;
    connectorMaterial.opacity = 0.75 - lit * 0.35;
    solidMaterial.opacity = lit;
    highlightMaterial.opacity = Math.max(lit, 0.25);

    ambient.intensity = lit * 0.9;
    key.intensity = lit * 2.1;
    rim.intensity = lit * 1.4;

    /*
     * Pointer parallax, frozen while a node is hovered.
     *
     * A tree that keeps rotating toward the cursor slides the very node you are
     * reaching for out from under it — you chase it, it moves again. Holding
     * the rotation once a node is acquired breaks that feedback loop. The
     * magnitudes are also well below what they were, so approaching a plate no
     * longer shifts it by more than a hair.
     */
    if (canHover) {
      const targetY = hoveredId ? group.rotation.y : pointerX * 0.075;
      const targetX = hoveredId ? group.rotation.x : -pointerY * 0.045;
      group.rotation.y += (targetY - group.rotation.y) * 0.05;
      group.rotation.x += (targetX - group.rotation.x) * 0.05;
    }

    const hint = p > 0.96 ? ASSEMBLED_HINT : 'Scroll to assemble';
    if (idleHint && hint !== shownHint) {
      shownHint = hint;
      idleHint.textContent = hint;
    }

    if (raycastDirty && canHover) {
      raycastDirty = false;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      requestHover(hit ? ((hit.object.userData.nodeId as string) ?? null) : null);
    }
  }

  /*
   * The idle hint reads "Scroll to assemble", which stops being true once the
   * tree is assembled. Swap it for the end state rather than leaving stale
   * instructions on screen. Touch devices get no raycast, so they are never
   * told to hover.
   */
  const idleHint = readout.querySelector<HTMLElement>('[data-hero-readout-idle]');
  const ASSEMBLED_HINT = canHover ? 'Hover a node' : 'Assembled';
  let shownHint = 'Scroll to assemble';

  const projected = new Vector3();

  /** Runs after render, so `group.matrixWorld` is already current. */
  function positionLabels() {
    for (const plate of plates) {
      const el = labelEls.get(plate.node.id);
      if (!el) continue;
      projected.copy(plate.mesh.position);
      group.localToWorld(projected);
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * viewW;
      const y = (-projected.y * 0.5 + 0.5) * viewH;
      // transform only — never touches layout
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    update();
    renderer.render(scene, camera);
    positionLabels();
    if (!firstFrameDone) {
      firstFrameDone = true;
      stage.dataset.mode = 'live';
    }
  }

  function sync() {
    const shouldRun = onScreen && !document.hidden && !contextLost;
    if (shouldRun && rafId === 0) {
      tick();
    } else if (!shouldRun && rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  // ── Observers and listeners ───────────────────────────────────────────────
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) onScreen = entry.isIntersecting;
      sync();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(() => {
    resize();
    measureProgress();
  });
  ro.observe(canvas);

  function onVisibility() {
    sync();
  }
  function onScroll() {
    measureProgress();
    // The canvas sits in a sticky container, so its viewport box moves as the
    // page scrolls even though its size does not.
    canvasRect = canvas.getBoundingClientRect();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    // Fall back to the static blueprint rather than showing a dead canvas.
    stage.dataset.mode = 'static';
    sync();
  }

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  canvas.addEventListener('webglcontextlost', onContextLost);
  schemeQuery.addEventListener('change', onSchemeChange);
  if (canHover) {
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('click', onClick);
  }

  resize();
  measureProgress();
  currentProgress = targetProgress;
  update();
  sync();

  // ── Teardown ──────────────────────────────────────────────────────────────
  return function teardown() {
    if (rafId !== 0) cancelAnimationFrame(rafId);
    rafId = 0;
    if (releaseTimer) {
      clearTimeout(releaseTimer);
      releaseTimer = 0;
    }
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    schemeQuery.removeEventListener('change', onSchemeChange);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('click', onClick);

    labels.replaceChildren();
    labelEls.clear();

    for (const geometry of geometries) geometry.dispose();
    lineMaterial.dispose();
    connectorMaterial.dispose();
    solidMaterial.dispose();
    highlightMaterial.dispose();
    renderer.dispose();
  };
}
