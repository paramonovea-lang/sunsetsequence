// Dev-only audio for placeholder tracks (docs/10 Phase 2): renders 16 bars of the track's own
// 16-step sequence (kick, clap, hats, open hat, bass) at its BPM to media/audio/<file>.wav, and
// writes waveform peaks in audiowaveform's JSON format to media/peaks/<file>.json.
// Real releases use MP3s from the owner + scripts/peaks.mjs instead.
// Usage: node scripts/dev-audio.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tracksDir = path.join(root, 'src/content/tracks');
const SR = 22050;
const BARS = 16;

const field = (fm, name) => fm.match(new RegExp(`^\\s*${name}:\\s*"?([^"\\n#]+?)"?\\s*(#.*)?$`, 'm'))?.[1]?.trim();

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
}

function render(bpm, seq) {
  const stepSec = 60 / bpm / 4;
  const total = Math.ceil(BARS * 16 * stepSec * SR);
  const out = new Float32Array(total);
  const noise = rng(bpm * 7919);
  const add = (start, len, fn) => {
    for (let i = 0; i < len && start + i < total; i++) out[start + i] += fn(i / SR);
  };
  for (let bar = 0; bar < BARS; bar++) {
    for (let step = 0; step < 16; step++) {
      const t0 = Math.round((bar * 16 + step) * stepSec * SR);
      const on = (p) => p?.[step] === 'x';
      if (on(seq.kick)) {
        let phase = 0;
        add(t0, SR * 0.35, (t) => {
          phase += (2 * Math.PI * (48 + 110 * Math.exp(-t * 28))) / SR;
          return 0.9 * Math.sin(phase) * Math.exp(-t * 9);
        });
      }
      if (on(seq.clap)) add(t0, SR * 0.2, (t) => 0.35 * noise() * Math.exp(-t * 22) * (t < 0.02 ? 0.6 + 0.4 * Math.sin(t * 900) : 1));
      if (on(seq.hats)) {
        let prev = 0;
        add(t0, SR * 0.05, (t) => { const n = noise(); const hp = n - prev; prev = n; return 0.09 * hp * Math.exp(-t * 70); });
      }
      if (on(seq.openHat)) {
        let prev = 0;
        add(t0, SR * 0.22, (t) => { const n = noise(); const hp = n - prev; prev = n; return 0.08 * hp * Math.exp(-t * 14); });
      }
      if (on(seq.bass)) {
        const f = 55 * 2 ** ((bar % 4 === 3 ? -2 : 0) / 12);
        add(t0, SR * 0.25, (t) => 0.28 * (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t)) * Math.exp(-t * 7));
      }
    }
  }
  const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const gain = 0.7 / peak;
  for (let i = 0; i < total; i++) out[i] *= gain;
  return out;
}

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return buf;
}

/** Same shape as `audiowaveform -o x.json --pixels-per-second 10 -b 8`. */
function peaks(samples) {
  const spp = SR / 10;
  const data = [];
  for (let i = 0; i < samples.length; i += spp) {
    let lo = 0, hi = 0;
    for (let j = i; j < Math.min(i + spp, samples.length); j++) { lo = Math.min(lo, samples[j]); hi = Math.max(hi, samples[j]); }
    data.push(Math.round(lo * 127), Math.round(hi * 127));
  }
  return { version: 2, channels: 1, sample_rate: SR, samples_per_pixel: spp, bits: 8, length: data.length / 2, data };
}

mkdirSync(path.join(root, 'media/audio'), { recursive: true });
mkdirSync(path.join(root, 'media/peaks'), { recursive: true });
for (const f of readdirSync(tracksDir).filter((f) => f.endsWith('.md'))) {
  const fm = readFileSync(path.join(tracksDir, f), 'utf8').split(/^---$/m)[1] ?? '';
  if (field(fm, 'placeholder') !== 'true') continue;
  const bpm = Number(field(fm, 'bpm'));
  const seq = Object.fromEntries(['kick', 'clap', 'hats', 'openHat', 'bass'].map((k) => [k, field(fm, k)]));
  const audio = field(fm, 'mp3');
  const peaksPath = field(fm, 'peaks');
  if (!audio?.endsWith('.wav') || !peaksPath) {
    console.warn(`${f}: audio.mp3 must point to a .wav for dev audio, skipped`);
    continue;
  }
  const samples = render(bpm, seq);
  writeFileSync(path.join(root, audio.replace(/^\//, '')), wav(samples));
  writeFileSync(path.join(root, peaksPath.replace(/^\//, '')), JSON.stringify(peaks(samples)));
  console.log(`${f}: ${(samples.length / SR).toFixed(1)} s at ${bpm} BPM → ${audio}`);
}
