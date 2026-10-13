// Guided "Split REPL" (docs/03 "Guided mode", reference design/reference/SpecLesson.dc.html):
// step tabs, the step's explanation and a "Listen for" box on the left; a Strudel editor holding
// the step's full code on the right, new lines tinted, the playing words lit, a live step grid.
// The learner's edits are kept per step (in memory) and Reset restores the step's code.
import { useEffect, useRef, useState } from 'preact/hooks';
import { pausePlayer } from '../stores/player';
import { $strudelOwner } from '../stores/strudel';
import type { GuidedEditor } from '../lib/strudel-editor';
import './GuidedSteps.css';

type Row = { label: string; color: string; pattern: string };
export type GuidedStepProps = {
  title: string;
  html: string;
  listen?: string;
  code: string; // plain code, markers stripped
  newLines: number[]; // 1-based lines that are new in this step
  staticHtml: string; // highlighted lines, shown until the editor has loaded
  grid?: Row[];
  codeless?: boolean;
};

interface Props {
  id: string;
  title: string;
  stepWord: string;
  nextLabel: string;
  steps: GuidedStepProps[];
  doneHref: string;
  doneLabel: string;
}

type EditorModule = typeof import('../lib/strudel-editor');
const OWNER = 'guided';

function saveProgress(id: string, reached: number) {
  try {
    const p = JSON.parse(localStorage.getItem('sq.course.v1') ?? '{}');
    p.guided = { ...(p.guided ?? {}), [id]: Math.max(reached, p.guided?.[id] ?? 0) };
    localStorage.setItem('sq.course.v1', JSON.stringify(p));
  } catch { /* storage blocked */ }
}

