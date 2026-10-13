// Small line highlighter ported from the original course.js (comments, strings, keywords).
// A line starting with "+ " is new in this step: the marker is stripped and the line flagged.
export type Lang = 'strudel' | 'tidal';
export type CodeLine = { html: string; isNew: boolean };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightLine(line: string, lang: Lang): string {
  const re =
    lang === 'tidal'
      ? /(--.*$)|("(?:[^"\\]|\\.)*")|(\bd\d+\b(?= \$)|\bhush\b|\bsetcps\b)/g
      : /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(_?\$:|\bsetcpm\b)/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? 'tk-c' : m[2] ? 'tk-s' : 'tk-k';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  return out + esc(line.slice(last));
}

/** Split code into highlighted lines; returns the plain code (markers stripped) for Copy and Run. */
export function prepareCode(source: string, lang: Lang): { lines: CodeLine[]; plain: string } {
  const raw = source.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const plainLines: string[] = [];
  const lines = raw.map((l) => {
    const isNew = l.startsWith('+ ');
    const text = isNew ? l.slice(2) : l;
    plainLines.push(text);
    return { html: highlightLine(text, lang), isNew };
  });
  return { lines, plain: plainLines.join('\n') };
}
