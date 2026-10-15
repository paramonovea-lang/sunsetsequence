# 03 · Pages and components

References: `design/reference/SpecHome.dc.html`, `SpecTrack.dc.html`, `SpecLesson.dc.html`, `LessonDocs.dc.html`. Sizes below are desktop; every layout must reflow to one column at ≤ 760px.

## Global

### Header
Horizontal logo: mark A (36px, `design/logo/logo-mark.svg`) + "SUNSET SEQUENCE" (800, 19px, letter-spacing 0.06em); links home, `aria-label="Sunset Sequence, home"` · nav: Catalog, Free course, About · primary-outline CTA "Start the course" (ink fill, ground text). 2px ink bottom rule. On phone: wordmark + menu button opening a full-width sheet.

### Docked player (persistent)
Sticky bottom bar, ink background, 2px accent top rule. Contents: 46px cover thumbnail · title + `SQ-00x · playing/paused` (mono 12px) · previous / play-pause (48px circle, ground fill) / next · progress (elapsed, 4px bar with accent fill, total; clickable/draggable seek, keyboard ←/→ ±5s) · "Sheet" link · "Code ↗" link. Hidden until the first play. Must survive page navigation (see `06-architecture.md`). Media Session API: title, artist, artwork (cover PNG), next/prev handlers.

### Footer
Horizon stripes band → ink footer: `sunsetsequence.com` · links: GitHub (the author's profile) and Source (mono 13px). Owner, 12 Oct 2026: no Bandcamp or SoundCloud. Second line (12px): the licence summary from `SITE.licenses` + "Licences →" (`/licences/`), and "Live coding by Strudel and TidalCycles".

## Home `/`

1. **Hero** (2 columns, 56px gap, stacks on phone)
   - Left: mono eyebrow "Catalog of sequenced music · free course"; H1 "Every track has a sequence."; lede (20px, ink-2); buttons: **Play the latest release** (primary, sends latest track to the player) · "Free course →" (secondary).
   - Right: **Latest-release specimen card** — header strip `SPECIMEN SQ-00x · latest release`; body split: cover (square, left) | title, meta `[style] · [bpm] BPM · [key]`, 4-row mini sequence (kick, clap, hats, bass), links "Specimen sheet →" (plus Bandcamp / SoundCloud only if a release has them in `links`); bottom strip: Play button, 16-cell step progress, `cycle n / total`.
2. **Horizon stripes divider.**
3. **Catalog** (ink section)
   - H2 "The catalog" + **view switch** (tablist: Covers | Tracklist, ground fill = selected) + style filter chips (All, [Style…], With lesson). Filters are client-side.
   - **Covers view:** grid `repeat(auto-fill, minmax(280px, 1fr))`, gap 32/20. Card = square cover with `SQ-00x` badge (+ "liner notes" badge if the track has them), title (21px/700), meta (mono), length. Whole card links to the track page; a play button appears on hover/focus. Tracks with `status: upcoming` come first as **coming soon** cards: the same card with a "coming soon" badge instead of "+ liner notes" and "soon" instead of the length, no link, no play button.
   - **Tracklist view:** table — No., cover thumb + title, style, tempo, key, length, play button (sends to player), "Sheet" link; an upcoming track shows "soon" as its length and "coming soon" in place of play + Sheet. Horizontally scrollable under 760px.
   - The selected view is remembered in `localStorage` (try/catch).
4. **How the covers work** — H2 "The sunset is the sequence." + 4-cell definition grid: Sun height = tempo · Water stripes = kick pattern · Colours = key · Catalog number = release order.
5. **Course teaser** (paper section) — eyebrow "The course · free · 11 parts · nothing to install"; H2 "Sequence your first track."; 11 step cards (STEP 0n, small sunrise icon whose sun rises per step, title, one-line description) linking to lessons; CTA "Start step 01, free →".
6. **About** (sand section, big accent sun cropped at right) — "Producer · author of the course", avatar (96px circle, `design/avatar/`) next to the artist name (Egor P.), the author's short bio; a link to the RSS feed of new releases (no newsletter, Q8).
7. Footer + docked player.

## Track page `/tracks/[slug]/` — "Specimen sheet"

1. Breadcrumb `Catalog / SQ-00x` (mono).
2. **Top** (2 columns): left — large cover in 2px ink frame with `SPECIMEN SQ-00x` badge. Right — eyebrow `[release date] · [style]`; H1 title; **player panel** (paper, 2px border): 64px play/pause (synced with the docked player), waveform from precomputed peaks (played part in accent), `elapsed · cycle n/total · total`; buttons: "Open the code in Strudel ↗" (primary), "Play it live from the code ↓", "How it was made" (Bandcamp only if the release has a link); **data grid**: Key, Tempo, Form, Chords, Engine, Drums.
3. **The sequence** (paper band): 6-row × 16-step grid with step numbers (kick, clap, closed hat, open hat, bass, chords). The current step is outlined while the track plays (not with reduced motion).
4. **Lab notes**: "How it was made" markdown body (left) + learn-the-techniques box linking related lessons; **code block** (right): filename, Copy, the full `.strudel` code, "Open in Strudel ↗".
5. **More from the catalog**: 4 covers.
6. Docked player.

## Course overview `/course/`

Header (H1 "Sequence your first track.", lede, facts: free · 11 parts · runs in the browser), 11 step cards as on home but larger (visited parts show "✓ visited") and a "Continue where you left off" button if `localStorage` has progress. (Skills chips: not built; lessons have no skills data.)

## Lesson pages

A lesson is a long-form page `/course/[slug]/`; each guided sequence is its own page
`/course/[slug]/[guide]/`, reached from a "Build … step by step" card in the lesson (docs/08).

### Guided mode `/course/[slug]/[guide]/` (reference: `SpecLesson.dc.html`)
- Under the site header: `Step 02 · Rhythm and drums · The drum kit` (mono) and "← Back to the lesson".
- **Left column (lesson):** step tabs (1…n; done = accent fill, current = ink fill, ahead = paper); `LAYER n OF m`; H1 step title; explanation; "Listen for" sand box; Back / "Add the next layer →" buttons.
- **Right column (editor, dark):** toolbar "strudel · runs in your browser", stop, **run · Ctrl+Enter**; the editor holding that step's full code, lines new in this step highlighted (green-tinted background + accent left border); live step grid of the layers so far under it.
- Changing step replaces the editor content with that step's code (the learner's edits are kept per step in memory and can be reset); if it was playing, the new step plays at once. `#step-n` deep links. The editor loads on first use; until then the step's code is shown highlighted.
- Part 11 steps carry the course's full explanation (lists, command tables) on the left; the editor column stays in view (sticky) on desktop. One column on phones.

