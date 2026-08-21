import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from 'astro:content' is deprecated as of Astro 7.
import { z } from 'astro/zod';

/**
 * Case studies. One file per project — adding work later is writing a file,
 * not editing a component (BRIEF §2, "Routing and content").
 *
 * The `superRefine` block at the bottom is not decoration. It turns the two
 * hard constraints that would most damage the deliverable into build errors:
 *   1. A private repository linked to github.com renders a 404 to logged-out
 *      visitors, which does not read as "private" — it reads as "fabricated".
 *      (CONTEXT §1.1)
 *   2. An unfilled live URL shipping silently. (BRIEF §5)
 */
const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),

        /** Doubles as the page meta description. Kept in SERP range. */
        description: z.string().max(200),

        /** The one-line blockquote used on the grid card. Optional, short. */
        tagline: z.string().max(120).optional(),

        /** Display priority in the grid. Lower sorts first. */
        order: z.number().int().positive(),

        /**
         * Ordered exactly as CONTEXT §4 specifies — by centrality to the work,
         * never alphabetically. Do not reorder. Do not add a technology he does
         * not use; there is no mobile development anywhere in this stack.
         */
        techStack: z.array(z.string()).nonempty(),

        liveUrl: z.url().optional(),

        /** Omit entirely when `sourcePrivate` is true. Enforced below. */
        githubUrl: z.url().optional(),

        /**
         * True for SchemaShift and HotelTamarindTree. Drives "Source available
         * on request" instead of a link that 404s.
         */
        sourcePrivate: z.boolean().default(false),

        /**
         * The literal token from the brief — `LIVE_URL_SCHEMASHIFT` or
         * `LIVE_URL_TAMARIND` — carried until the real URL is supplied.
         */
        liveUrlPlaceholder: z.string().optional(),

        /**
         * Deployment reality, as a closed vocabulary. Hotel Tamarind Tree is
         * `deployed-in-development` and must never be described as launched,
         * paid, or client work (BRIEF §6). Only TalentHub is `in-production`,
         * and that is verified by the repository README.
         */
        status: z.enum(['in-production', 'deployed-in-development', 'live']),

        /**
         * True for TalentHub only. It is employment, not a personal repo —
         * there is no public link and one must not be fabricated
         * (CONTEXT §3.3). Orthogonal to `status`: TalentHub is simultaneously
         * in production and unlinkable.
         */
        employment: z.boolean().default(false),

        /** Short factual bullets for the grid card. Product facts only. */
        highlights: z.array(z.string()).optional(),

        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
        ogImage: image().optional(),

        draft: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (data.sourcePrivate && data.githubUrl) {
          ctx.addIssue({
            code: 'custom',
            path: ['githubUrl'],
            message:
              'CONTEXT §1.1: this repository is private. A github.com link renders a 404 to ' +
              'logged-out visitors and reads as fabricated. Remove githubUrl, or make the repo public.',
          });
        }

        if (data.employment && (data.githubUrl || data.liveUrl)) {
          ctx.addIssue({
            code: 'custom',
            path: ['githubUrl'],
            message:
              'CONTEXT §3.3: TalentHub is employment, not a personal repo. There is no public ' +
              'link and one must not be fabricated.',
          });
        }

        if (data.sourcePrivate && !data.liveUrl && !data.liveUrlPlaceholder) {
          ctx.addIssue({
            code: 'custom',
            path: ['liveUrl'],
            message:
              'A private project needs a live URL to be verifiable at all. Supply `liveUrl`, or ' +
              'carry `liveUrlPlaceholder` so the unfilled state is visually obvious.',
          });
        }

        if (data.heroImage && !data.heroImageAlt) {
          ctx.addIssue({
            code: 'custom',
            path: ['heroImageAlt'],
            message: 'heroImage requires heroImageAlt. Every image needs alt text.',
          });
        }
      }),
});

export const collections = { work };
