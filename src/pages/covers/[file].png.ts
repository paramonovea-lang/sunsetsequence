// 1000×1000 PNG covers (Media Session artwork, link previews), rendered at build from the same SVG (docs/04).
import type { APIRoute, GetStaticPaths } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import { coverSvg } from '../../lib/cover';
import { coverInput, releasedTracks, type Track } from '../../lib/tracks';

export const getStaticPaths = (async () => {
  const tracks = await releasedTracks();
  return tracks.map((t) => ({ params: { file: t.data.id.toLowerCase() }, props: { track: t } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const svg = coverSvg(coverInput((props as { track: Track }).track));
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
