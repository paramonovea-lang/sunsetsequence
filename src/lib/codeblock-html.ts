// One code block's markup, shared by CodeBlock.astro (track pages) and the lesson renderer
// (codeboxes inside migrated course HTML). Behaviour lives in src/scripts/codeblocks.ts.
import { prepareCode, type Lang } from './highlight';
import { strudelUrl } from './strudel-hash';

const VISUAL = /\._?(pianoroll|punchcard|scope|spiral|spectrum|pitchwheel|wordfall)\s*\(/;

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => escHtml(s).replace(/"/g, '&quot;');

export type CodeBlockOptions = {
  code: string;
  lang?: Lang;
  label?: string;
  /** false hides Run and Open in Strudel (snippets that aren't meant to play on their own). */
  runnable?: boolean;
};

const PLAY = '<svg class="i-play" width="10" height="10" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1l11 6-11 6z" fill="currentColor"/></svg>';
const STOP = '<svg class="i-stop" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10" fill="currentColor"/></svg>';

export function codeBlockHtml({ code, lang = 'strudel', label, runnable = true }: CodeBlockOptions): string {
  const { lines, plain } = prepareCode(code, lang);
  const canRun = lang === 'strudel' && runnable;
  const name = label ?? (lang === 'tidal' ? 'Tidal' : 'Strudel');
  const open = canRun ? `<a class="cb-open" href="${escAttr(strudelUrl(plain))}" target="_blank" rel="noopener">Open in Strudel ↗</a>` : '';
  const run = canRun ? `<button type="button" class="cb-run" data-act="run" data-state="idle">${PLAY}${STOP}<span class="cb-run-label">Run</span></button>` : '';
  const body = lines.map((l) => `<span class="ln${l.isNew ? ' new' : ''}">${l.html}\n</span>`).join('');
  const visual =
    canRun && VISUAL.test(plain)
      ? `<p class="cb-note">The sound plays here; the visuals show in the full editor. <a href="${escAttr(strudelUrl(plain))}" target="_blank" rel="noopener">Open in Strudel ↗</a></p>`
      : '';
  return (
    `<figure class="codeblock ${lang}" data-code="${escAttr(plain)}"${canRun ? ' data-runnable' : ''}>` +
    `<figcaption class="cb-bar"><span class="cb-label">${escHtml(name)}</span><span class="cb-actions">${run}${open}<button type="button" class="cb-copy" data-act="copy">copy</button></span></figcaption>` +
    `<pre tabindex="0" aria-label="${escAttr(name)} code${canRun ? ', Ctrl+Enter runs it' : ''}"><code>${body}</code></pre>` +
    visual +
    `<p class="cb-msg" role="status" aria-live="polite" hidden></p>` +
    `</figure>`
  );
}
