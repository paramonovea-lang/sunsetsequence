// Behaviour for every .codeblock on every page (one set of delegated listeners, set up once).
// Run loads Strudel on demand; only one block plays at a time; starting Strudel pauses the music
// player and playing a track stops Strudel (docs/06, docs/07).
import { $isPlaying, pausePlayer } from '../stores/player';
import { $strudelOwner } from '../stores/strudel';

type Runtime = typeof import('../lib/strudel-runtime');
let runtime: Runtime | null = null;
let loading: Promise<Runtime> | null = null;
let active: HTMLElement | null = null;

const loadRuntime = () => (loading ??= import('../lib/strudel-runtime').then((m) => (runtime = m)));
// Used by the browser tests (tests/e2e/course.spec.ts) to reach the lazily loaded runtime.
(window as unknown as { __sqStrudel: typeof loadRuntime }).__sqStrudel = loadRuntime;

function setState(box: HTMLElement, state: 'idle' | 'loading' | 'playing') {
  const btn = box.querySelector<HTMLElement>('[data-act="run"]');
  if (!btn) return;
  btn.dataset.state = state;
  btn.querySelector('.cb-run-label')!.textContent = state === 'playing' ? 'Stop' : state === 'loading' ? 'Loading…' : 'Run';
  if (state === 'playing') box.dataset.playing = '';
  else delete box.dataset.playing;
}

function message(box: HTMLElement, text: string | null, kind: 'error' | 'warn' = 'error') {
  const p = box.querySelector<HTMLElement>('.cb-msg');
  if (!p) return;
  p.hidden = !text;
  p.textContent = text ?? '';
  p.dataset.kind = kind;
}

function stop() {
  runtime?.stop();
  if (active) setState(active, 'idle');
  active = null;
  if ($strudelOwner.get() === 'codeblock') $strudelOwner.set(null);
}

async function run(box: HTMLElement) {
  runtime?.unlockAudio(); // still inside the user's click/keypress
  pausePlayer();
  $strudelOwner.set('codeblock');
  if (active && active !== box) setState(active, 'idle');
  active = box;
  message(box, null);
  setState(box, 'loading');
  try {
    const rt = runtime ?? (await loadRuntime());
    if (active !== box) return;
    const err = await rt.run(box.dataset.code ?? '');
    if (active !== box) return;
    if (err) {
      message(box, err.message || String(err));
      setState(box, 'idle');
      active = null;
    } else setState(box, 'playing');
  } catch (e) {
    message(box, `Strudel couldn't start: ${(e as Error).message}`);
    setState(box, 'idle');
    if (active === box) active = null;
  }
}

const boxOf = (t: EventTarget | null | undefined) => (t as Element | null)?.closest?.<HTMLElement>('.codeblock') ?? null;

document.addEventListener('click', async (e) => {
  const btn = (e.target as Element | null)?.closest?.<HTMLElement>('.codeblock [data-act]');
  const box = boxOf(btn);
  if (!btn || !box) return;
  if (btn.dataset.act === 'run') {
    if (active === box) stop();
    else void run(box);
  } else if (btn.dataset.act === 'copy') {
    try {
      await navigator.clipboard.writeText(box.dataset.code ?? '');
      btn.textContent = 'copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(box.querySelector('code')!);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      btn.textContent = 'press Ctrl+C';
    }
    setTimeout(() => (btn.textContent = 'copy'), 1600);
  }
});

// Ctrl/Cmd+Enter runs the focused block, Ctrl/Cmd+. stops it.
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const box = boxOf(e.target);
  if (!box?.hasAttribute('data-runnable')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    void run(box);
  } else if (e.key === '.') {
    e.preventDefault();
    stop();
  }
});

// Start downloading Strudel when a Run button is about to be used.
const warm = (e: Event) => {
  if ((e.target as Element | null)?.closest?.('.cb-run, .codeblock[data-runnable] pre')) void loadRuntime();
};
document.addEventListener('pointerover', warm, { passive: true });
document.addEventListener('focusin', warm);

// Missing samples and unknown chord names don't throw; Strudel only logs them.
document.addEventListener('strudel.log', (e) => {
  const { message: text, type } = (e as CustomEvent<{ message: string; type?: string }>).detail ?? {};
  if (active && typeof text === 'string' && (type === 'error' || /not found|unknown chord/i.test(text))) message(active, text, 'warn');
});

// A track starts: any Strudel (code block or guided editor) stops.
$isPlaying.listen((playing) => {
  if (!playing) return;
  stop();
  runtime?.stop();
  $strudelOwner.set(null);
});
// The guided editor took over the Strudel instance: this block is no longer playing.
$strudelOwner.listen((owner) => {
  if (owner !== 'codeblock' && active) {
    setState(active, 'idle');
    active = null;
  }
});
document.addEventListener('astro:before-swap', stop);
