// In-page Strudel for the Run buttons (docs/07). Loaded lazily with import() on the first Run,
// so pages that never run code never download Strudel.
//
// This mirrors @strudel/web's initStrudel() and strudel.cc's prebake (website/src/repl/prebake.mjs)
// but is built from the separate packages: the published @strudel/web bundles its own copy of
// @strudel/core, so @strudel/soundfonts (gm_* instruments) would register into a different copy.
import { Pattern, evalScope, setTime } from '@strudel/core';
import { miniAllStrings } from '@strudel/mini';
import { transpiler } from '@strudel/transpiler';
import {
  aliasBank, getAudioContext, initAudio, registerSynthSounds, registerZZFXSounds, samples, soundMap, webaudioRepl,
} from '@strudel/webaudio';

const CDN = 'https://strudel.b-cdn.net';

/** Visual functions draw in the full editor (inline) or over the whole page; here they only pass the pattern on. */
const VISUALS = ['pianoroll', 'punchcard', 'scope', 'spiral', 'spectrum', 'pitchwheel', 'wordfall', 'fscope', 'tscope'];

type Repl = ReturnType<typeof webaudioRepl>;
let ready: Promise<Repl> | null = null;
let booted: Repl | null = null;

/** Current scheduler time in cycles (0 before Strudel has started). */
export const now = (): number => (booted ? booted.scheduler.now() : 0);
let lastError: Error | null = null;

export type EvalInfo = { code: string; pattern: unknown; meta?: { miniLocations?: unknown[] } };
const afterEvalListeners = new Set<(info: EvalInfo) => void>();
const toggleListeners = new Set<(started: boolean) => void>();

/** The guided editor follows evaluations (for highlighting) and start/stop of the scheduler. */
export function subscribe(on: { afterEval?: (info: EvalInfo) => void; toggle?: (started: boolean) => void }) {
  if (on.afterEval) afterEvalListeners.add(on.afterEval);
  if (on.toggle) toggleListeners.add(on.toggle);
  return () => {
    if (on.afterEval) afterEvalListeners.delete(on.afterEval);
    if (on.toggle) toggleListeners.delete(on.toggle);
  };
}

export async function scheduler() {
  return (await boot()).scheduler;
}

async function prebake() {
  await Promise.all([
    registerZZFXSounds(),
    import('./soundfont-loader.mjs').then(({ registerSoundfonts }) => registerSoundfonts()), // no eval of fetched files
    samples(`${CDN}/piano.json`, `${CDN}/piano/`, { prebake: true }),
    samples(`${CDN}/vcsl.json`, `${CDN}/VCSL/`, { prebake: true }),
    samples(`${CDN}/tidal-drum-machines.json`, `${CDN}/tidal-drum-machines/machines/`, { prebake: true, tag: 'drum-machines' }),
    samples(`${CDN}/uzu-drumkit.json`, `${CDN}/uzu-drumkit/`, { prebake: true, tag: 'drum-machines' }),
    samples(`${CDN}/uzu-wavetables.json`, `${CDN}/uzu-wavetables/`, { prebake: true }),
    samples(`${CDN}/mridangam.json`, `${CDN}/mrid/`, { prebake: true, tag: 'drum-machines' }),
    samples(DIRT_SUBSET, `${CDN}/Dirt-Samples/`, { prebake: true }),
  ]);
  aliasBank(`${CDN}/tidal-drum-machines-alias.json`);
}

function boot(): Promise<Repl> {
  ready ??= (async () => {
    miniAllStrings();
    const repl = webaudioRepl({
      transpiler,
      onEvalError: (e: Error) => (lastError = e),
      afterEval: (info: EvalInfo) => afterEvalListeners.forEach((f) => f(info)),
      onToggle: (started: boolean) => toggleListeners.forEach((f) => f(started)),
    });
    setTime(() => repl.scheduler.now());
    await Promise.all([
      evalScope(
        import('@strudel/core'),
        import('@strudel/mini'),
        import('@strudel/tonal'),
        import('@strudel/webaudio'),
        { hush: () => repl.stop() },
      ),
      registerSynthSounds(),
      initAudio(),
      prebake(),
    ]);
    const proto = Pattern.prototype as unknown as Record<string, unknown>;
    for (const name of VISUALS) {
      proto[name] = proto[`_${name}`] = function (this: unknown) { return this; };
    }
    booted = repl;
    return repl;
  })();
  return ready;
}

