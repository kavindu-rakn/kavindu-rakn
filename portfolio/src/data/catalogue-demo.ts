/**
 * A worked example of the catalogue tree SchemaShift operates on.
 *
 * This is the shape the problem is easiest to explain with: "Electronics
 * defines brand and warranty_months. Laptops inherits both and adds
 * screen_size_in and gpu. Smartphones inherits the same two and adds
 * battery_mah, and must not see a single Laptops field."
 *
 * ── THESE NUMBERS ARE ILLUSTRATIVE ──────────────────────────────────────────
 * The item counts below are fixture data for a demonstration. They are not
 * measurements of anything, and the diagram labels itself as a worked example
 * so no reader can mistake them for production figures. Nothing here may be
 * quoted as a fact about the project.
 */

export type DemoField = {
  readonly key: string;
  readonly type: 'text' | 'number' | 'select';
};

export type DemoCategory = {
  readonly id: string;
  readonly label: string;
  readonly parent: string | null;
  /** Declared on this node. Every descendant inherits these. */
  readonly declares: readonly DemoField[];
  /** Items filed directly under this category in the worked example. */
  readonly items: number;
  /** Grid position for the diagram. */
  readonly gx: number;
  readonly gy: number;
};

export const CATALOGUE: readonly DemoCategory[] = [
  {
    id: 'electronics',
    label: 'Electronics',
    parent: null,
    declares: [
      { key: 'brand', type: 'text' },
      { key: 'warranty_months', type: 'number' },
    ],
    items: 0,
    gx: 0,
    gy: 0,
  },
  {
    id: 'laptops',
    label: 'Laptops',
    parent: 'electronics',
    declares: [
      { key: 'screen_size_in', type: 'number' },
      { key: 'gpu', type: 'text' },
    ],
    items: 412,
    gx: -1,
    gy: -1,
  },
  {
    id: 'smartphones',
    label: 'Smartphones',
    parent: 'electronics',
    declares: [{ key: 'battery_mah', type: 'number' }],
    items: 638,
    gx: 1,
    gy: -1,
  },
  {
    id: 'gaming-laptops',
    label: 'Gaming laptops',
    parent: 'laptops',
    declares: [{ key: 'refresh_rate_hz', type: 'number' }],
    items: 96,
    gx: -1,
    gy: -2,
  },
] as const;

export const categoryById = (id: string) => CATALOGUE.find((c) => c.id === id);

/** Root-first chain of ancestors, excluding the node itself. */
export function ancestorsOf(id: string): DemoCategory[] {
  const chain: DemoCategory[] = [];
  let current = categoryById(id)?.parent ?? null;
  while (current) {
    const node = categoryById(current);
    if (!node) break;
    chain.unshift(node);
    current = node.parent;
  }
  return chain;
}

export type ResolvedField = {
  readonly field: DemoField;
  /** Category the field is declared on. */
  readonly origin: DemoCategory;
  readonly inherited: boolean;
};

/**
 * Schema composes down the tree: ancestors first, root-most first, then the
 * node's own declarations. This mirrors the plpgsql resolver's ordering.
 */
export function resolveSchema(id: string): ResolvedField[] {
  const node = categoryById(id);
  if (!node) return [];
  const out: ResolvedField[] = [];
  for (const ancestor of ancestorsOf(id)) {
    for (const field of ancestor.declares) {
      out.push({ field, origin: ancestor, inherited: true });
    }
  }
  for (const field of node.declares) {
    out.push({ field, origin: node, inherited: false });
  }
  return out;
}

/** The node itself plus everything beneath it. */
export function subtreeOf(id: string): DemoCategory[] {
  const out: DemoCategory[] = [];
  const walk = (currentId: string) => {
    const node = categoryById(currentId);
    if (!node) return;
    out.push(node);
    for (const child of CATALOGUE.filter((c) => c.parent === currentId)) {
      walk(child.id);
    }
  };
  walk(id);
  return out;
}

/** Blast radius of declaring a new field on `id`. */
export function impactOf(id: string) {
  const affected = subtreeOf(id);
  return {
    categories: affected.length,
    items: affected.reduce((sum, c) => sum + c.items, 0),
    ids: affected.map((c) => c.id),
  };
}

export const EDGES = CATALOGUE.filter((c) => c.parent).map(
  (c) => [c.parent as string, c.id] as const,
);
