// Minimal static file handler with HTTP Range support (audio seeking needs it).
// Used by `astro dev` for /media/* and by scripts/serve.mjs, which mirrors the Caddy setup in docs/09.
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.opus': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.zip': 'application/zip',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolve a URL path inside root, refusing anything that escapes it. */
export function resolveInside(root, urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  } catch {
    return null; // malformed %-escape
  }
  const full = path.resolve(root, rel);
  return full === root || full.startsWith(root + path.sep) ? full : null;
}

export function fileStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

/** Send a file, honouring a single "Range: bytes=a-b" request. */
export function sendFile(req, res, file, { status = 200, cache } = {}) {
  const st = fileStat(file);
  if (!st?.isFile()) return false;
  const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Accept-Ranges', 'bytes');
  if (cache) res.setHeader('Cache-Control', cache);
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (m && status === 200) {
    let start = m[1] === '' ? st.size - Number(m[2]) : Number(m[1]);
    let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : st.size - 1;
    end = Math.min(end, st.size - 1);
    if (start < 0 || start > end) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${st.size}`);
      res.end();
      return true;
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`);
    res.setHeader('Content-Length', end - start + 1);
    if (req.method === 'HEAD') return res.end(), true;
    createReadStream(file, { start, end }).pipe(res);
    return true;
  }
  res.statusCode = status;
  res.setHeader('Content-Length', st.size);
  if (req.method === 'HEAD') return res.end(), true;
  createReadStream(file).pipe(res);
  return true;
}

/** Connect-style middleware serving /media/* from mediaDir. */
export function mediaMiddleware(mediaDir) {
  const root = path.resolve(mediaDir);
  return (req, res, next) => {
    if (!req.url?.startsWith('/media/')) return next();
    const file = resolveInside(root, req.url.slice('/media/'.length));
    if (file && sendFile(req, res, file, { cache: 'no-cache' })) return;
    res.statusCode = 404;
    res.end('Not found');
  };
}
