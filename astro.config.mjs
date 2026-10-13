// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { mediaMiddleware } from './scripts/lib/serve-static.mjs';

export default defineConfig({
  site: 'https://sunsetsequence.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true, // Astro 7 defaults to 'jsx', which drops spaces between inline elements
  integrations: [preact(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  vite: {
    plugins: [
      {
        // media/ (audio, peaks, stems) is outside git and outside public/; on the VPS Caddy serves it at /media/.
        name: 'sq-media',
        configureServer(server) {
          server.middlewares.use(mediaMiddleware('media'));
        },
      },
    ],
  },
});
