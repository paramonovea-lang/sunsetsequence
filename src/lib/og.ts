// 1200×630 social preview images for tracks (docs/04 "Outputs"): the cover on the left,
// catalogue number, title and facts on the right, horizon stripes along the bottom.
// Rendered at build with @resvg/resvg-js; fonts are static TTFs in src/assets/og-fonts
// (Schibsted Grotesk ExtraBold cut from the variable font, DM Mono Regular).
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import tokens from '../../design/tokens.json';
import { coverSvg, type CoverInput } from './cover';

const C = tokens.color;
const FONT_DIR = path.resolve(process.cwd(), 'src/assets/og-fonts');

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

/** Greedy word wrap to at most `max` characters per line and `lines` lines (last line gets an ellipsis). */
export function wrap(text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= max) cur += ' ' + word;
    else {
      out.push(cur);
      cur = word;
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = out[lines - 1]!.replace(/\s*\S*$/, '') + '…';
  }
  return out;
}

export type OgInput = { cover: CoverInput; id: string; title: string; meta: string };

export function ogSvg({ cover, id, title, meta }: OgInput): string {
  const art = coverSvg(cover).replace(/^<svg [^>]*>/, '<svg x="0" y="0" width="630" height="630" viewBox="0 0 100 100" shape-rendering="crispEdges">');
  const size = title.length > 24 ? 64 : 80;
  const lines = wrap(title, size === 64 ? 18 : 14, 3);
  const titleY = 250;
  const titleText = lines
    .map((l, i) => `<tspan x="690" y="${titleY + i * size * 1.02}">${esc(l)}</tspan>`)
    .join('');
  const stripes = [3, 5, 8, 12, 18];
  let y = 548;
  const sea = stripes.map((h) => {
    const r = `<rect x="630" y="${y}" width="570" height="${h}" fill="${C.ink}"/>`;
    y += h + 4;
    return r;
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<rect width="1200" height="630" fill="${C.ground}"/>` +
    art +
    `<rect x="630" y="0" width="4" height="630" fill="${C.ink}"/>` +
    `<text x="690" y="120" font-family="DM Mono" font-size="26" fill="${C.muted}" letter-spacing="2">SPECIMEN ${esc(id)}</text>` +
    `<text font-family="Schibsted Grotesk" font-weight="800" font-size="${size}" fill="${C.ink}" letter-spacing="-2">${titleText}</text>` +
    `<text x="690" y="${titleY + lines.length * size * 1.02 + 30}" font-family="DM Mono" font-size="26" fill="${C.ink2}">${esc(meta)}</text>` +
    `<text x="690" y="510" font-family="Schibsted Grotesk" font-weight="800" font-size="26" fill="${C.ink}" letter-spacing="3">SUNSET SEQUENCE</text>` +
    sea.join('') +
    `</svg>`
  );
}

export function ogPng(input: OgInput): Uint8Array<ArrayBuffer> {
  const svg = ogSvg(input);
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      loadSystemFonts: false,
      fontFiles: [path.join(FONT_DIR, 'SchibstedGrotesk-ExtraBold.ttf'), path.join(FONT_DIR, 'DMMono-Regular.ttf')],
      defaultFontFamily: 'Schibsted Grotesk',
    },
  })
    .render()
    .asPng();
  return Uint8Array.from(png);
}
