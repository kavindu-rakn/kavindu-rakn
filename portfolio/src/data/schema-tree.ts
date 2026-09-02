/**
 * The schema tree: a node graph that inherits downward, with projects as its
 * leaves — SchemaShift's own data model drawn as physical structure.
 *
 * Read by one renderer now, not two: src/components/BlueprintSVG.astro. The
 * hero's WebGL layer used to consume this same graph, which is why the file
 * calls itself a single source of truth; that layer is now a raymarched space
 * with no node geometry, so this drives the static blueprint alone.
 *
 * Every `note` is verified before it was written. No note here
 * may assert anything that file does not verify.
 */

export type SchemaNode = {
  readonly id: string;
  /** Full name, used in the hover panel. */
  readonly label: string;
  /** Short uppercase form that fits inside a node plate. */
  readonly short: string;
  /** Verified one-line descriptor. */
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
