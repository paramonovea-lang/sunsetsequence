// Guided "Split REPL" sequences (docs/03 "Guided mode", docs/10 Phase 4):
// - drum-kit: content/guided/drum-kit.json (the approved SpecLesson sequence)
// - part 11: every "How it was made, step by step" section, extracted from the lesson HTML,
//   one step per "Step n · …" heading, its code box going into the editor.
import drumKit from '../../content/guided/drum-kit.json';
import { CODEBOX, decode, rawLesson } from './lesson-source';

export type GridRow = { label: string; color: string; pattern: string };
export type GuidedStep = { title: string; html: string; listen?: string; code: string; grid?: GridRow[]; codeless?: boolean };
export type Guide = {
  id: string;
  lesson: string; // lesson slug
  anchor: string; // id in the lesson where the "build it step by step" card goes
  title: string;
  stepWord: string; // "Layer" or "Step"
  nextLabel: string;
  steps: GuidedStep[];
};

function drumKitGuide(): Guide {
  const rows = drumKit.rows as Record<string, GridRow>;
  return {
    ...drumKit,
    steps: drumKit.steps.map((s) => ({ ...s, grid: s.grid.map((k) => rows[k]!) })),
  };
}

const H3 = /<h3([^>]*)>([\s\S]*?)<\/h3>/g;
const H2 = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
const text = (html: string) => decode(html).replace(/\s+/g, ' ').trim();

/** Example tracks: one guide per <h3 id="…-howto">, named by the section heading above it. */
function exampleTrackGuides(): Guide[] {
  const slug = '11-example-tracks';
  const html = rawLesson(slug);
  const heads = [...html.matchAll(H3)].map((m) => ({
    start: m.index!,
    end: m.index! + m[0].length,
    id: m[1]!.match(/id="([^"]+)"/)?.[1],
    text: text(m[2]!),
  }));
  const titles = [...html.matchAll(H2)].map((m) => ({
    start: m.index!,
    text: text(m[1]!.replace(/<span class="num">[^<]*<\/span>/, '').replace(/<[^>]+>/g, '')),
  }));
  const guides: Guide[] = [];
  heads.forEach((h, i) => {
    if (!h.id?.endsWith('-howto')) return;
    // The track's name: the section heading ("11.2 Hardcore") above this one.
    const named = titles.filter((t) => t.start < h.start).pop();
    const title = (named?.text.split(':')[0] ?? h.id).trim();
    const steps: GuidedStep[] = [];
    let lastCode = '';
    for (let j = i + 1; j < heads.length; j++) {
      const m = heads[j]!.text.match(/^Step \d+ · (.+)$/);
      if (!m) break;
      const body = html.slice(heads[j]!.end, heads[j + 1]?.start ?? html.length);
      const box = [...body.matchAll(CODEBOX)][0];
      const code = box ? decode(box[3]!) : lastCode.replace(/^\+ /gm, '');
      if (box) lastCode = code;
      steps.push({ title: m[1]!, html: box ? body.replace(box[0], '') : body, code, codeless: !box });
    }
    if (steps.length) {
      guides.push({
        id: h.id.replace(/-howto$/, ''),
        lesson: slug,
        anchor: h.id,
        title,
        stepWord: 'Step',
        nextLabel: 'Next step →',
        steps,
      });
    }
  });
  return guides;
}

let cache: Guide[] | null = null;
export function allGuides(): Guide[] {
  cache ??= [drumKitGuide(), ...exampleTrackGuides()];
  return cache;
}

export const guideHref = (g: Guide) => `/course/${g.lesson}/${g.id}/`;
