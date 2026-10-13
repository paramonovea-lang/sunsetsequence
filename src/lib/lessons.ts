// Lessons are the migrated course pages (scripts/migrate-course.mjs → src/content/lessons/*.html).
// The course's authoring format is kept as is; codeboxes become site code blocks at build time,
// and a "build it step by step" card is placed where a guided sequence belongs.
import { codeBlockHtml } from './codeblock-html';
import { allGuides, guideHref, type Guide } from './guided';
import { CODEBOX, decode, rawLesson } from './lesson-source';
import meta from '../content/lessons/meta.json';

export type LessonMeta = { lede: string; onpage: { id: string; label: string }[] };

export function lessonMeta(slug: string): LessonMeta {
  const m = (meta as Record<string, LessonMeta>)[slug];
  if (!m) throw new Error(`No meta for lesson ${slug}; run node scripts/migrate-course.mjs`);
  return m;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function guideCard(g: Guide): string {
  return (
    `<a class="guided-cta" href="${guideHref(g)}">` +
    `<span class="guided-cta-eyebrow">GUIDED · ${g.steps.length} ${g.stepWord.toUpperCase()}S · IN THE EDITOR</span>` +
    `<b>Build ${esc(g.title.replace(/^The /, 'the '))} step by step →</b>` +
    `<span class="guided-cta-text">One ${g.stepWord.toLowerCase()} at a time, with the explanation next to the code. Change anything and press Ctrl+Enter.</span>` +
    `</a>`
  );
}

/** Insert html right after the heading that carries (or follows) id="anchor". */
function insertAfterAnchor(html: string, anchor: string, insert: string, slug: string): string {
  const at = html.indexOf(`id="${anchor}"`);
  if (at === -1) throw new Error(`${slug}: anchor #${anchor} for a guided sequence not found`);
  const ends = ['</h2>', '</h3>'].map((t) => html.indexOf(t, at)).filter((i) => i !== -1);
  const end = Math.min(...ends) + 5;
  return html.slice(0, end) + insert + html.slice(end);
}

/** Lesson body HTML with every codebox rendered as a code block (Run / Open in Strudel / Copy). */
export function lessonHtml(slug: string): string {
  let html = rawLesson(slug).replace(CODEBOX, (_, lang: 'strudel' | 'tidal', attrs: string, body: string) => {
    const label = attrs.match(/data-label="([^"]*)"/)?.[1];
    return codeBlockHtml({
      code: decode(body),
      lang,
      // The course names its local track files, e.g. "(tracks\bach-prelude-c.strudel.js)"; not useful here.
      label: label ? decode(label).replace(/\s*\(tracks[\\/][^)]*\)/, '') : undefined,
      runnable: !/\bdata-noplay\b/.test(attrs),
    });
  });
  if (html.includes('class="codebox')) throw new Error(`${slug}: a codebox didn't match the expected markup`);
  // Headings must not skip levels (WCAG, Lighthouse "heading-order"): the course's "Listen for" /
  // "Try changing" labels are h4 under an h2, so they become labels; other h4 become h3.
  html = html
    .replace(/<h4>(Listen for|Try changing)<\/h4>/g, '<p class="notes-h">$1</p>')
    .replace(/<h4(\s[^>]*)?>([\s\S]*?)<\/h4>/g, '<h3 class="sub-h"$1>$2</h3>');
  for (const g of allGuides().filter((g) => g.lesson === slug)) html = insertAfterAnchor(html, g.anchor, guideCard(g), slug);
  return html;
}