/** Call inside a click/keypress handler, before any await, so browsers allow sound. */
export function unlockAudio() {
  try { void getAudioContext().resume(); } catch { /* not ready yet */ }
}

/** Evaluate and play. Resolves with the evaluation error, or null when the code plays. */
export async function run(code: string): Promise<Error | null> {
  const repl = await boot();
  unlockAudio();
  lastError = null;
  await repl.evaluate(code, true);
  if (lastError) repl.stop();
  return lastError;
}

export function stop() {
  void ready?.then((r) => r.stop());
}

export const preload = () => void boot();

/** For the course box test: evaluate without playing; count events and list unregistered sounds. */
export async function inspect(code: string, cycles = 4) {
  const repl = await boot();
  lastError = null;
  const pattern = await repl.evaluate(code, false);
  const err = lastError as Error | null; // set by onEvalError during evaluate
  if (err || !pattern) return { error: err?.message ?? 'no pattern', events: 0, missing: [] as string[] };
  const haps = pattern.queryArc(0, cycles) as { value: Record<string, unknown> }[];
  const sounds = soundMap.get() as Record<string, unknown>;
  const missing = new Set<string>();
  for (const { value: v } of haps) {
    if (!v || typeof v !== 'object' || typeof v.s !== 'string') continue;
    const s = v.s.split(':')[0]!;
    const name = typeof v.bank === 'string' ? `${v.bank}_${s}` : s;
    if (!sounds[name.toLowerCase()] && !sounds[name]) missing.add(name);
  }
  return { error: null, events: haps.length, missing: [...missing] };
}

// strudel.cc's extra Dirt-Samples folders (same list as its prebake).
const DIRT_SUBSET = {
  casio: ['casio/high.wav', 'casio/low.wav', 'casio/noise.wav'],
  crow: ['crow/000_crow.wav', 'crow/001_crow2.wav', 'crow/002_crow3.wav', 'crow/003_crow4.wav'],
  insect: ['insect/000_everglades_conehead.wav', 'insect/001_robust_shieldback.wav', 'insect/002_seashore_meadow_katydid.wav'],
  wind: Array.from({ length: 10 }, (_, i) => `wind/00${i}_wind${[1, 10, 2, 3, 4, 5, 6, 7, 8, 9][i]}.wav`),
  jazz: ['jazz/000_BD.wav', 'jazz/001_CB.wav', 'jazz/002_FX.wav', 'jazz/003_HH.wav', 'jazz/004_OH.wav', 'jazz/005_P1.wav', 'jazz/006_P2.wav', 'jazz/007_SN.wav'],
  metal: Array.from({ length: 10 }, (_, i) => `metal/00${i}_${i}.wav`),
  east: ['east/000_nipon_wood_block.wav', 'east/001_ohkawa_mute.wav', 'east/002_ohkawa_open.wav', 'east/003_shime_hi.wav', 'east/004_shime_hi_2.wav', 'east/005_shime_mute.wav', 'east/006_taiko_1.wav', 'east/007_taiko_2.wav', 'east/008_taiko_3.wav'],
  space: ['0', '1', '11', '12', '13', '14', '15', '16', '17', '18', '2', '3', '4', '5', '6', '7', '8', '9'].map((n, i) => `space/${String(i).padStart(3, '0')}_${n}.wav`),
  numbers: Array.from({ length: 9 }, (_, i) => `numbers/${i}.wav`),
  num: Array.from({ length: 21 }, (_, i) => `num/${String(i).padStart(2, '0')}.wav`),
};
