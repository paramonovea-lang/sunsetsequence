// The sunset is the sequence: each cover is drawn from the track's key, tempo and kick (docs/04).
import tokens from '../../design/tokens.json';

export type Palette = { id: string; sky: string; sun: string; sea: string };

const PAL: Record<string, Palette> = Object.fromEntries(tokens.coverPalettes.map((p) => [p.id, p]));
const MAJOR = ['dusk', 'noon', 'ember', 'lagoon', 'mist', 'reef'];
const MINOR = ['reef', 'lagoon', 'mist', 'dusk', 'ember', 'noon'];
const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export const SEA_TOP = 54;
export const SEA_H = 46;

export function paletteFor(key: string, override?: string): Palette {
  if (override && PAL[override]) return PAL[override];
  const [root = 'C', mode = 'major'] = key.trim().split(/\s+/);
  const pc = PC[root] ?? 0;
  const minor = /^(minor|min|m|aeolian|dorian|phrygian)$/i.test(mode);
  return PAL[(minor ? MINOR : MAJOR)[pc % 6]!]!;
}

/** Top of the sun in viewBox units: faster tracks sit higher. */
export function sunTop(bpm: number): number {
  const b = Math.min(180, Math.max(60, bpm));
  return 34 - ((b - 60) * 28) / 120;
}

/** Heights of the 5 water stripes: one per beat (thicker with more kicks), then a 20% band. */
export function stripeHeights(kick: string): number[] {
  const k = kick.padEnd(16, '.').slice(0, 16);
  const beats = [0, 1, 2, 3].map((b) => [...k.slice(b * 4, b * 4 + 4)].filter((c) => c === 'x').length);
  return [...beats.map((c) => (SEA_H * (5 + 3 * c)) / 100), SEA_H * 0.2];
}

export type CoverInput = { kick: string; bpm: number; key: string; palette?: string; title?: string };

export function coverSvg(opts: CoverInput): string {
  const p = paletteFor(opts.key, opts.palette);
  const top = sunTop(opts.bpm);
  const pad = SEA_H * 0.04;
  const hs = stripeHeights(opts.kick);
  const gap = (SEA_H - pad - hs.reduce((a, b) => a + b, 0)) / (hs.length - 1);
  let y = SEA_TOP + pad;
  const stripes = hs
    .map((h) => {
      const r = `<rect x="0" y="${y.toFixed(2)}" width="100" height="${h.toFixed(2)}" fill="${p.sea}"/>`;
      y += h + gap;
      return r;
    })
    .join('');
  const label = opts.title ? `<title>${escapeXml(opts.title)} — cover</title>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" shape-rendering="crispEdges">${label}` +
    `<rect width="100" height="100" fill="${p.sky}"/>` +
    `<circle cx="50" cy="${(top + 28).toFixed(2)}" r="28" fill="${p.sun}" shape-rendering="geometricPrecision"/>` +
    `<rect x="0" y="${SEA_TOP}" width="100" height="${SEA_H}" fill="${p.sky}"/>${stripes}</svg>`
  );
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
