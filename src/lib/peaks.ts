// Read audiowaveform JSON peaks at build and downsample them to bar heights 0–1 (docs/06).
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Peaks = { channels?: number; data: number[] };

/** Downsample min/max pairs to `count` bars of the loudest absolute value, scaled so the max is 1. */
export function toBars(peaks: Peaks, count = 160): number[] {
  const ch = peaks.channels ?? 1;
  const frames = Math.floor(peaks.data.length / (2 * ch));
  if (frames === 0) return [];
  const amp = new Array<number>(frames).fill(0);
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < ch; c++) {
      const i = (f * ch + c) * 2;
      amp[f] = Math.max(amp[f]!, Math.abs(peaks.data[i]!), Math.abs(peaks.data[i + 1]!));
    }
  }
  const n = Math.min(count, frames);
  const bars = Array.from({ length: n }, (_, b) => {
    const from = Math.floor((b * frames) / n);
    const to = Math.max(from + 1, Math.floor(((b + 1) * frames) / n));
    return Math.max(...amp.slice(from, to));
  });
  const max = Math.max(...bars) || 1;
  return bars.map((v) => Math.round((v / max) * 1000) / 1000);
}

/** Peaks for a media URL path like /media/peaks/sq-001.json, or null if the file isn't there yet. */
export function readBars(mediaPath: string, count = 160): number[] | null {
  try {
    const file = path.resolve(process.cwd(), mediaPath.replace(/^\//, ''));
    return toBars(JSON.parse(readFileSync(file, 'utf8')), count);
  } catch {
    return null;
  }
}
