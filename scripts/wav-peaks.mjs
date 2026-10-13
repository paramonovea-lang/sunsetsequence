// Waveform peaks for a release recorded as WAV (for example exported from Strudel), without
// audiowaveform: reads a 16-bit PCM WAV and writes min/max pairs in audiowaveform's JSON format
// (what src/lib/peaks.ts reads). Also prints a level check: loudest sample, clipped samples and
// silent seconds, so a render where a sound didn't load is caught before it goes online.
// Usage: node scripts/wav-peaks.mjs media/audio/sq-001.wav [media/peaks/sq-001.json]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [src, outArg] = process.argv.slice(2);
if (!src) {
  console.error('usage: node scripts/wav-peaks.mjs <file.wav> [peaks.json]');
  process.exit(1);
}
const out = outArg ?? src.replace(/[/\\]audio[/\\]/, '/peaks/').replace(/\.wav$/i, '.json');

const buf = readFileSync(src);
if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${src}: not a WAV file`);
let fmt = null;
let data = null;
for (let o = 12; o + 8 <= buf.length; ) {
  const id = buf.toString('ascii', o, o + 4);
  const size = buf.readUInt32LE(o + 4);
  if (id === 'fmt ') fmt = { format: buf.readUInt16LE(o + 8), channels: buf.readUInt16LE(o + 10), rate: buf.readUInt32LE(o + 12), bits: buf.readUInt16LE(o + 22) };
  if (id === 'data') data = { start: o + 8, size: Math.min(size, buf.length - o - 8) };
  o += 8 + size + (size % 2);
}
if (!fmt || !data) throw new Error(`${src}: no fmt or data chunk`);
if (fmt.format !== 1 || fmt.bits !== 16) throw new Error(`${src}: only 16-bit PCM is supported (format ${fmt.format}, ${fmt.bits} bit)`);

const frames = Math.floor(data.size / (2 * fmt.channels));
const sample = (f, c) => buf.readInt16LE(data.start + (f * fmt.channels + c) * 2);

// One min/max pair per 512 frames, mixed down to one channel (the site draws one waveform).
const PER = 512;
const peaks = [];
let loudest = 0;
let clipped = 0;
const secondsMax = new Array(Math.ceil(frames / fmt.rate)).fill(0);
for (let f0 = 0; f0 < frames; f0 += PER) {
  let lo = 32767;
  let hi = -32768;
  for (let f = f0; f < Math.min(frames, f0 + PER); f++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const v = sample(f, c);
      if (Math.abs(v) >= 32767) clipped++;
      loudest = Math.max(loudest, Math.abs(v));
      sum += v;
    }
    const m = Math.round(sum / fmt.channels);
    lo = Math.min(lo, m);
    hi = Math.max(hi, m);
    const s = Math.floor(f / fmt.rate);
    secondsMax[s] = Math.max(secondsMax[s], Math.abs(m));
  }
  peaks.push(lo, hi);
}

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ version: 2, channels: 1, sample_rate: fmt.rate, samples_per_pixel: PER, bits: 16, length: peaks.length / 2, data: peaks }));

const silent = secondsMax.map((v, i) => (v < 100 ? i : -1)).filter((i) => i >= 0);
console.log(`${src}: ${(frames / fmt.rate).toFixed(2)} s, ${fmt.channels} ch, ${fmt.rate} Hz`);
console.log(`  loudest ${(20 * Math.log10(loudest / 32768 || 1e-9)).toFixed(1)} dBFS, clipped samples ${clipped}, silent seconds ${silent.length ? silent.join(',') : 'none'}`);
console.log(`  wrote ${out}`);
