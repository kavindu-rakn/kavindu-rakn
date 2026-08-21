/**
 * Single source of truth for identity, SEO defaults, and unfilled assets.
 *
 * Every fact here is verified — see CONTEXT-FOR-CLAUDE-CODE.md §6 (IDENTITY).
 * Nothing in this file may introduce a lines-of-code figure, a percentage
 * derived from one, or self-description language ("passionate", "hardworking").
 */

export const SITE = {
  name: 'Kavindu Ranathunga',
  legalName: 'R.A.K.N. Ranathunga',
  role: 'Full-stack Developer',
  location: 'Colombo, Sri Lanka',
  email: 'kavindu.rakn@gmail.com',
  github: 'https://github.com/kavindu-rakn',
  education:
    'BSc (Hons) Information Technology, Software Engineering specialisation, SLIIT, 2022–2027',
  /** Site-level meta description. Kept under 160 characters for SERP display. */
  description:
    'Full-stack developer in Colombo, Sri Lanka. Largest contributor to TalentHub, a production platform at Sri Lanka Telecom Mobitel.',
  locale: 'en',
  /** Default Open Graph image. Does not exist yet — tracked in PLACEHOLDERS.ogDefault. */
  ogImage: '/og/default.png',
} as const;

/**
 * Assets and URLs that do not exist yet.
 *
 * BRIEF §5: "Placeholders for all of the above must be visually obvious in the
 * build so none of them can ship empty, exactly as the resume does with [PHONE]."
 *
 * Every entry here is rendered by <Placeholder /> with a high-visibility
 * treatment. `npm run lint:content` (added in Phase 3) fails the build if any
 * token still resolves to `null` at deploy time.
 */
export type PlaceholderSpec = {
  /** The literal token the brief specified, or a stable equivalent. */
  readonly token: string;
  /** Short human label shown in the rendered placeholder. */
  readonly label: string;
  /** What Kavindu has to do by hand to resolve it. */
  readonly action: string;
  /** Resolved value. `null` until supplied — never invent one. */
  readonly value: string | null;
};

export const PLACEHOLDERS = {
  schemashiftLive: {
    token: 'LIVE_URL_SCHEMASHIFT',
    label: 'SchemaShift live URL',
    action: 'Paste the Vercel deployment URL. Repo is private — do not link github.com.',
    value: null,
  },
  tamarindLive: {
    token: 'LIVE_URL_TAMARIND',
    label: 'Hotel Tamarind Tree live URL',
    action: 'Paste the Vercel deployment URL. Repo is private — do not link github.com.',
    value: null,
  },
  linkedin: {
    token: 'LINKEDIN_URL',
    label: 'LinkedIn profile',
    action: 'Create the profile, then paste the URL. Do not invent one.',
    value: null,
  },
  domain: {
    token: 'SITE_DOMAIN',
    label: 'Production domain',
    action:
      'Buy the domain and update `site` in astro.config.mjs. A vercel.app subdomain is an unforced signal.',
    value: null,
  },
  ogDefault: {
    token: 'OG_IMAGE_DEFAULT',
    label: 'Default Open Graph image',
    action: 'Produce /public/og/default.png at 1200×630, or a template that generates them.',
    value: null,
  },
} as const satisfies Record<string, PlaceholderSpec>;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

/** Navigation. Kept here so Layout stays presentational. */
export const NAV = [
  { href: '/', label: 'Index' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
] as const;
