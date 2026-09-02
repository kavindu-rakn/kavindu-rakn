import { getCollection, type CollectionEntry } from 'astro:content';

export type WorkEntry = CollectionEntry<'work'>;

/**
 * Published case studies, in sheet order.
 *
 * Four places used to spell this out for themselves — the index, the 404
 * recovery list, the case-study routes and the build strip — which meant the
 * draft filter and the sort were written four times and could disagree three
 * ways. The strip already did: it skipped the sort, which did not matter to a
 * count, but it was one edit away from mattering.
 *
 * Drafts are excluded everywhere. A drafted entry has no route, so linking one
 * from a grid or a recovery list would produce a 404.
 */
export async function getWork(): Promise<WorkEntry[]> {
  const entries = await getCollection('work', ({ data }) => !data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order);
}