### Long-form mode `/course/[slug]/` (reference: `LessonDocs.dc.html`)
- Left sticky course menu (11 parts; current part expanded with its numbered section anchors; visited parts keep their number and get a check after the title).
- Header: 150px sunrise cover, `STEP 02 OF 11`, H1, lede, one progress cell per part; on-page chips.
- Main column ≤ 820px: section headings with mono part.section numbers (`3.2`), prose, **code blocks with Copy + Run** (Run plays inline in a shared Strudel instance and marks the block as playing; another Run stops the first), "Listen for" / "Try changing" boxes, tables, step-grid figures and the course's widgets (drum grid, arrangement grid, chord explorer, arpeggio keyboard, and the 11 small keyboard pictures in part 3, which play their chord on click; the keyboards play Strudel's piano samples).
- Part 8 (Command reference) has a search box that filters the command tables.
- Pager: previous / next part.

Only part 2 (drum-kit) and part 11 (hardcore, risefall, colours, sus) have guided sequences.

## About `/about/`
Paper card: the author's avatar "The path" (160px circle, `design/avatar/HANDOFF.md`), name, role, bio (`SITE.about`), a "Write to me →" mailto link (the address is assembled in the browser and never shown or written out in the page source, `components/Email.astro`) and GitHub. `Person` JSON-LD with the 1024px avatar. The course index and every lesson end with a byline: 48px avatar + "Written by Egor P.: music in code, and the course to write your own." (`components/Byline.astro`).

## Licences `/licences/`
The licence policy in plain words (`src/pages/licences.astro`): one card per part (releases, course text, course code, site code, name and logo, fonts) with what a visitor may do, why, and links to the official licence texts. Keep it in step with `LICENSING.md` and `SITE.licenses`. Linked from the footer, track pages and lesson pages.

## 404
Small sunset with the sun below the horizon, "This specimen isn't in the catalog." + links home and to the course.

## Component inventory (as built)

Static (`src/components/`): `Header`, `Footer`, `HorizonStripes`, `Cover`, `Catalog` (Covers/Tracklist switch + filters), `SequenceGrid` (rows × 16, optional live step), `StepCards` (sunrise icons), `PlayButton` (handled by the player), `CodeBlock`, `ExtLink`, `Avatar`, `Byline` (course "Written by"), `Email` ("Write to me →") (placeholder-aware links).
Islands (`src/islands/`): `DockedPlayer` (persisted), `Waveform`, `GuidedSteps` (with the CodeMirror editor, lazy).
Scripts (`src/scripts/`): code blocks, course widgets, progress, command filter, scrollable regions.
No newsletter (Q8, owner 12 Oct 2026: removed; releases are followed through RSS at `/rss.xml`).
