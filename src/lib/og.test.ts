import { describe, expect, it } from 'vitest';
import { ogPng, ogSvg, wrap } from './og';

const input = { cover: { kick: 'x...x...x...x...', bpm: 124, key: 'A minor' }, id: 'SQ-001', title: '[Track title]', meta: '[style] · [bpm] BPM · [key]' };

describe('wrap', () => {
  it('breaks on words and caps the line count', () => {
    expect(wrap('one two three four', 9, 3)).toEqual(['one two', 'three', 'four']);
    expect(wrap('aaaa bbbb cccc dddd eeee', 4, 2)).toEqual(['aaaa', '…']);
  });
});

describe('og image', () => {
  it('escapes text and nests the cover', () => {
    const svg = ogSvg({ ...input, title: 'A & B <1>' });
    expect(svg).toContain('A &amp; B &lt;1&gt;');
    expect(svg).toContain('width="630" height="630" viewBox="0 0 100 100"');
  });
  it('renders a 1200×630 PNG', () => {
    const png = ogPng(input);
    expect([...png.slice(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    const view = new DataView(png.buffer, png.byteOffset);
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
  });
});
