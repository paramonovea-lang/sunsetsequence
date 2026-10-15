import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { coverSvg } from './cover';
import type { PlayerTrack } from '../stores/player';

export type Track = CollectionEntry<'tracks'>;

/** Released tracks, newest first (docs/05). */
export async function releasedTracks(): Promise<Track[]> {
  const all = await getCollection('tracks', (t) => t.data.status === 'released');
  // Same day: the higher catalogue number is the newer release.
  return all.sort((a, b) => b.data.released.getTime() - a.data.released.getTime() || b.data.id.localeCompare(a.data.id));
}

/** Upcoming tracks, next one first: only the catalog's "coming soon" cards show them (no page, player or feed). */
export async function upcomingTracks(): Promise<Track[]> {
  const all = await getCollection('tracks', (t) => t.data.status === 'upcoming');
  return all.sort((a, b) => a.data.id.localeCompare(b.data.id));
}

const codeFiles = import.meta.glob<string>('../content/tracks/code/*.strudel', { query: '?raw', import: 'default', eager: true });

export function trackCode(t: Track): string {
  const code = codeFiles[`../content/tracks/${t.data.code}`];
  if (code === undefined) throw new Error(`${t.data.id}: code file "${t.data.code}" not found in src/content/tracks/code/`);
  return code;
}

/** What a page shows for each fact: placeholder tracks show [bpm] etc. instead of dev numbers. */
export function facts(t: Track) {
  const d = t.data;
  const ph = d.placeholder;
  return {
    date: ph ? '[Release date]' : d.released.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    bpm: ph ? '[bpm]' : String(d.bpm),
    key: ph ? '[key]' : d.key,
    length: ph ? '[0:00]' : d.length,
    form: ph || !d.formCycles ? '[n] cycles' : `${d.formCycles} cycles`,
    chords: ph || d.chords.length === 0 ? '[progression]' : d.chords.join(' · '),
    drums: ph ? `[${d.drums ?? 'drums'}]` : (d.drums ?? '—'),
    engine: { strudel: 'Strudel', tidal: 'TidalCycles', both: 'Strudel + TidalCycles' }[d.engine],
  };
}

export const meta = (t: Track) => {
  const f = facts(t);
  return `${t.data.style} · ${f.bpm} BPM · ${f.key}`;
};

export const coverInput = (t: Track) => ({
  kick: t.data.sequence.kick,
  bpm: t.data.bpm,
  key: t.data.key,
  palette: t.data.coverPalette,
});

const short = (data: string | Buffer) => createHash('sha256').update(data).digest('hex').slice(0, 8);
const fileVersions = new Map<string, string | null>();

/** `?v=` from the file's contents: a new mix under the same name gets a new URL, so browsers
 *  don't keep playing the old one (media is cached for a day, docs/09). No local file: no tag. */
function fileVersion(mediaPath: string): string | null {
  if (!fileVersions.has(mediaPath)) {
    let v: string | null = null;
    try { v = short(readFileSync(path.resolve(process.cwd(), mediaPath.replace(/^\//, '')))); } catch {}
    fileVersions.set(mediaPath, v);
  }
  return fileVersions.get(mediaPath)!;
}

/** Media paths in frontmatter start with /media/; PUBLIC_MEDIA_BASE moves them to a CDN (docs/09, Q5). */
export function mediaUrl(p: string): string {
  const base = import.meta.env.PUBLIC_MEDIA_BASE as string | undefined;
  const v = fileVersion(p);
  return (base ? p.replace(/^\/media/, base.replace(/\/$/, '')) : p) + (v ? `?v=${v}` : '');
}

/** What the docked player needs to know about every release. */
export function playerTrack(t: Track): PlayerTrack {
  const d = t.data;
  const svg = coverSvg(coverInput(t));
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    audio: mediaUrl(d.audio.mp3),
    // /covers/ is cached for a year: the tag changes when the cover does (new palette, kick, key, tempo).
    png: `/covers/${d.id.toLowerCase()}.png?v=${short(svg)}`,
    svg,
    bpm: d.bpm,
    formCycles: d.formCycles,
    placeholder: d.placeholder,
  };
}

/** Rows for SequenceGrid, in the order and colours of docs/02. */
export function sequenceRows(t: Track, compact = false) {
  const s = t.data.sequence;
  const rows = [
    { label: 'kick', color: 'var(--ink)', pattern: s.kick },
    { label: 'clap', color: 'var(--accent)', pattern: s.clap },
    { label: compact ? 'hats' : 'closed hat', color: 'var(--teal)', pattern: s.hats },
    { label: 'open hat', color: 'var(--teal)', pattern: compact ? undefined : s.openHat },
    { label: 'bass', color: 'var(--ink)', pattern: s.bass },
    { label: 'chords', color: 'var(--chords)', pattern: compact ? undefined : s.chords },
  ];
  return rows.filter((r): r is { label: string; color: string; pattern: string } => !!r.pattern);
}
