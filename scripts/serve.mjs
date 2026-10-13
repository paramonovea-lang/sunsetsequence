// Serve the built site like Caddy will on the VPS: dist/ at /, media/ at /media/, 404.html for misses.
// Usage: node scripts/serve.mjs [port]   (default 4330)
import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileStat, mediaMiddleware, resolveInside, sendFile } from './lib/serve-static.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(projectRoot, 'dist');
const port = Number(process.argv[2] ?? 4330);
const media = mediaMiddleware(path.join(projectRoot, 'media'));
// The same security headers as the VPS (deploy/headers.json ↔ deploy/Caddyfile), so tests catch blocked scripts.
const headers = Object.entries(JSON.parse(readFileSync(path.join(projectRoot, 'deploy/headers.json'), 'utf8'))).filter(([k]) => !k.startsWith('_'));

http
  .createServer((req, res) => {
    for (const [k, v] of headers) res.setHeader(k, v);
    media(req, res, () => {
      let file = resolveInside(dist, req.url ?? '/');
      if (file && fileStat(file)?.isDirectory()) file = path.join(file, 'index.html');
      const cache = /^\/(_astro|covers|og)\//.test(req.url ?? '') ? 'public, max-age=31536000, immutable' : undefined;
      if (file && sendFile(req, res, file, { cache })) return;
      if (!sendFile(req, res, path.join(dist, '404.html'), { status: 404 })) {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`Serving dist/ and media/ at http://127.0.0.1:${port}/`));
