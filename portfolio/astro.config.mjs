// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Drives canonical tags, Open Graph URLs and the sitemap.
  site: 'https://kavindu-rakn.xyz',

  /*
   * Static output. Zero SSR, no adapter, nothing to run at request time.
   * This is also what makes the "works with JavaScript disabled" requirement
   * (BRIEF §6) achievable rather than aspirational.
   */
  output: 'static',

  integrations: [mdx(), sitemap()],

  /*
   * Fonts are downloaded at build time and self-hosted — no third-party origin
   * on the critical path, no render-blocking stylesheet from fonts.googleapis.
   *
   * `display: 'swap'` keeps the LCP headline painting immediately in the
   * fallback, and `optimizedFallbacks` generates metric-matched fallback faces
   * so the swap costs almost no layout shift. Only the display face is
   * preloaded, because only it is used above the fold.
   */
  fonts: [
    {
      name: 'Archivo',
      cssVariable: '--font-archivo',
      provider: fontProviders.google(),
      weights: [400, 600, 800],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      optimizedFallbacks: true,
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      optimizedFallbacks: true,
    },
  ],

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
