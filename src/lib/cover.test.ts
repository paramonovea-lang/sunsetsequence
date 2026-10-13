import { describe, expect, it } from 'vitest';
import { coverSvg, paletteFor, SEA_H, stripeHeights, sunTop } from './cover';

describe('paletteFor', () => {
  it('maps major and minor keys by pitch class', () => {
    expect(paletteFor('C major').id).toBe('dusk');
    expect(paletteFor('G major').id).toBe('noon');
    expect(paletteFor('Eb major').id).toBe('lagoon');
    expect(paletteFor('C minor').id).toBe('reef');
    expect(paletteFor('D minor').id).toBe('mist');
    expect(paletteFor('A minor').id).toBe('dusk');
    expect(paletteFor('F# major').id).toBe('dusk');
  });
  it('lets coverPalette override the key', () => {
    expect(paletteFor('A minor', 'ember').id).toBe('ember');
  });
});

describe('sunTop', () => {
  it('rises with tempo and clamps to 60–180 BPM', () => {
    expect(sunTop(60)).toBeCloseTo(34);
    expect(sunTop(124)).toBeCloseTo(19.067, 2);
    expect(sunTop(180)).toBeCloseTo(6);
    expect(sunTop(40)).toBeCloseTo(34);
    expect(sunTop(220)).toBeCloseTo(6);
  });
});

describe('stripes', () => {
  it('has five stripes', () => {
    expect(stripeHeights('x...x...x...x...')).toHaveLength(5);
  });
  it('makes beats with more kicks thicker', () => {
    expect(stripeHeights('x...x...x...x...').map((h) => +h.toFixed(2))).toEqual([3.68, 3.68, 3.68, 3.68, 9.2]);
    expect(stripeHeights('xxxx....xxxx....').map((h) => +h.toFixed(2))).toEqual([7.82, 2.3, 7.82, 2.3, 9.2]);
  });
  it('fills the sea exactly: pad + stripes + gaps = sea height', () => {
    for (const kick of ['x...x...x...x...', 'xxxx....xxxx....', 'x.x.x.x.x.x.x.x.', '................']) {
      const svg = coverSvg({ kick, bpm: 124, key: 'A minor' });
      const rects = [...svg.matchAll(/<rect x="0" y="([\d.]+)" width="100" height="([\d.]+)"/g)].map((m) => [+m[1]!, +m[2]!]).slice(1); // first match is the sea background
      expect(rects).toHaveLength(5);
      const [lastY, lastH] = rects.at(-1)!;
      expect(lastY + lastH).toBeCloseTo(54 + SEA_H, 1);
      expect(rects[0]![0]).toBeCloseTo(54 + SEA_H * 0.04, 2);
    }
  });
});

describe('coverSvg', () => {
  it('escapes the title', () => {
    expect(coverSvg({ kick: 'x...', bpm: 120, key: 'C major', title: 'A & B <1>' })).toContain('<title>A &amp; B &lt;1&gt; — cover</title>');
  });
});
