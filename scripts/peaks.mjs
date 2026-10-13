// Waveform peaks for real releases: runs BBC audiowaveform over media/audio/*.mp3 → media/peaks/*.json
// (docs/09). Needs `audiowaveform` on PATH (or set AUDIOWAVEFORM to its full path).
// Usage: node scripts/peaks.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = path.join(root, 'media/audio');
const peaksDir = path.join(root, 'media/peaks');
const bin = process.env.AUDIOWAVEFORM ?? 'audiowaveform';

if (!existsSync(audioDir)) {
  console.log('No media/audio folder yet. Put the release MP3s there first.');
  process.exit(0);
}
mkdirSync(peaksDir, { recursive: true });
for (const f of readdirSync(audioDir).filter((f) => f.endsWith('.mp3'))) {
  const out = path.join(peaksDir, f.replace(/\.mp3$/, '.json'));
  try {
    execFileSync(bin, ['-i', path.join(audioDir, f), '-o', out, '--pixels-per-second', '10', '-b', '8'], { stdio: 'inherit' });
    console.log(`${f} → ${path.relative(root, out)}`);
  } catch (e) {
    console.error(`audiowaveform failed for ${f}. Is it installed? (${e.message})`);
    process.exit(1);
  }
}
