# 06 · Architecture

As built (phases 0–5, Oct 2026). Where this differs from the original plan, the reason is noted.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Astro 7** (Vite 8, Node ≥ 22.12; upgraded from 5 on 13 Oct 2026), `output: 'static'`, `trailingSlash: 'always'`, `compressHTML: true` (keeps spaces between inline elements) | Content-first, zero JS by default, View Transitions router (`<ClientRouter />`) for the persistent player. |
| Language | TypeScript (strict) | `npm run check` = `astro check`. |
| Styling | Plain CSS + `design/tokens.css`; scoped `<style>` in `.astro`; global CSS in `src/styles/` | No framework. Fonts self-hosted as WOFF2 (`src/assets/fonts/`). |
| Islands | **Preact**: `DockedPlayer`, `Waveform`, `GuidedSteps` | Play buttons, code-block Run/Copy, catalog switch, widgets are plain scripts with delegated listeners (less JS than one island each). |
| Shared client state | `nanostores` | `stores/player.ts` (music player), `stores/strudel.ts` (who owns the Strudel instance). |
| Content | Tracks: content collection (`src/content.config.ts`, Zod). Lessons: HTML generated from the original course (`scripts/migrate-course.mjs`). | Planned as MDX; HTML keeps the course's own authoring format and avoids escaping 400 KB of HTML (docs/08). |
| Live coding | Own runtime from `@strudel/core`/`mini`/`tonal`/`transpiler`/`webaudio` + `@strudel/codemirror` for the guided editor, lazy-loaded; the `gm_*` list from `@strudel/soundfonts`, loaded by `src/lib/soundfont-loader.mjs` (parses the sound files with `soundfont-data.ts`, never `eval`) | `@strudel/web` bundles its own core, which breaks the `gm_*` soundfonts (docs/07). |
| Waveforms | Peaks precomputed (`node scripts/wav-peaks.mjs` for WAVs rendered in Strudel; `npm run peaks` with audiowaveform for MP3s) → inlined, ≈160 bars | |
| Images | Covers (SVG inline, PNG `/covers/sq-001.png`) and social images (`/og/sq-001.png`) rendered at build with `@resvg/resvg-js` | docs/04. |
| Feeds/SEO | `@astrojs/rss` (`/rss.xml`), `@astrojs/sitemap`, `robots.txt`, Open Graph tags in `Base.astro` | |
| Tests | Vitest (`src/**/*.test.ts`); Playwright in the installed Chrome (`tests/e2e/`); axe; Lighthouse script | See "Checks" below. |
| Hosting | Static files + media on the VPS behind **Caddy** | docs/09. |

## Project structure

```
/
├─ astro.config.mjs              # site URL, preact, sitemap, /media/ in dev
├─ design/                       # tokens, logo, icons, avatar, fonts, approved mockups (from Claude Design)
├─ content/
│  ├─ course-source/             # copy of E:\Tindal\course\site (the course's source of truth)
│  ├─ course-overrides/          # replacement sections for the public site (01-run.html)
│  ├─ guided/drum-kit.json       # hand-written guided sequence
│  └─ examples/                  # spec examples (not built)
├─ .githooks/pre-push            # runs scripts/check-push.mjs before every push
├─ deploy/                       # Caddyfile, headers.json, server-setup.sh, sudoers-claude
├─ public/                       # favicons, manifest, og-default.png, logo-mark.svg, avatar/, robots.txt
├─ scripts/
│  ├─ migrate-course.mjs         # course-source → src/content/lessons + lesson-content.css
│  ├─ dev-audio.mjs              # dev WAV loops + peaks for tracks marked placeholder (none now)
│  ├─ wav-peaks.mjs              # peaks + level check for a WAV rendered in Strudel
│  ├─ peaks.mjs                  # audiowaveform over media/audio/*.mp3
│  ├─ serve.mjs (+ lib/)         # serves dist/ + media/ with the production headers (tests)
│  ├─ deploy.sh                  # build + tar over SSH + atomic swap
│  ├─ check-push.mjs (+ lib/push-check.mjs) # pre-push check: secrets, emails, hosts, audio, big files
│  └─ lighthouse.mjs             # mobile Lighthouse on key pages
├─ src/
│  ├─ content.config.ts  content/tracks/*.md (+ code/*.strudel)  content/lessons/*.html (generated)
│  ├─ lib/        cover, og, tracks, peaks, highlight, codeblock-html, strudel-hash,
│  │              lessons, lesson-source, guided, course, strudel-runtime, strudel-editor,
│  │              soundfont-loader.mjs + soundfont-data (gm_* sounds read as data, no eval)
│  ├─ stores/     player.ts, strudel.ts
│  ├─ islands/    DockedPlayer, Waveform, GuidedSteps (.tsx + .css)
│  ├─ scripts/    codeblocks, course-widgets (port of course.js; keyboards play Strudel's piano samples), course-progress,
│  │              command-filter, scrollable
│  ├─ components/ Header, Footer, Cover, Catalog, SequenceGrid, StepCards, PlayButton, CodeBlock, Avatar, Byline, Email, …
│  ├─ layouts/Base.astro          # head (icons, OG, fonts), header, footer, persisted player
│  ├─ pages/      index, about, licences, 404, rss.xml, tracks/, course/[slug], course/[slug]/[guide],
│  │              covers/[file].png, og/[file].png
│  └─ styles/     global, codeblock, lesson-content (generated), lesson-theme
├─ tests/e2e/     smoke, player, course, guided, sound, a11y
└─ media/                        # gitignored: audio, peaks, stems (synced to the VPS)
```

