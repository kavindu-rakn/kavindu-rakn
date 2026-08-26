import type { APIRoute } from 'astro';

/**
 * robots.txt, generated rather than hand-written.
 *
 * The sitemap URL is derived from `site` in astro.config.mjs, so moving the
 * domain cannot leave a stale absolute URL pointing at the old one. A static
 * file in public/ would have to be remembered; this cannot drift.
 *
 * The `<link rel="sitemap">` tag in the layout is for humans and a few tools —
 * search engines look here.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
