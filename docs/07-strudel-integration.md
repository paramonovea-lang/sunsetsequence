# 07 · Strudel in the page

Strudel is a JavaScript port of TidalCycles that runs entirely in the browser (Web Audio). The server only serves files, so it fits a static site. TidalCycles itself cannot play to visitors (it needs SuperCollider on the listener's machine); the course is Strudel-only, so everything in it plays in the browser.

> Verify APIs against the Strudel source before changing this code — Strudel changes often. The owner keeps a checkout at `E:\Tindal\strudel`. Installed versions (Oct 2026): `@strudel/core` 1.2.6, `webaudio`/`soundfonts`/`codemirror` 1.3.0.

## Licence (decided, Q4)

Strudel is **AGPL-3.0-or-later**, and the site bundles `@strudel/*`, so the site's source is offered under **AGPL-3.0-or-later**: public repo, "Source" link in the footer (`SITE.sourceRepo` in `src/site.ts`, = https://github.com/paramonovea-lang/sunsetsequence; public since the launch on 13 Oct 2026 and must stay public while the site is live; push only when the owner asks, docs/12).

## The runtime (`src/lib/strudel-runtime.ts`)

- Built from the separate packages `@strudel/core`, `mini`, `tonal`, `transpiler`, `webaudio`, `soundfonts` (one shared `@strudel/core`). It mirrors `@strudel/web`'s `initStrudel()` and strudel.cc's prebake (`website/src/repl/prebake.mjs`: piano, VCSL, tidal-drum-machines + aliases, uzu kits, mridangam, a Dirt-Samples subset, GM soundfonts, ZZFX). **`@strudel/web` is not used**: its published bundle carries its own copy of core, so the `gm_*` soundfonts would register into a copy it never reads.
- The `gm_*` soundfonts are loaded by `src/lib/soundfont-loader.mjs`, a copy of `@strudel/soundfonts` 1.3.0's `fontloader.mjs` that reads the preset files with `src/lib/soundfont-data.ts` instead of `eval` (the files come from a third-party host). Checked against all 866 files on 13 Oct 2026. Re-copy it when `@strudel/soundfonts` is updated. `tests/e2e/sound.spec.ts` checks that effects and `gm_*` sounds really play.
- Loaded with `import()` on the first Run (or hover/focus of a Run button, or first use of the guided editor). `initAudio()` is called on the first Run, so a keyboard Ctrl+Enter works too (`initAudioOnFirstClick` waits for a later mouse press).
- Visual functions (`.pianoroll()`, `._scope()`, …) are no-ops inline (they need the full editor or draw over the whole page); blocks that use them say so and link to strudel.cc.
- Evaluation errors come back from `run()`; missing samples and unknown chord names are only logged by Strudel (`strudel.log` events) and are shown as a warning under the block.
- `inspect(code)` (tests only) evaluates without playing and reports events and unregistered sounds; `tests/e2e/course.spec.ts` runs it on every course block.

## Two integration levels

1. **Run buttons on code blocks** (lessons, track pages): markup from `lib/codeblock-html.ts`, behaviour in `scripts/codeblocks.ts` (delegated). Run/Stop, Ctrl/Cmd+Enter and Ctrl/Cmd+. while the code has focus, Copy, "Open in Strudel ↗" (`https://strudel.cc/#<base64(utf8(code))>`, the full editor with WAV export). One block at a time.
2. **Guided editor** (`/course/<lesson>/<guide>/`, island `GuidedSteps`): `lib/strudel-editor.ts` uses `initEditor` from `@strudel/codemirror` on the same runtime; the playing words are lit with `highlightMiniLocations` + a `Drawer` from `@strudel/draw`; new lines are a CodeMirror line decoration; per-step edits kept, Reset restores. Strudel's editor theme writes `--background`, `--caret`, … on `:root` and adds a `dark` class to `<html>`; the site doesn't use those names.

`stores/strudel.ts` (`$strudelOwner`) lets code blocks and the guided editor hand the one Strudel instance to each other; starting either pauses the music player, playing a track stops Strudel.

## Sounds / samples

The course uses `.bank("RolandTR909")`/`"RolandTR808"`, `gm_*` instruments, synths, the `jazz` kit and Dirt-Samples names, all loaded from Strudel's own hosts (`strudel.b-cdn.net`, `felixroos.github.io`) exactly like strudel.cc (Q11 default). The course keyboards (chord explorer, arpeggio keyboard, keyboard pictures in part 3) fetch Strudel's piano samples from `strudel.b-cdn.net/piano/` themselves, with a synth fallback (`src/scripts/course-widgets.ts`); they never load Strudel. Possible later hardening: self-host the packs the course uses under `/samples/` (check each pack's licence first), then tighten `connect-src`/`media-src`.

## Security headers

One Content-Security-Policy for every page (`deploy/headers.json` = `deploy/Caddyfile`, also sent by `scripts/serve.mjs` so the browser tests run under it). Per-page policies don't work here: the site navigates without reloads, so the first page's policy stays for the whole visit. Strudel needs `'unsafe-eval'`, `'wasm-unsafe-eval'`, `data:` in `script-src` (its effects AudioWorklet is a `data:` URL; without it notes using coarse, crush, shape, distort, supersaw … don't play), `worker-src blob:`, `connect-src https:`; Astro inlines small scripts (`'unsafe-inline'`). Fonts and styles are self-hosted (`font-src 'self'`). Also sent: HSTS, nosniff, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy `same-origin`.

## Behaviour rules

- Never autoplay. First sound always follows a click/keypress.
- Starting Strudel pauses the docked music player; playing a track stops Strudel.
- Show the error under the code block / editor toolbar.
- Keyboard: Ctrl/Cmd+Enter = run, Ctrl/Cmd+. = stop, while focus is in the editor or code block.
