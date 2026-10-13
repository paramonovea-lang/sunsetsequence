// Per-track social preview images (1200×630), rendered at build (docs/04, src/lib/og.ts).
import type { APIRoute, GetStaticPaths } from 'astro';
import { ogPng } from '../../lib/og';
import { coverInput, meta, releasedTracks, type Track } from '../../lib/tracks';

export const getStaticPaths = (async () => {
  const tracks = await releasedTracks();
  return tracks.map((t) => ({ params: { file: t.data.id.toLowerCase() }, props: { track: t } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const t = (props as { track: Track }).track;
  const png = ogPng({ cover: coverInput(t), id: t.data.id, title: t.data.title, meta: meta(t) });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
