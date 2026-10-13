import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const step16 = z.string().regex(/^[x.]{16}$/);

const tracks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/tracks' }),
  schema: z.object({
    id: z.string().regex(/^SQ-\d{3}$/), // catalogue number, release order
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/), // URL: /tracks/[slug]/
    status: z.enum(['released', 'upcoming']).default('released'),
    released: z.coerce.date(),
    style: z.string(),
    bpm: z.number().int().min(40).max(220),
    key: z.string(),
    formCycles: z.number().int().optional(),
    length: z.string().regex(/^\d+:\d{2}$/),
    chords: z.array(z.string()).default([]),
    engine: z.enum(['strudel', 'tidal', 'both']).default('strudel'),
    drums: z.string().optional(),
    sequence: z.object({
      kick: step16,
      clap: step16.optional(),
      hats: step16.optional(),
      openHat: step16.optional(),
      bass: step16.optional(),
      chords: step16.optional(),
    }),
    code: z.string(), // "code/sq-001.strudel", relative to src/content/tracks
    audio: z.object({ mp3: z.string(), peaks: z.string(), stems: z.string().optional() }),
    credits: z.object({ producer: z.string(), mastering: z.string().optional() }),
    licenses: z.object({ audio: z.string(), code: z.string() }),
    links: z
      .object({
        bandcamp: z.string().url().startsWith('https://').optional(),
        spotify: z.string().url().startsWith('https://').optional(),
        soundcloud: z.string().url().startsWith('https://').optional(),
      })
      .default({}),
    lessons: z.array(z.string()).default([]),
    coverPalette: z.enum(['dusk', 'lagoon', 'reef', 'ember', 'mist', 'noon']).optional(),
    hasLinerNotes: z.boolean().default(true),
    // Dev-only stand-in: the numbers drive the cover, but pages show [bpm], [key] … instead of them.
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { tracks };
