# 04 · Cover generator — "the sunset is the sequence"

Every track's cover is drawn at build time from its data. No hand-made artwork. Output: an SVG (inline on pages) and a PNG (social/OG image, Media Session artwork).

## Inputs (from track frontmatter)

- `sequence.kick` — 16 characters, `x` = hit, `.` = rest (e.g. `x...x...x...x...`).
- `bpm` — number.
- `key` — e.g. `"A minor"`, `"F# major"`.
- `coverPalette` — optional override (palette id).

## Mapping

| Visual | Driven by | Rule |
|---|---|---|
| Sky / sun / sea colours | key | 6 palettes (tokens.json `coverPalettes`). Major keys: `[dusk, noon, ember, lagoon, mist, reef][pc % 6]`; minor keys: `[reef, lagoon, mist, dusk, ember, noon][pc % 6]`, where `pc` = pitch class 0–11 (C=0). Override with `coverPalette`. |
| Sun height | bpm | Faster = higher. Sun top `y = 34 − (clamp(bpm, 60, 180) − 60) × 28/120` (viewBox units). |
| Water stripes | kick pattern | Four stripes, one per beat; stripe height = `(5 + 3 × hitsInThatBeat)%` of the sea area; then a final band of 20%. Stripes are spread top-to-bottom with equal gaps. |

Geometry (viewBox `0 0 100 100`): sun = circle, diameter 56, centred horizontally. The sea occupies `y 54 → 100` and is painted in the **sky** colour first (it hides the lower half of the sun), then the stripes are painted in the **sea** colour on top. A 4% top padding sits above the first stripe.

## Reference implementation (TypeScript)

```ts
// src/lib/cover.ts
import tokens from '../../design/tokens.json';

type Palette = { id: string; sky: string; sun: string; sea: string };
const PAL: Record<string, Palette> = Object.fromEntries(tokens.coverPalettes.map((p) => [p.id, p]));
const MAJOR = ['dusk', 'noon', 'ember', 'lagoon', 'mist', 'reef'];
const MINOR = ['reef', 'lagoon', 'mist', 'dusk', 'ember', 'noon'];
const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export function paletteFor(key: string, override?: string): Palette {
  if (override && PAL[override]) return PAL[override];
  const [root, mode = 'major'] = key.trim().split(/\s+/);
  const pc = PC[root] ?? 0;
  const minor = /^(minor|min|m|aeolian|dorian|phrygian)$/i.test(mode);
  return PAL[(minor ? MINOR : MAJOR)[pc % 6]];
}

export function coverSvg(opts: { kick: string; bpm: number; key: string; palette?: string; title?: string }): string {
  const p = paletteFor(opts.key, opts.palette);
  const bpm = Math.min(180, Math.max(60, opts.bpm));
  const sunTop = 34 - ((bpm - 60) * 28) / 120;
  const seaTop = 54, seaH = 46, pad = seaH * 0.04;
  const kick = opts.kick.padEnd(16, '.').slice(0, 16);
  const beats = [0, 1, 2, 3].map((b) => [...kick.slice(b * 4, b * 4 + 4)].filter((c) => c === 'x').length);
  const hs = [...beats.map((c) => (seaH * (5 + 3 * c)) / 100), seaH * 0.2];
  const gap = (seaH - pad - hs.reduce((a, b) => a + b, 0)) / (hs.length - 1);
  let y = seaTop + pad;
  const stripes = hs.map((h) => { const r = `<rect x="0" y="${y.toFixed(2)}" width="100" height="${h.toFixed(2)}" fill="${p.sea}"/>`; y += h + gap; return r; }).join('');
  const label = opts.title ? `<title>${escapeXml(opts.title)} — cover</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" shape-rendering="crispEdges">${label}` +
    `<rect width="100" height="100" fill="${p.sky}"/>` +
    `<circle cx="50" cy="${(sunTop + 28).toFixed(2)}" r="28" fill="${p.sun}" shape-rendering="geometricPrecision"/>` +
    `<rect x="0" y="${seaTop}" width="100" height="${seaH}" fill="${p.sky}"/>${stripes}</svg>`;
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
```

## Outputs

- `Cover.astro` renders `coverSvg()` inline (decorative: `aria-hidden="true"` when a title is next to it).
- Build-time endpoints render PNGs with `@resvg/resvg-js`: `/covers/sq-001.png` (1000×1000, Media Session artwork; `src/pages/covers/[file].png.ts`) and `/og/sq-001.png` (1200×630 social image: cover left, `SPECIMEN SQ-001`, title, `[style] · [bpm] BPM · [key]`, wordmark and horizon stripes right; `src/lib/og.ts`, fonts in `src/assets/og-fonts/`: a static ExtraBold cut of Schibsted Grotesk and DM Mono Regular). Other pages use `/og-default.png` (`public/`, copied from `design/icons/`).
- Small sizes (46–48px thumbnails) use the same SVG. The logo mark (`design/logo/logo-mark.svg`) is this generator's output for C major, 120 BPM, `x...x...x...x...`.

## Tests

Unit tests in `src/lib/cover.test.ts`: palette mapping for a few keys; sun height at 60/124/180 BPM; stripe count = 5; stripe heights for `x...x...x...x...` vs `xxxx....xxxx....`; total of stripes + gaps + pad = sea height (±0.01).

Note: the canvas mockups used hand-picked sun heights; this spec replaces them.
