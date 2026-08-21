// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  /*
   * PLACEHOLDER — the domain is not purchased yet (BRIEF §5.4).
   * Tracked as PLACEHOLDERS.domain in src/consts.ts and surfaced in the UI.
   * `site` must be a valid absolute URL for canonical tags, Open Graph URLs and
   * the sitemap to generate, so it cannot itself be a fake token string.
   */
  site: 'https://kavinduranathunga.com',

  /*
   * Static output. Zero SSR, no adapter, nothing to run at request time.
   * This is also what makes the "works with JavaScript disabled" requirement
   * (BRIEF §6) achievable rather than aspirational.
   */
  output: 'static',

  integrations: [mdx(), sitemap()],

  build: {
    // Inline small stylesheets to remove a render-blocking request on the
    // critical path; the LCP element is text, so its CSS must not wait on a
    // round trip.
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
