// Raw migrated lesson HTML (src/content/lessons/*.html) and the course's codebox markup.
const files = import.meta.glob<string>('../content/lessons/*.html', { query: '?raw', import: 'default', eager: true });

export function rawLesson(slug: string): string {
  const raw = files[`../content/lessons/${slug}.html`];
  if (raw === undefined) throw new Error(`Lesson file src/content/lessons/${slug}.html is missing; run node scripts/migrate-course.mjs`);
  return raw.replace(/^<!--[\s\S]*?-->\n/, '');
}

/** One course codebox: lang, attributes, escaped code. */
export const CODEBOX = /<div class="codebox (strudel|tidal)"([^>]*)>\s*<pre class="code">([\s\S]*?)<\/pre>\s*<\/div>/g;

/** HTML text → plain text (codebox bodies, labels). */
export const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