export default function GuidedSteps({ id, title, stepWord, nextLabel, steps, doneHref, doneLabel }: Props) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: 'error' | 'warn' } | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [edited, setEdited] = useState<Record<number, boolean>>({});
  const [col, setCol] = useState(-1);

  const iRef = useRef(0);
  const playingRef = useRef(false);
  const edits = useRef(new Map<number, string>());
  const host = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const editor = useRef<GuidedEditor | null>(null);
  const mod = useRef<EditorModule | null>(null);
  const loadingEditor = useRef<Promise<GuidedEditor> | null>(null);

  const step = steps[i]!;
  const last = i === steps.length - 1;
  const codeFor = (n: number) => edits.current.get(n) ?? steps[n]!.code;
  const linesFor = (n: number) => (edits.current.has(n) ? [] : steps[n]!.newLines);

  function ensureEditor(): Promise<GuidedEditor> {
    loadingEditor.current ??= import('../lib/strudel-editor').then((m) => {
      mod.current = m;
      editor.current = m.createEditor(host.current!, {
        code: codeFor(iRef.current),
        newLines: linesFor(iRef.current),
        onRun: () => void run(),
        onStop: () => stop(),
        onChange: (code) => {
          const n = iRef.current;
          if (code === steps[n]!.code) return;
          edits.current.set(n, code);
          setEdited((e) => (e[n] ? e : { ...e, [n]: true }));
        },
      });
      setEditorReady(true);
      return editor.current;
    });
    return loadingEditor.current;
  }

  async function run() {
    mod.current?.unlockAudio(); // still inside the click/keypress
    pausePlayer();
    $strudelOwner.set(OWNER);
    setMessage(null);
    setLoading(true);
    try {
      const ed = await ensureEditor();
      const err = await ed.run();
      if (err) {
        setMessage({ text: err.message || String(err), kind: 'error' });
        playingRef.current = false;
        setPlaying(false);
      } else {
        playingRef.current = true;
        setPlaying(true);
      }
    } catch (e) {
      setMessage({ text: `Strudel couldn't start: ${(e as Error).message}`, kind: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    editor.current?.stop();
    playingRef.current = false;
    setPlaying(false);
    if ($strudelOwner.get() === OWNER) $strudelOwner.set(null);
  }

  function go(n: number, focusHeading = true) {
    if (n < 0 || n >= steps.length || n === iRef.current) return;
    iRef.current = n;
    setI(n);
    setMessage(null);
    editor.current?.setDoc(codeFor(n), linesFor(n));
    saveProgress(id, n + 1);
    try { history.replaceState(null, '', `#step-${n + 1}`); } catch { /* ignore */ }
    if (focusHeading) heading.current?.focus();
    if (playingRef.current) void run(); // keep playing: you hear the new layer come in
  }

  function reset() {
    const n = iRef.current;
    edits.current.delete(n);
    setEdited((e) => ({ ...e, [n]: false }));
    editor.current?.setDoc(steps[n]!.code, steps[n]!.newLines);
    if (playingRef.current) void run();
  }

  // Deep link (#step-3), first progress mark. The editor loads on first use (focus, click, Run), so the page stays light.
  useEffect(() => {
    const m = location.hash.match(/^#step-(\d+)$/);
    const n = m ? Math.min(steps.length, Math.max(1, Number(m[1]))) - 1 : 0;
    if (n) {
      iRef.current = n;
      setI(n);
    }
    saveProgress(id, n + 1);
    return () => {
      if (playingRef.current) stop();
      editor.current?.destroy();
    };
  }, []);

  // Someone else (a code block, the music player) took over Strudel.
  useEffect(
    () =>
      $strudelOwner.listen((owner) => {
        if (owner !== OWNER && playingRef.current) {
          editor.current?.release();
          playingRef.current = false;
          setPlaying(false);
        }
      }),
    [],
  );

  // Missing samples and unknown chords are only logged by Strudel.
  useEffect(() => {
    const onLog = (e: Event) => {
      const { message: text, type } = (e as CustomEvent<{ message: string; type?: string }>).detail ?? {};
      if (playingRef.current && typeof text === 'string' && (type === 'error' || /not found|unknown chord/i.test(text))) setMessage({ text, kind: 'warn' });
    };
    document.addEventListener('strudel.log', onLog);
    return () => document.removeEventListener('strudel.log', onLog);
  }, []);

  // New step content: let the page re-check sideways-scrolling tables (src/scripts/scrollable.ts).
  useEffect(() => void window.dispatchEvent(new Event('sq:content')), [i, editorReady]);

  // Light the current 16th in the step grid while playing.
  useEffect(() => {
    if (!playing || !step.grid || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCol(-1);
      return;
    }
    let raf = 0;
    const tick = () => {
      const t = mod.current?.now() ?? 0;
      setCol(Math.floor((((t % 1) + 1) % 1) * 16));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, i]);

  const onTabKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Home' && k !== 'End') return;
    e.preventDefault();
    const n = k === 'Home' ? 0 : k === 'End' ? steps.length - 1 : iRef.current + (k === 'ArrowRight' ? 1 : -1);
    go(Math.max(0, Math.min(steps.length - 1, n)), false);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]')[Math.max(0, Math.min(steps.length - 1, n))]?.focus();
  };

  return (
    <div class="sq-guided">
      <div class="sq-guided__lesson">
        <div role="tablist" aria-label={`${title}: ${stepWord.toLowerCase()}s`} class="sq-guided__tabs" onKeyDown={onTabKey}>
          {steps.map((s, n) => (
            <button
              type="button"
              role="tab"
              id={`sq-tab-${n}`}
              aria-selected={n === i}
              aria-controls="sq-step-panel"
              tabIndex={n === i ? 0 : -1}
              data-state={n === i ? 'current' : n < i ? 'done' : 'ahead'}
              title={s.title}
              onClick={() => go(n, false)}
            >
              {n + 1}
            </button>
          ))}
        </div>

        <div id="sq-step-panel" role="tabpanel" aria-labelledby={`sq-tab-${i}`} class="sq-guided__step">
          <p class="sq-guided__count">{stepWord.toUpperCase()} {i + 1} OF {steps.length}</p>
          <h1 ref={heading} tabIndex={-1}>{step.title}</h1>
          <div class="lesson-body compact" dangerouslySetInnerHTML={{ __html: step.html }} />
          {step.codeless && <p class="sq-guided__hint">This step has no new code: the editor keeps the previous step's code.</p>}
          {step.listen && (
            <div class="sq-guided__listen">
              <p class="sq-guided__label">LISTEN FOR</p>
              <p dangerouslySetInnerHTML={{ __html: step.listen }} />
            </div>
          )}
        </div>

        <div class="sq-guided__nav">
          <button type="button" class="sq-guided__back" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
          {last ? (
            <a class="sq-guided__next" href={doneHref}>{doneLabel}</a>
          ) : (
            <button type="button" class="sq-guided__next" onClick={() => go(i + 1)}>{nextLabel}</button>
          )}
        </div>
      </div>

      <section class="sq-guided__editor" aria-label="Strudel editor">
        <div class="sq-guided__toolbar">
          <span>strudel · runs in your browser</span>
          <span class="sq-guided__actions">
            {edited[i] && <button type="button" class="sq-guided__tool" onClick={reset}>reset</button>}
            <button type="button" class="sq-guided__tool" onClick={stop} disabled={!playing}>stop</button>
            <button type="button" class="sq-guided__run" onClick={() => void run()} data-state={loading ? 'loading' : playing ? 'playing' : 'idle'}>
              <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1l11 6-11 6z" fill="currentColor" /></svg>
              {loading ? 'loading…' : playing ? 'update · Ctrl+Enter' : 'run · Ctrl+Enter'}
            </button>
          </span>
        </div>
        {message && <p class="sq-guided__msg" data-kind={message.kind} role="status">{message.text}</p>}
        <div class="sq-guided__code" onPointerDown={() => void ensureEditor()} onFocusCapture={() => void ensureEditor()}>
          {!editorReady && (
            <pre class="sq-guided__static" tabIndex={0} aria-label={`${step.title}: code`}>
              <code dangerouslySetInnerHTML={{ __html: steps[i]!.staticHtml }} />
            </pre>
          )}
          <div ref={host} class="sq-guided__host" />
        </div>
        {step.grid && (
          <div class="sq-guided__grid" role="img" aria-label={`Step grid of the layers so far: ${step.grid.map((r) => r.label).join(', ')}`}>
            {step.grid.map((r) => (
              <div class="sq-guided__row" aria-hidden="true">
                <span>{r.label}</span>
                <div>
                  {[...r.pattern].map((c, n) => (
                    <i class={n === col ? 'now' : undefined} style={c === 'x' ? { background: r.color } : undefined} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
