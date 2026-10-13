// Turns the original course (content/course-source/*.html, copied from E:\Tindal\course\site)
// into site lessons (docs/08). Re-run after the course changes:
//   1. copy E:\Tindal\course\site\* to content/course-source/
//   2. node scripts/migrate-course.mjs
// Writes src/content/lessons/<slug>.html (the page's sections), src/content/lessons/meta.json
// (lede + on-page links) and src/styles/lesson-content.css (course.css content rules, scoped and
// re-coloured). Every setup-specific rewrite asserts that its source text is still there, so a
// changed course fails loudly instead of leaking E:\Tindal paths onto the public site.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => path.join(root, 'content/course-source', f);
const outDir = path.join(root, 'src/content/lessons');

// Keep in step with PARTS in src/lib/course.ts.
const PAGES = [
  ['index', '01-start-here'],
  ['rhythm', '02-rhythm-and-drums'],
  ['harmony', '03-notes-and-chords'],
  ['sound', '04-sound-and-effects'],
  ['structure', '05-song-structure'],
  ['visuals', '06-visuals'],
  ['export', '07-save-export-practice'],
  ['commands', '08-command-reference'],
  ['reference', '09-sound-bank'],
  ['errors', '10-error-messages'],
  ['tracks', '11-example-tracks'],
];
const SLUG = Object.fromEntries(PAGES);

const problems = [];
function replaceOnce(html, from, to, where) {
  const i = html.indexOf(from);
  if (i === -1) {
    problems.push(`${where}: expected text not found: ${from.slice(0, 90)}`);
    return html;
  }
  return html.slice(0, i) + to + html.slice(i + from.length);
}
function sectionRange(html, id, where) {
  const start = html.indexOf(`<section id="${id}"`);
  if (start === -1) {
    problems.push(`${where}: section #${id} not found`);
    return null;
  }
  const end = html.indexOf('</section>', start) + '</section>'.length;
  return [start, end];
}
const removeSection = (html, id, where) => {
  const r = sectionRange(html, id, where);
  return r ? html.slice(0, r[0]) + html.slice(r[1]) : html;
};
const replaceSection = (html, id, replacement, where) => {
  const r = sectionRange(html, id, where);
  return r ? html.slice(0, r[0]) + replacement.trim() + html.slice(r[1]) : html;
};

// Page-specific rewrites (docs/08 "Rewrites").
const EDITS = {
  index(body, head) {
    body = removeSection(body, 'course-map', 'index'); // the /course/ page is the course map
    // the override keeps the source's numbered heading
    const runH2 = body.match(/<section id="run"[^>]*>\s*(<h2>[\s\S]*?<\/h2>)/)?.[1] ?? '<h2>Start the software</h2>';
    const run = readFileSync(path.join(root, 'content/course-overrides/01-run.html'), 'utf8').replace(/<h2>[\s\S]*?<\/h2>/, runH2);
    body = replaceSection(body, 'run', run, 'index');
    const facts = head.match(/<div class="facts">[\s\S]*?<\/div>/)?.[0];
    if (!facts) problems.push('index: .facts not found in header');
    else {
      const h2 = body.match(/<h2>(?:<span class="num">[^<]*<\/span>)?The track: Night Bus<\/h2>/)?.[0];
      if (!h2) problems.push('index: Night Bus heading not found');
      else body = body.replace(h2, `${h2}\n      ${facts}`);
    }
    return body;
  },
  errors(body) {
    return replaceOnce(body, '<li>Run <code>status.bat</code>. Everything you need should say RUNNING. If not, run <code>restart-all.bat</code>.</li>', '<li>Reload the page and press <b>Run</b> again.</li>', 'errors');
  },
  export(body) {
    return replaceOnce(body, 'Paste the code into a file such as <code>E:\\Tindal\\tracks\\night-bus.strudel.js</code>.', 'Paste the code into a text file such as <code>night-bus.strudel.js</code>.', 'export');
  },
  tracks(body) {
    body = replaceOnce(body, ' Each track also lives as a file in <code>E:\\Tindal\\tracks</code>.', '', 'tracks');
    // the track files live only in the local setup
    return body.replace(/ · <code>tracks\\[a-z-]+\.strudel\.js<\/code>/g, '');
  },
};

const DROP_ONPAGE = { index: ['course-map', 'update'] };
const FORBIDDEN = [/localhost/i, /E:[\\/]/, /\.bat\b/, /Tindal/, /tindal\.ps1/, /Play in local/i];

const meta = {};
const idsBySlug = {};
const links = [];
mkdirSync(outDir, { recursive: true });

