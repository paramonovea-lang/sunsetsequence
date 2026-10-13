# 08 · The course on the site

Source: the owner's 11-part Strudel course, `E:\Tindal\course\site\` (also published as a claude.ai artifact, version 31), copied into `content/course-source/`. The text is kept word for word; only setup-specific parts are rewritten for a public, browser-based course.

## How it works

Lessons are **HTML** (the original plan was MDX): `node scripts/migrate-course.mjs`

- copies each page's sections into `src/content/lessons/<slug>.html` and its lede + on-page links into `meta.json`;
- applies the rewrites below — each asserts that its source text is still there, so a changed course fails loudly instead of leaking `E:\Tindal` paths; it also fails on any leftover `localhost`, `E:\`, `.bat`, `Tindal`;
- rewrites links between pages and checks every `#anchor` exists;
- generates `src/styles/lesson-content.css` from `course.css` (scoped to `.lesson-body`, re-coloured; overrides in `src/styles/lesson-theme.css`).

At build, `src/lib/lessons.ts` turns each codebox into a site code block (Run / Open in Strudel / Copy), turns the h4 note labels into labels and other h4 into h3 (no skipped heading levels), and inserts the "Build … step by step" cards. The course keeps its own authoring format (`<div class="codebox strudel" data-label="…">`, `+ ` new lines, `data-noplay`).

**When the course changes:** copy `E:\Tindal\course\site\*` into `content/course-source/`, run `node scripts/migrate-course.mjs`, then the tests (the course box test plays nothing but checks every Strudel block has events and only known sounds).

## Pages

| Source | Lesson (`/course/<slug>/`) | Notes |
|---|---|---|
| `index.html` | `01-start-here` | Course map dropped (the `/course/` page is the map). "Start the software" replaced by `content/course-overrides/01-run.html` (it keeps the source's numbered heading); "Updating Strudel" goes with it. Night Bus facts moved into "The track", which also plays the finished track. |
| `rhythm.html` | `02-rhythm-and-drums` | Guided sequence **drum-kit** (`content/guided/drum-kit.json`, 5 layers). Drum grid widget. |
| `harmony.html` | `03-notes-and-chords` | Starts with octaves (3.1). Chord explorer widget. |
| `sound.html` | `04-sound-and-effects` | Every effect box has a Command → what it does table; 4.4 is the `gm_gunshot` sound effect. |
| `structure.html` | `05-song-structure` | |
| `visuals.html` | `06-visuals` | Visual functions don't draw inline; those blocks link to strudel.cc. |
| `export.html` | `07-save-export-practice` | Local file path made generic. |
| `commands.html` | `08-command-reference` | Search box filters the tables (`scripts/command-filter.ts`). |
| `reference.html` | `09-sound-bank` | |
| `errors.html` | `10-error-messages` | Troubleshooting made generic. |
| `tracks.html` | `11-example-tracks` | The course's own example tracks only, **never the owner's releases**. Every "How it was made, step by step" becomes a guided sequence (extracted by `src/lib/guided.ts`, named by the section heading above it): hardcore, risefall, colours, sus. Arpeggio keyboard widget. Local file names dropped. |

The course is Strudel-only since v27 (12 Oct 2026); the v26 pages with Tidal are kept in the owner's local course archive.
Sections are numbered part.section (3.2) in the source by the course's `build-nav.js`; the migration copies the numbers as they are.
Counts (course v31): 117 code blocks, 113 runnable Strudel blocks, 3 not runnable, 1 PowerShell block (dropped with "Start the software").

## Guided sequences

`/course/<lesson>/<guide>/`, island `GuidedSteps` (docs/03 "Guided mode", docs/07). Data: `content/guided/*.json` (hand-written) or extracted from part 11, Example tracks (one step per "Step n · …" heading, its code box goes into the editor; a step without code keeps the previous code).

## Widgets (`course.js` → `src/scripts/course-widgets.ts`)

Ported **verbatim** (data arrays and logic unchanged): drum grid `#drumgrid`, arrangement grid `#arr`, arpeggio keyboard `#arp-keyboard`, chord explorer `#chord-explorer-fig`, and the 11 small keyboard pictures in part 3 (`svg.kbd-mini[data-notes]`, play their chord on click/Enter/Space). The keyboards play Strudel's piano samples (`strudel.b-cdn.net/piano/`) with the original tone as a fallback. Other changes: bind on every page load (the site navigates without reloads), timers stop on navigation, making sound pauses the music player.

## Rewrites made for the public site

- Every `E:\Tindal`, `.bat`, `localhost:4321` removed.
- "Start the software": Strudel = nothing to install, Run / Ctrl+Enter / Open in Strudel; no Tidal (the course is Strudel-only).
- "Play in local Strudel" → **Run** + **Open in Strudel ↗**.
- Page footers → "Tested with Strudel 1.3. Course text: CC BY-SA 4.0, code: CC0 1.0 (licences)."
- Code-block labels drop the course's local file names (`(tracks\….strudel.js)`).

## Progress (no account)

`localStorage` key `sq.course.v1 = { visited: [1,2], last: 2, guided: { "drum-kit": 3 } }` (try/catch). The lesson menu keeps each part number and adds a check after a visited part; the step cards add "✓ visited"; the course page shows "Continue where you left off".

## Night Bus (Q7)

The course's example track. Until the owner decides: it stays in the course text only, never on home, catalog or marketing copy, and never gets a catalogue number.
