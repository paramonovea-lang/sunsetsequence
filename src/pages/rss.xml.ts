// Releases feed (docs/01 sitemap): newest first, one item per released track.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { meta, releasedTracks } from '../lib/tracks';
import { SITE } from '../site';

export const GET: APIRoute = async (context) => {
  const tracks = await releasedTracks();
  return rss({
    title: `${SITE.name}: releases`,
    description: 'New specimens: music written in code, each with its full sequence.',
    site: context.site!,
    items: tracks.map((t) => ({
      title: `${t.data.id} · ${t.data.title}`,
      link: `/tracks/${t.data.slug}/`,
      pubDate: t.data.released,
      description: meta(t),
    })),
    customData: '<language>en</language>',
  });
};
