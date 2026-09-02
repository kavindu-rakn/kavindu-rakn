import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from 'astro:content' is deprecated as of Astro 7.
import { z } from 'astro/zod';

/**
 * Case studies. One file per project — adding work later is writing a file,
 * not editing a component.
 *
 * The `superRefine` block at the bottom is not decoration. It turns the two
 * hard constraints that would most damage the deliverable into build errors:
 *   1. A private repository linked to github.com renders a 404 to logged-out
 *      visitors, which does not read as "private" — it reads as "fabricated".
 *     
 *   2. An unfilled live URL shipping silently.
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
         * Ordered by centrality to the work, never alphabetically. Do not
         * reorder, and do not add a technology that was not used.
         *
         * Required. It was optional while TalentHub's stack was unverified and
         * that entry carried a placeholder token instead. The stack has been
         * verified since, so optionality only left room for an entry to ship
         * with no stack at all.
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
         * paid, or client work. Only TalentHub is `in-production`,
         * and that is verified by the repository README.
         */
        status: z.enum(['in-production', 'deployed-in-development', 'live']),

        /**
         * True for TalentHub only. It is employment, not a personal repo —
         * there is no public link and one must not be fabricated
         *. Orthogonal to `status`: TalentHub is simultaneously
         * in production and unlinkable.
         */
        employment: z.boolean().default(false),

        /**
         * Employment work that ALSO has a public artifact the author owns and
         * can link — EasyApply runs on his own GitHub Pages, and SLT run a
         * mirror of it on their servers.
         *
         * This exists so a link on an employment entry is always a deliberate,
         * verified act. The blanket ban it replaces was written when TalentHub
         * was the only employment entry, and generalised from it: it made an
         * invented link impossible, but a real one impossible too.
         */
        ownPublicDeployment: z.boolean().default(false),

        /** Short factual bullets for the grid card. Product facts only. */
        highlights: z.array(z.string()).optional(),

        ogImage: image().optional(),

        /**
         * Case-study imagery, as a list of required captures.
         *
         * While `src` is absent the figure renders as a visible missing-asset
         * slot naming exactly what to shoot (he currently has
         * almost none). Add `src` and `alt` and the same slot becomes the real
         * image, so filling a gap is editing one file, not touching a template.
         *
         * `src` is resolved relative to this markdown file, e.g. `./shot.png`.
         */
        figures: z
          .array(
            z.object({
              spec: z.string(),

              /**
               * Drives the slot's aspect ratio. A phone recording is 9:16 and
               * has nowhere correct to live in a 16:9 frame — it either letterboxes
               * into a strip or gets cropped, and both misrepresent the work.
               */
              viewport: z.enum(['desktop', 'mobile']).default('desktop'),

              /** Still image, resolved relative to this markdown file. */
              src: image().optional(),

              /**
               * Screen recording, as a path under public/media/.
               *
               * Not `image()`: astro:assets processes images only, and would
               * reject an .mp4 outright. Videos are served from public/ as-is,
               * so lint-content.mjs checks the file actually exists in dist —
               * a typo here would otherwise ship as a silently broken player.
               */
              video: z
                .string()
                .regex(
                  /^\/media\/[A-Za-z0-9._-]+\.(mp4|webm)$/,
                  'Must be a path under /media/ ending in .mp4 or .webm.',
                )
                .optional(),

              /**
               * Poster frame. Required with `video`: it is what a visitor sees
               * before playback, on a slow connection, and — because the player
               * never autoplays without JS confirming motion is welcome — it is
               * the whole experience under prefers-reduced-motion.
               */
              poster: image().optional(),

              alt: z.string().optional(),
            }),
          )
          .optional(),

        draft: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (data.sourcePrivate && data.githubUrl) {
          ctx.addIssue({
            code: 'custom',
            path: ['githubUrl'],
            message:
              'this repository is private. A github.com link renders a 404 to ' +
              'logged-out visitors and reads as fabricated. Remove githubUrl, or make the repo public.',
          });
        }

        if (data.employment && (data.githubUrl || data.liveUrl) && !data.ownPublicDeployment) {
          ctx.addIssue({
            code: 'custom',
            path: ['githubUrl'],
            message:
              'Employment work must not carry an invented link. TalentHub is internal and has ' +
              'none. If this project genuinely has a public artifact you own and can link, set ' +
              '`ownPublicDeployment: true` to say so deliberately.',
          });
        }

        if (data.ownPublicDeployment && !data.employment) {
          ctx.addIssue({
            code: 'custom',
            path: ['ownPublicDeployment'],
            message:
              '`ownPublicDeployment` qualifies `employment`. On a personal project it says ' +
              'nothing — remove it.',
          });
        }

        if (data.ownPublicDeployment && !data.githubUrl && !data.liveUrl && !data.draft) {
          ctx.addIssue({
            code: 'custom',
            path: ['liveUrl'],
            message:
              '`ownPublicDeployment` claims a linkable public artifact, so supply the link. ' +
              'Drafts are exempt while the URL is still being gathered.',
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

        data.figures?.forEach((figure, i) => {
          if (figure.src && figure.video) {
            ctx.addIssue({
              code: 'custom',
              path: ['figures', i, 'video'],
              message:
                'A figure is one thing: a still (`src`) or a recording (`video`). For both, ' +
                'write two figures.',
            });
          }

          if (figure.video && !figure.poster) {
            ctx.addIssue({
              code: 'custom',
              path: ['figures', i, 'poster'],
              message:
                'A recording needs a `poster`. It is what shows before playback and under ' +
                'prefers-reduced-motion, where the video never plays at all.',
            });
          }

          if ((figure.src || figure.video) && !figure.alt) {
            ctx.addIssue({
              code: 'custom',
              path: ['figures', i, 'alt'],
              message:
                'A figure with `src` or `video` needs `alt`. Every published asset describes ' +
                'itself.',
            });
          }
        });
      }),
});

export const collections = { work };