for (const [file, slug] of PAGES) {
  const html = readFileSync(src(`${file}.html`), 'utf8').replace(/\r\n/g, '\n');
  const main = html.slice(html.indexOf('<main>') + 6, html.indexOf('</main>'));
  const headEnd = main.indexOf('</header>') + '</header>'.length;
  const head = main.slice(0, headEnd);
  let body = main.slice(headEnd, main.indexOf('<nav class="pager"'));

  body = EDITS[file] ? EDITS[file](body, head) : body;
  body = body.replace(new RegExp(`href="(${PAGES.map(([f]) => f).join('|')})\\.html(#[^"]*)?"`, 'g'), (_, f, hash = '') => `href="/course/${SLUG[f]}/${hash}"`);
  body = body.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  for (const re of FORBIDDEN) {
    const m = body.match(re);
    if (m) problems.push(`${file}: setup-specific text left: …${body.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\n/g, ' ')}…`);
  }

  const lede = head.match(/<p class="lede">([\s\S]*?)<\/p>/)?.[1]?.trim() ?? '';
  const onpageHtml = head.match(/<ul class="onpage">([\s\S]*?)<\/ul>/)?.[1] ?? '';
  const onpage = [...onpageHtml.matchAll(/<a href="#([^"]+)">([\s\S]*?)<\/a>/g)]
    .map((m) => ({ id: m[1], label: m[2].trim() }))
    .filter((o) => !(DROP_ONPAGE[file] ?? []).includes(o.id));
  meta[slug] = { lede, onpage };

  idsBySlug[slug] = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of body.matchAll(/href="([^"]+)"/g)) links.push([slug, m[1]]);
  for (const o of onpage) links.push([slug, `#${o.id}`]);

  writeFileSync(
    path.join(outDir, `${slug}.html`),
    `<!-- Generated by scripts/migrate-course.mjs from content/course-source/${file}.html. Edit the course, then re-run the script. -->\n${body}`,
  );
}

// Every internal link must land on a lesson and an id that exists.
for (const [from, href] of links) {
  const m = href.match(/^(?:\/course\/([^/]+)\/)?#(.+)$/);
  if (!m) continue;
  const slug = m[1] ?? from;
  if (!idsBySlug[slug]) problems.push(`${from}: link to unknown lesson ${href}`);
  else if (!idsBySlug[slug].has(m[2])) problems.push(`${from}: link to missing anchor ${href}`);
}

writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
writeFileSync(path.join(root, 'src/styles/lesson-content.css'), lessonCss(readFileSync(src('course.css'), 'utf8')));

if (problems.length) {
  console.error(`Migration finished with ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Migrated ${PAGES.length} pages into src/content/lessons/ and src/styles/lesson-content.css`);

// ---------------------------------------------------------------------------------------------
// course.css → lesson-content.css: keep the content rules, scope them to .lesson-body, map the
// old palette onto the site tokens (lesson-theme.css defines the --lx-* values).

function lessonCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const DROP = [
    /^:root/, /^\*$/, /^body\b/, /^\.shell\b/, /^main\b/, /^nav\.toc\b/, /^\.toc\b/, /^footer\b/, /^\.pager\b/,
    /^\.page-head\b/, /^header\.hero\b/, /^\.coursemap\b/, /^\.codebox\b/, /^\.codebar\b/, /^pre\.code\b/, /^\.tk-[sck]\b/,
    /^\.actions\b/, /^\.onpage\b/, /^h1\b/, /^\.eyebrow\b/, /^\.lede\b/, /^a\b/, /^a:focus-visible\b/, /^button:focus-visible\b/,
    /^\.legend i\b/,
  ];
  const out = [];
  const rules = (text) => {
    let i = 0;
    const res = [];
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open === -1) break;
      const prelude = text.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (depth && j < text.length) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const inner = text.slice(open + 1, j - 1);
      if (prelude.startsWith('@media')) {
        const innerRules = rules(inner);
        if (innerRules.length) res.push(`${prelude} {\n${innerRules.map((r) => '  ' + r).join('\n')}\n}`);
      } else if (!prelude.startsWith('@')) {
        const sels = prelude.split(',').map((s) => s.trim()).filter((s) => s && !DROP.some((d) => d.test(s)));
        if (sels.length) res.push(`${sels.map((s) => `.lesson-body ${s}`).join(', ')} { ${tokens(inner.trim())} }`);
      }
      i = j;
    }
    return res;
  };
  out.push(...rules(css));
  return `/* GENERATED by scripts/migrate-course.mjs from content/course-source/course.css. Do not edit; adjust lesson-theme.css. */\n${out.join('\n')}\n`;
}

function tokens(decls) {
  return decls
    .replace(/\s+/g, ' ')
    .replace(/var\(--paper\)/g, 'var(--ground)')
    .replace(/var\(--surface\)/g, 'var(--paper)')
    .replace(/background(-color)?: var\(--strudel\)/g, 'background$1: var(--lx-strudel-fill)')
    .replace(/var\(--strudel-soft\)/g, 'var(--lx-strudel-soft)')
    .replace(/var\(--strudel\)/g, 'var(--lx-strudel)')
    .replace(/var\(--tidal-soft\)/g, 'var(--lx-tidal-soft)')
    .replace(/var\(--tidal\)/g, 'var(--lx-tidal)')
    .replace(/var\(--code-bg\)/g, 'var(--lx-code-bg)')
    .replace(/var\(--code-str\)/g, 'var(--lx-strudel)')
    .replace(/var\(--code-com\)/g, 'var(--lx-code-com)')
    .replace(/var\(--code-kw\)/g, 'var(--lx-code-kw)')
    .replace(/var\(--f-display\)|var\(--f-body\)/g, 'var(--font-sans)')
    .replace(/var\(--f-mono\)/g, 'var(--font-mono)')
    .replace(/border-radius: (?!50%)[^;]+/g, 'border-radius: 0')
    // piano-key highlights: magenta family → the site's orange family; text on orange is ink (contrast)
    .replace(/#a1245c/gi, '#F0562A')
    .replace(/#f5c6da/gi, '#F9CDBB')
    .replace(/#b23a70/gi, '#C2461F')
    .replace(/#c2185b/gi, '#F0562A')
    .replace(/#ff6fae/gi, '#FF8A5C');
}
