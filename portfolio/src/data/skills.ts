/**
 * Capabilities, grouped.
 *
 * Until this file existed there was no answer on the site to "what does he
 * know" — the only signal was the tech badges scattered across six case study
 * cards, which meant reading all six and assembling the list yourself. That is
 * work a recruiter will not do.
 *
 * Sourced from the résumé (public/kavindu-ranathunga-resume.pdf) so the two
 * cannot disagree: anyone reading both should not find a capability on one that
 * is missing from the other. When the résumé changes, change this with it.
 *
 * Deliberately unrated. Self-assigned proficiency scores are unverifiable, and
 * the content linter bans percentages for the same reason it bans "passionate".
 * The case studies are the evidence; this is only the index to them.
 */

export type SkillGroup = {
  /** Short label. Rendered in the mono annotation face. */
  readonly label: string;
  readonly items: readonly string[];
};

export const SKILLS = [
  {
    label: 'Core languages',
    items: ['JavaScript', 'TypeScript', 'SQL', 'HTML', 'CSS', 'Python', 'Java'],
  },
  {
    label: 'Frontend and graphics',
    items: [
      'React',
      'Next.js',
      'Vite',
      'Tailwind',
      'Framer Motion',
      'GSAP',
      'Three.js',
      'Chart.js',
      'Leaflet',
      'i18next',
    ],
  },
  {
    label: 'Backend and APIs',
    items: [
      'Node',
      'Express',
      'Server Actions',
      'REST APIs',
      'JWT',
      'Google OAuth',
      'Nodemailer',
      'Resend',
    ],
  },
  {
    label: 'Databases and ORMs',
    items: [
      'PostgreSQL',
      'Supabase (RLS, plpgsql, triggers)',
      'Prisma',
      'MongoDB',
      'Mongoose',
    ],
  },
  {
    label: 'AI and web APIs',
    items: [
      'Google Gemini API',
      'Claude Code',
      'TensorFlow.js',
      'face-api.js',
      'Web Audio API',
    ],
  },
  {
    label: 'Tooling and DevOps',
    items: [
      'Git and PR workflows',
      'GitHub Actions',
      'Vercel',
      'Firebase',
      'Automated testing',
      'Localisation (EN/SI/TA)',
    ],
  },
] as const satisfies readonly SkillGroup[];

/** Total distinct entries, for the annotation line above the matrix. */
export const SKILL_COUNT = SKILLS.reduce((n, g) => n + g.items.length, 0);
