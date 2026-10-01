// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Drives the canonical tag, Open Graph URLs, JSON-LD and the sitemap.
  site: 'https://kavindu-rakn.xyz',

  // Static output, no adapter. Vercel serves dist/ as-is.
  output: 'static',

  integrations: [sitemap()],

  /*
   * Fonts are downloaded at build time and self-hosted: no third-party origin
   * on the critical path. Only the weights the markup actually uses are
   * fetched, and `optimizedFallbacks` generates metric-matched fallback faces
   * so the swap from fallback to web font does not shift layout.
   */
  fonts: [
    {
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      provider: fontProviders.google(),
      weights: [300, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      optimizedFallbacks: true,
    },
    {
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-plus-jakarta',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      optimizedFallbacks: true,
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      optimizedFallbacks: true,
    },
  ],

  build: {
    // The whole stylesheet is small; inlining it removes the only
    // render-blocking request on the page.
    inlineStylesheets: 'always',
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      // File watching is unreliable inside OneDrive-synced folders.
      watch: {
        usePolling: true,
      },
    },
  },
});
