import { describe, expect, it } from 'vitest';
import { strudelHash } from './strudel-hash';
import { highlightLine, prepareCode } from './highlight';

describe('strudelHash', () => {
  it('base64-encodes UTF-8 and URL-escapes it', () => {
    expect(strudelHash('s("bd")')).toBe(encodeURIComponent(Buffer.from('s("bd")', 'utf8').toString('base64')));
    expect(strudelHash('// ½ → é')).toBe(encodeURIComponent(Buffer.from('// ½ → é', 'utf8').toString('base64')));
  });
});

describe('highlight', () => {
  it('marks comments, strings and keywords and escapes HTML', () => {
    expect(highlightLine('$: s("<bd sd>") // kick', 'strudel')).toBe(
      '<span class="tk-k">$:</span> s(<span class="tk-s">"&lt;bd sd&gt;"</span>) <span class="tk-c">// kick</span>',
    );
    expect(highlightLine('d1 $ s "bd"', 'tidal')).toBe('<span class="tk-k">d1</span> $ s <span class="tk-s">"bd"</span>');
  });
  it('strips the "+ " new-line marker', () => {
    const { lines, plain } = prepareCode('setcpm(30)\n+ s("bd")\n', 'strudel');
    expect(plain).toBe('setcpm(30)\ns("bd")');
    expect(lines.map((l) => l.isNew)).toEqual([false, true]);
  });
});