## The persistent player (most important behaviour)

- `Base.astro` renders `<DockedPlayer client:load transition:persist="player" />` once; navigations keep it and its single `<audio>` alive.
- `stores/player.ts`: `queue` (catalog order), `currentId`, `isPlaying`, `position`, `duration`, and a `command` atom the player executes. Any `[data-play]` button on any page is handled by one delegated listener in the player, which also keeps the buttons' state, the cycle counters and the step strips in sync. An inline script in `Base.astro` keeps a Play click made before the player has loaded.
- Seeks that arrive before the audio's length is known are queued and applied on `loadedmetadata`.
- Hidden until the first play. Media Session: title, artist (`SITE.artist`), `/covers/sq-xxx.png?v=…`; audio URLs also carry `?v=` (a hash of the file, `mediaUrl()` in `src/lib/tracks.ts`); play/pause/prev/next/seek.
- **One sound at a time:** Run (code block) or the guided editor pauses the player; playing a track stops Strudel. Code blocks and the guided editor hand the one Strudel instance to each other through `stores/strudel.ts`.

## Data flow at build

1. Tracks → validate → cover SVG, sequence rows, PNG cover, social image.
2. `media/peaks/*.json` → downsampled bars inlined in the track page (flat bars when missing).
3. `code/*.strudel` → highlighted code + strudel.cc share hash (same format as the course's `toHash`).
4. Lessons: `src/content/lessons/*.html` → codeboxes become code blocks, "build it step by step" cards are inserted, h4 labels fixed (`lib/lessons.ts`); guided sequences from `content/guided/` and part 11 (Example tracks) (`lib/guided.ts`).

## Performance budget (measured on the live site, 13 Oct 2026)

- Home ≈ 19 KB JS gzip before interaction (budget 60 KB). Lighthouse mobile: performance 99–100 on home, track, lesson, guided page (13 Oct, Astro 7).
- Strudel (~600 KB) loads only on the first Run, on hover/focus of a Run button, or on first use of the guided editor.
- Fonts: WOFF2, `font-display: swap`, Schibsted Grotesk + DM Mono 400 preloaded.
- Audio: `preload="none"`, range requests (Caddy; `scripts/serve.mjs` locally).

## Accessibility

Landmarks; player `role="region" aria-label="Player"`; tablists for Covers/Tracklist and guided steps (arrow keys); sequence grids `role="img"` with labels; play buttons "Play [title] (SQ-00x)"/"Pause"; seek `input type="range"` with `aria-valuetext`; visible focus; reduced motion stops step animations; sideways-scrolling tables get a tab stop (`scripts/scrollable.ts`); no skipped heading levels. axe (WCAG 2.1 AA) runs in `tests/e2e/a11y.spec.ts`; Lighthouse accessibility 100.

## Checks

```
npm run check                 # types
npm test                      # unit: cover, og, highlighter, peaks, Caddyfile ↔ headers.json, push-check, soundfont-data
npx playwright test           # browser tests, desktop 1440 + phone 360, production headers
npm run lighthouse            # live site, mobile (LH_LOGIN_FILE only if a password is put back)
npm run check-push            # before a push: what the pre-push hook checks
```
The course box test (`tests/e2e/course.spec.ts`) and `tests/e2e/sound.spec.ts` (really plays effects and `gm_*` sounds) need internet: samples load from Strudel's hosts.
