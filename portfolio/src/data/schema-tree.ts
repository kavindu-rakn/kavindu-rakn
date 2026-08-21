/**
 * The hero object: a schema tree drawn as an architectural exploded assembly.
 *
 * BRIEF §1: "Use the structure of a schema tree: a node graph that inherits
 * downward... Nodes are projects. It is SchemaShift's actual data model rendered
 * as physical structure."
 *
 * This file is the SINGLE SOURCE OF TRUTH for that graph. Both renderers read
 * it — the static SVG (src/components/BlueprintSVG.astro) and the Three.js
 * island (src/scripts/blueprint-hero.ts). They cannot drift apart, which
 * matters because the SVG is what low-power and reduced-motion visitors see
 * *instead of* the 3D, not alongside it.
 *
 * Every `note` is lifted verbatim-in-substance from CONTEXT §4. No note here
 * may assert anything that file does not verify.
 */

export type SchemaNode = {
  readonly id: string;
  /** Full name, used in the hover panel. */
  readonly label: string;
  /** Short uppercase form that fits inside a node plate. */
  readonly short: string;
  /** Verified one-line descriptor. CONTEXT §4 only. */
  readonly note: string;
  /** 0 = root, 1 = branch, 2 = leaf (a project). */
  readonly depth: 0 | 1 | 2;
  readonly parent: string | null;
  /** Grid units. Both renderers scale these; neither redefines them. */
  readonly gx: number;
  readonly gy: number;
  /**
   * Case-study slug. Only leaves have one, and a node is only made clickable
   * when a matching entry actually exists in the `work` collection — so this
   * can never produce a 404 for a study that has not been written yet.
   */
  readonly slug: string | null;
};

export const SCHEMA_TREE: readonly SchemaNode[] = [
  {
    id: 'root',
    label: 'Root',
    short: 'ROOT',
    note: 'Every project below makes an invisible mechanism visible.',
    depth: 0,
    parent: null,
    gx: 0,
    gy: 2,
    slug: null,
  },

  // ── depth 1 — branches ────────────────────────────────────────────────────
  {
    id: 'systems',
    label: 'Systems',
    short: 'SYSTEMS',
    note: 'Data models, migrations, correctness held under test.',
    depth: 1,
    parent: 'root',
    gx: -2,
    gy: 0,
    slug: null,
  },
  {
    id: 'product',
    label: 'Product',
    short: 'PRODUCT',
    note: 'Booking, auth, transactional email, admin tooling.',
    depth: 1,
    parent: 'root',
    gx: 0,
    gy: 0,
    slug: null,
  },
  {
    id: 'craft',
    label: 'Craft',
    short: 'CRAFT',
    note: 'Procedural geometry, audio synthesis, orbital mathematics.',
    depth: 1,
    parent: 'root',
    gx: 2,
    gy: 0,
    slug: null,
  },

  /*
   * ── depth 2 — projects ──────────────────────────────────────────────────
   *
   * Leaves are spaced UNIFORMLY at 1.0 grid unit. Grouping under a branch is
   * carried by the connectors, not by the spacing: clustering each pair tightly
   * left the cross-branch neighbours closer than the plates are wide, and they
   * overlapped. Branch gx values (-2, 0, 2) remain the mean of their pair.
   */
  {
    id: 'schemashift',
    label: 'SchemaShift',
    short: 'SCHEMASHIFT',
    note: 'Pre-commit impact analysis for schema changes.',
    depth: 2,
    parent: 'systems',
    gx: -2.5,
    gy: -2,
    slug: 'schemashift',
  },
  {
    id: 'talenthub',
    label: 'TalentHub',
    short: 'TALENTHUB',
    note: 'Internship platform in production at Sri Lanka Telecom Mobitel.',
    depth: 2,
    parent: 'systems',
    gx: -1.5,
    gy: -2,
    slug: 'talenthub',
  },
  {
    id: 'tamarind',
    label: 'Hotel Tamarind Tree',
    short: 'TAMARIND',
    note: 'Booking platform for a boutique hotel near Yala National Park.',
    depth: 2,
    parent: 'product',
    gx: -0.5,
    gy: -2,
    slug: 'hotel-tamarind-tree',
  },
  {
    id: 'prompta',
    label: 'Prompta',
    short: 'PROMPTA',
    note: 'Vault for AI prompts.',
    depth: 2,
    parent: 'product',
    gx: 0.5,
    gy: -2,
    slug: 'prompta',
  },
  {
    id: 'horologia',
    label: 'Horologia',
    short: 'HOROLOGIA',
    note: 'Exploded 3D mechanical watch movement, disassembles on scroll.',
    depth: 2,
    parent: 'craft',
    gx: 1.5,
    gy: -2,
    slug: 'horologia',
  },
  {
    id: 'luna',
    label: 'Luna',
    short: 'LUNA',
    note: 'Real-time moon phase, orbital position and sky panel.',
    depth: 2,
    parent: 'craft',
    gx: 2.5,
    gy: -2,
    slug: 'luna',
  },
] as const;

/** Parent → child edges, derived so the two renderers draw identical connections. */
export const SCHEMA_EDGES: readonly (readonly [string, string])[] = SCHEMA_TREE.filter(
  (n) => n.parent !== null,
).map((n) => [n.parent as string, n.id] as const);

export const nodeById = (id: string): SchemaNode | undefined =>
  SCHEMA_TREE.find((n) => n.id === id);
