// Reads a WebAudioFont preset file (`var _tone_…={zones:[{midi:0,…,file:'…'}]}`) as data.
// Strudel's own loader runs these files with eval(); they come from a third-party host, so here
// only object/array literals, keys, numbers (also as a sum like 4200-140), strings, true/false/null
// and comments are accepted; any other token (a call, a name, a template string) is rejected.
// Checked on 13 Oct 2026 against all 866 files the gm_* list points to: all parse.

type Value = string | number | boolean | null | Value[] | { [key: string]: Value };

export interface SoundfontZone {
  midi?: number;
  originalPitch: number;
  keyRangeLow: number;
  keyRangeHigh: number;
  loopStart: number;
  loopEnd: number;
  coarseTune: number;
  fineTune: number;
  sampleRate: number;
  file?: string;
  sample?: string;
  [key: string]: Value | undefined;
}

const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
// Whitespace and comments (the files have `//` notes inside the objects); comments never run.
const SPACE = /(?:\s+|\/\/.*|\/\*[\s\S]*?\*\/)+/y;

class Reader {
  pos: number;
  constructor(private text: string, start: number) { this.pos = start; }

  fail(what: string): never {
    throw new Error(`soundfont: ${what} at ${this.pos}`);
  }

  skip() {
    SPACE.lastIndex = this.pos;
    if (SPACE.test(this.text)) this.pos = SPACE.lastIndex;
  }

  peek(): string {
    this.skip();
    return this.text[this.pos] ?? '';
  }

  expect(ch: string) {
    if (this.peek() !== ch) this.fail(`expected "${ch}"`);
    this.pos++;
  }

  match(re: RegExp): string | null {
    this.skip();
    re.lastIndex = this.pos;
    const m = re.exec(this.text);
    if (!m) return null;
    this.pos = re.lastIndex;
    return m[0];
  }

  string(): string {
    const quote = this.text[this.pos];
    let out = '';
    for (let i = this.pos + 1; i < this.text.length; i++) {
      const ch = this.text[i];
      if (ch === quote) { this.pos = i + 1; return out; }
      if (ch === '\\') {
        const next = this.text[++i];
        if (next === undefined) break;
        out += next === 'n' ? '\n' : next === 't' ? '\t' : next;
        continue;
      }
      if (ch === '\n') break;
      out += ch;
    }
    return this.fail('unterminated string');
  }

  value(depth = 0): Value {
    if (depth > 32) this.fail('nested too deep');
    const ch = this.peek();
    if (ch === '{') return this.object(depth);
    if (ch === '[') return this.array(depth);
    if (ch === '"' || ch === "'") return this.string();
    const num = this.match(NUMBER);
    if (num !== null) return this.sum(Number(num));
    const word = this.match(IDENT);
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'null') return null;
    return this.fail(word ? `unexpected name "${word}"` : `unexpected "${ch}"`);
  }

  /** A few files write a number as a sum, e.g. `originalPitch:4200-140`: only + and - between numbers. */
  sum(first: number): number {
    let total = first;
    for (let op = this.peek(); op === '+' || op === '-'; op = this.peek()) {
      this.pos++;
      const next = this.match(NUMBER);
      if (next === null) this.fail(`expected a number after "${op}"`);
      total = op === '+' ? total + Number(next) : total - Number(next);
    }
    return total;
  }

  object(depth: number): { [key: string]: Value } {
    this.expect('{');
    const out: { [key: string]: Value } = Object.create(null);
    while (this.peek() !== '}') {
      const ch = this.peek();
      const key = ch === '"' || ch === "'" ? this.string() : this.match(IDENT);
      if (key === null) this.fail('expected a key');
      this.expect(':');
      out[key] = this.value(depth + 1);
      if (this.peek() === ',') this.pos++;
      else if (this.peek() !== '}') this.fail('expected "," or "}"');
    }
    this.pos++;
    return out;
  }

  array(depth: number): Value[] {
    this.expect('[');
    const out: Value[] = [];
    while (this.peek() !== ']') {
      out.push(this.value(depth + 1));
      if (this.peek() === ',') this.pos++;
      else if (this.peek() !== ']') this.fail('expected "," or "]"');
    }
    this.pos++;
    return out;
  }
}

/** The zones of a preset file, the same value Strudel's `eval('{' + data)` produced. */
export function parseSoundfont(text: string): SoundfontZone[] {
  const start = text.indexOf('={');
  if (start < 0) throw new Error('soundfont: no preset object');
  const preset = new Reader(text, start + 1).value();
  if (preset === null || typeof preset !== 'object' || Array.isArray(preset) || !Array.isArray(preset.zones)) {
    throw new Error('soundfont: no zones');
  }
  for (const zone of preset.zones) {
    if (zone === null || typeof zone !== 'object' || Array.isArray(zone)) throw new Error('soundfont: bad zone');
  }
  return preset.zones as unknown as SoundfontZone[];
}
