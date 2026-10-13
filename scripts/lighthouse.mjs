// Lighthouse (mobile) on key pages (docs/10 Phase 5: performance ≥ 95, accessibility 100).
// Usage: node scripts/lighthouse.mjs [baseUrl]   default https://sunsetsequence.com
// While the site is behind the launch password, set LH_LOGIN_FILE to the preview-login text file
// (lines "Username: …" / "Password: …"); the login is sent as a header, never printed.
import { readFileSync } from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const base = (process.argv[2] ?? 'https://sunsetsequence.com').replace(/\/$/, '');
const pages = ['/', '/tracks/hope/', '/course/02-rhythm-and-drums/', '/course/02-rhythm-and-drums/drum-kit/'];

const extraHeaders = {};
if (process.env.LH_LOGIN_FILE) {
  const txt = readFileSync(process.env.LH_LOGIN_FILE, 'utf8');
  const user = txt.match(/^Username:\s*(.+)$/m)?.[1]?.trim();
  const pass = txt.match(/^Password:\s*(.+)$/m)?.[1]?.trim();
  if (user && pass) extraHeaders.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
let failed = false;
try {
  for (const p of pages) {
    const { lhr } = await lighthouse(base + p, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      extraHeaders,
    });
    const s = Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)]));
    const ok = s.performance >= 95 && s.accessibility === 100;
    failed ||= !ok;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${p.padEnd(42)} perf ${s.performance}  a11y ${s.accessibility}  best ${s['best-practices']}  seo ${s.seo}` +
      `  LCP ${lhr.audits['largest-contentful-paint'].displayValue}  TBT ${lhr.audits['total-blocking-time'].displayValue}  CLS ${lhr.audits['cumulative-layout-shift'].displayValue}`);
    const weak = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`);
    if (weak.length) console.log('     to look at: ' + weak.slice(0, 8).join(', '));
  }
} finally {
  await chrome.kill();
}
process.exit(failed ? 1 : 0);
