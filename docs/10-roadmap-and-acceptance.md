# 10 · Roadmap and acceptance

Build in this order. Each phase ends with its checks passing and a short summary to the owner.

## Status (13 Oct 2026)

| Phase | Status |
|---|---|
| 0 Scaffold | Done |
| 1 Catalog and covers | Done (placeholders replaced 12 Oct by SQ-001 Hope and SQ-002 Quarrel) |
| 2 Player | Done (audio = WAVs rendered in Strudel, Q2) |
| 3 Course | Done — lessons are generated HTML, not MDX; own Strudel runtime, not `@strudel/web`; widgets as scripts (docs/07, 08) |
| 4 Guided Split REPL | Done — guided sequences on their own pages: drum-kit + 4 from part 11 |
| 5 Polish | Done except optional self-hosted samples (no newsletter: Q8) |
| 6 Launch | **Launched 13 Oct 2026**: https://sunsetsequence.com is public (password removed), the GitHub repo is public. Security audit before launch (owner's local notes). Left: Firefox/Safari/phone check. Astro 7 + Vitest 5 upgrade done 13 Oct (npm audit: 0 vulnerabilities; all 23 pages render the same text and tags as before) |

Checks: `npm run check`, `npm test`, `npx playwright test` (Chrome, 1440 + 360 px, production headers), `npm run lighthouse` (live site), `npm run check-push` (before a push).

## Phase 0 — Scaffold
- Astro + TS strict + Preact + nanostores; `design/tokens.css` imported globally; fonts.
- `Base.astro` with header, footer, horizon stripes, `<ClientRouter />`, empty persisted player slot.
- Vitest + Playwright set up; `npm run check` clean.
- Git repo, `.gitignore` (dist, media, public/og, …).

**Done when:** `npm run dev` shows an empty styled shell at 360px and 1440px; lint/type/test pass.

## Phase 1 — Catalog and covers
- Content collections + schemas (`05`); 3 placeholder tracks in `src/content/tracks/` built from `content/examples/` (titles `[Track title]`, clearly marked; replaced on 12 Oct by the real releases SQ-001 and SQ-002).
- `lib/cover.ts` + tests (`04`); `Cover` component; PNG/OG build script.
- Home page sections 1–6 static (`03`); `/tracks/` page; Covers/Tracklist switch (works without JS: both rendered, switch hides one; JS remembers choice).
- Track page sections 1–5 static, sequence grid, code block (copy works).

**Done when:** pages match the reference mockups side by side; covers change correctly when `bpm`, `key` or `sequence.kick` change; all links work; axe shows 0 serious issues.

## Phase 2 — Player
- `stores/player.ts`, `DockedPlayer` (persisted), `PlayButton`s everywhere, `Waveform` from peaks, seek, prev/next through the catalog, Media Session.
- `scripts/peaks.mjs`; dev audio: `npm run dev-audio` (WAV loops of each placeholder's sequence).

**Done when (Playwright):** play on home → navigate to a track page → to a lesson → audio element is the same and still playing; track page play button reflects the docked player; keyboard can play/pause/seek; reduced motion respected.

## Phase 3 — Course (long-form)
- Lessons 01–11 migrated per `08` (text, tables, figures, widgets).
- `CodeBlock` with Copy, Run (lazy Strudel runtime), Open in Strudel. (Planned: MDX fence plugin + `@strudel/web`; as built: see 07/08.)
- Course overview page, course menu, pager, local progress.

**Done when:** every Strudel block in the course runs inline and sounds like strudel.cc; no `E:\Tindal`/`localhost` strings remain (checked by `scripts/migrate-course.mjs`, which fails on leftovers); the Strudel bundle is absent from home and catalog network logs until a Run.

## Phase 4 — Guided Split REPL
- `GuidedSteps` island with the editor (`07`); Part 2 "drum-kit" first, then the Part 11 "how it was made" sequences.
- Per-step edits kept, Reset, step tabs, new-line highlighting, live step grid.

**Done when:** a learner can go through all 5 drum-kit steps with Ctrl+Enter/Ctrl+. on keyboard only; switching steps never leaves two patterns playing; music player pauses when Strudel starts.

## Phase 5 — Polish
- Phone layouts for all pages (menu sheet, stacked hero, scrollable tracklist/code).
- RSS, sitemap, OG images (per-track generated; `design/icons/og-default.png` as fallback), favicons + manifest from `design/icons/` (`head-snippet.html`), 404, About page, no newsletter (Q8): RSS link "Follow new releases (RSS) →" on home.
- Optional: self-hosted samples (`07`), current-step highlight in sequence grids.
- Lighthouse mobile ≥ 95 performance / 100 accessibility on home, a track page, a lesson page.

## Phase 6 — Launch
- VPS set up per `09`; deploy script; staging was the real domain behind a password (`/etc/caddy/auth.caddy`) until the launch.
- Owner content confirmed (Q1–Q3 answered 12 Oct); launched 13 Oct 2026 (Q17).

**Done when:** https://sunsetsequence.com serves the site with valid TLS; `www` redirects; one full listen + one lesson Run tested on desktop Chrome/Firefox/Safari and a phone.

## Later (parked from design rounds 3–6)
Live code checks in lessons, AI lab partner, jam mode, user "versions/mutations" of tracks, weekly live stream from the VPS (Tidal → Icecast), past-stream archive.
