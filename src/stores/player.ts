// Shared player state (docs/06). The DockedPlayer owns the single <audio> element and drives these
// stores; buttons anywhere on any page only call the actions below.
import { atom, computed } from 'nanostores';

export type PlayerTrack = {
  id: string; // catalogue number, e.g. SQ-001
  title: string;
  slug: string;
  audio: string; // URL
  png: string; // 1000×1000 cover for Media Session
  svg: string; // inline cover for the thumbnail
  bpm: number;
  formCycles?: number;
  placeholder: boolean;
};

export const $queue = atom<PlayerTrack[]>([]); // catalog order, newest first
export const $currentId = atom<string | null>(null);
export const $isPlaying = atom(false);
export const $position = atom(0); // seconds
export const $duration = atom(0); // seconds, 0 until metadata loads

export const $current = computed([$queue, $currentId], (q, id) => q.find((t) => t.id === id) ?? null);

type Command =
  | { type: 'play'; id: string; at?: number } // at = fraction 0–1 to start from
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'seek'; seconds: number };

/** The player listens to this; anything else sends commands through the actions. */
export const $command = atom<Command | null>(null);
const send = (c: Command) => $command.set(c);

export function playTrack(id: string, at?: number) {
  send({ type: 'play', id, at });
}

/** Play/pause semantics for a track's own button. */
export function toggleTrack(id: string) {
  if ($currentId.get() === id) send({ type: $isPlaying.get() ? 'pause' : 'resume' });
  else playTrack(id);
}

export function pausePlayer() {
  if ($isPlaying.get()) send({ type: 'pause' });
}

export function seekTo(seconds: number) {
  send({ type: 'seek', seconds });
}

export function step(dir: 1 | -1) {
  const q = $queue.get();
  const i = q.findIndex((t) => t.id === $currentId.get());
  const next = q[i + dir];
  if (next) playTrack(next.id);
  else if (dir === -1) seekTo(0);
}

export const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/** Cycle (bar) number at a position: one cycle = 4 beats, as with setcpm(bpm/4). */
export const cycleAt = (seconds: number, bpm: number) => Math.floor(seconds / (240 / bpm)) + 1;

/** 16th-note step within the bar, 0–15. */
export const stepAt = (seconds: number, bpm: number) => Math.floor(seconds / (15 / bpm)) % 16;
