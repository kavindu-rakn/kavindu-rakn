import type { APIRoute } from 'astro';
import { portfolioData, type ProjectItem } from '../data/portfolioData';

/*
 * Generated from the same data as the page, so the agent-facing copy can never
 * drift from what visitors see.
 */
export const GET: APIRoute = ({ site }) => {
  const { identity, socials, techMatrix, projects } = portfolioData;
  const url = site!.href.replace(/\/$/, '');

  const ledger = (category: ProjectItem['category']) =>
    projects
      .filter((p) => p.category === category)
      .map((p) => {
        const name = p.href ? `[${p.name}](${p.href})` : p.name;
        const status = p.status === 'in_build' ? ' (in build, no public link yet)' : '';
        return `- ${name}: ${p.description}.${status}`;
      })
      .join('\n');

  const body = `# ${identity.fullName}

> ${identity.role}. ${identity.bioStatement}

Canonical site: [${url}](${url}/)

## Contact

- [Email](mailto:${socials.email}): ${socials.email}
- [GitHub](${socials.github})
- [LinkedIn](${socials.linkedin})

## Projects built independently

${ledger('independent')}

## Projects built for organizations and clients

${ledger('commercial')}

## Stack

${techMatrix.map((m) => `- ${m.category}: ${m.skills.join(', ')}`).join('\n')}

## How this site is built

- Astro static output with Tailwind CSS, hosted on Vercel. One HTML page, no server rendering.
- The moving backdrop is a single fragment shader on raw WebGL, booted after load and paused when the tab is hidden; reduced-motion visitors get a still frame.
- Fonts are self-hosted with metric-matched fallbacks; the page has one h1, a skip link, and keyboard-reachable controls.
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
