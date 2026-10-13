// The guided editor: Strudel's CodeMirror setup (@strudel/codemirror initEditor: Strudel syntax,
// Ctrl+Enter / Ctrl+.), plus new-line tinting for the current step and live highlighting of the
// words that are playing, driven by the shared runtime's scheduler (docs/07 "Editor").
// Loaded lazily, together with the runtime, only on guided pages.
import { highlightMiniLocations, initEditor, updateMiniLocations } from '@strudel/codemirror';
import { Drawer } from '@strudel/draw';
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import * as runtime from './strudel-runtime';

const setNewLines = StateEffect.define<number[]>();

const newLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setNewLines)) continue;
      const b = new RangeSetBuilder<Decoration>();
      for (const n of e.value) {
        if (n >= 1 && n <= tr.state.doc.lines) {
          const line = tr.state.doc.line(n);
          b.add(line.from, line.from, Decoration.line({ class: 'cm-new-line' }));
        }
      }
      deco = b.finish();
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

type Hap = { isActive: (t: number) => boolean };

export type GuidedEditor = {
  setDoc: (code: string, newLines: number[]) => void;
  getDoc: () => string;
  focus: () => void;
  /** Evaluate this editor's code; resolves with the error or null. */
  run: () => Promise<Error | null>;
  stop: () => void;
  /** Another part of the page took over Strudel: stop highlighting without stopping the sound. */
  release: () => void;
  destroy: () => void;
};

export function createEditor(
  root: HTMLElement,
  opts: { code: string; newLines: number[]; onRun: () => void; onStop: () => void; onChange: (code: string) => void },
): GuidedEditor {
  const view: EditorView = initEditor({
    root,
    initialCode: opts.code,
    onChange: (u: ViewUpdate) => u.docChanged && opts.onChange(u.state.doc.toString()),
    onEvaluate: opts.onRun,
    onStop: opts.onStop,
  });
  view.dispatch({
    effects: StateEffect.appendConfig.of([
      newLineField,
      EditorView.contentAttributes.of({ 'aria-label': 'Strudel code editor. Ctrl+Enter runs the code, Ctrl+. stops it.' }),
    ]),
  });
  view.dispatch({ effects: setNewLines.of(opts.newLines) });

  let mine = false; // is the shared runtime playing this editor's code?
  const drawer = new Drawer((haps: Hap[], time: number) => {
    if (mine) highlightMiniLocations(view, time, haps.filter((h) => h.isActive(time)));
  }, [0, 0]);

  const unsubscribe = runtime.subscribe({
    afterEval: async (info) => {
      if (!mine) return;
      updateMiniLocations(view, info.meta?.miniLocations ?? []);
      drawer.invalidate(await runtime.scheduler());
    },
    toggle: async (started) => {
      if (started && mine) drawer.start(await runtime.scheduler());
      if (!started) {
        drawer.stop();
        updateMiniLocations(view, []);
        mine = false;
      }
    },
  });

  return {
    setDoc(code, newLines) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
      view.dispatch({ effects: setNewLines.of(newLines) });
    },
    getDoc: () => view.state.doc.toString(),
    focus: () => view.focus(),
    async run() {
      mine = true;
      const err = await runtime.run(view.state.doc.toString());
      if (err) mine = false;
      else drawer.start(await runtime.scheduler());
      return err;
    },
    stop() {
      mine = false;
      drawer.stop();
      updateMiniLocations(view, []);
      runtime.stop();
    },
    release() {
      mine = false;
      drawer.stop();
      updateMiniLocations(view, []);
    },
    destroy() {
      unsubscribe();
      drawer.stop();
      view.destroy();
    },
  };
}

export const { unlockAudio, now } = runtime;
