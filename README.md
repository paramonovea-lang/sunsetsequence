# sunsetsequence.com

A music site for **Egor P.**: original electronic tracks written in code (Strudel / TidalCycles), plus a **free, English-only live-coding course**. Brand and domain: **Sunset Sequence** — **sunsetsequence.com** (registered by the owner, 12 Oct 2026). Catalogue numbers: **SQ-001, SQ-002 …** (never "SS-").

The design direction is **"Specimen × Sunset"**: every track is a catalogued *specimen* (SQ-001, SQ-002 …) with its full code sequence, and its cover is a sunset **generated from that sequence**.

## What is in this folder

| Path | What it is |
|---|---|
| `CLAUDE.md` | Instructions for Claude Code working in this repo. Read first. |
| `prompts/kickoff.md` | The prompt to resume work in a new Claude Code session. |
| `docs/01-product-brief.md` | Goals, audience, scope, what is in and out of v1. |
| `docs/02-design-system.md` | Colours, type, spacing, borders, components' visual rules. |
| `docs/03-pages-and-components.md` | Every page and component, section by section, with behaviour. |
| `docs/04-cover-generator.md` | The algorithm that draws each track's sunset cover from its code. |
| `docs/05-content-model.md` | Track and lesson schemas (frontmatter), file layout, examples. |
| `docs/06-architecture.md` | Stack, project structure, the persistent player, data flow. |
| `docs/07-strudel-integration.md` | Running Strudel in the page: editor, Run buttons, samples, licensing. |
| `docs/08-course-migration.md` | How the 11-part course becomes site lessons (migration script, rewrites, guided sequences). |
| `docs/09-deployment-vps.md` | Rented VPS: server setup, Caddy, DNS, media hosting, deploy. |
| `docs/10-roadmap-and-acceptance.md` | Phases, tasks, and the checks that define "done". |
| `docs/11-open-questions.md` | Decisions only the owner can make. Placeholders until answered. |
| `docs/12-start-checklist.md` | Owner checklist: what runs where, open decisions, releases, publishing the repo, course updates. |
| `design/tokens.css`, `design/tokens.json` | Design tokens, ready to import. |
| `design/logo/` | Final logo, outlined: mark A (cover mark), wordmark D (horizon wordmark), horizontal lockup, favicons (incl. pixel-snapped 16/32) — light and dark. Live-text sources in `source/`. |
| `design/icons/` | Ready PNG set: `favicon.ico` (16/32/48), favicon PNGs, `apple-touch-icon.png` (180), PWA icons 192/512 (+ maskable), 1024 px marks, wordmark and horizontal PNGs, `og-default.png` (1200×630 social preview), `site.webmanifest`, `head-snippet.html`. Copied into `public/`. |
| `design/avatar/` | The author's avatar "The path" (light/dark SVG masters; PNGs for profiles in `public/avatar/`) and its handoff note: where it goes, circle crop, the bio text. |
| `design/fonts/` | Schibsted Grotesk (variable) and DM Mono (400, 500) + OFL licences; served as WOFF2 from `src/assets/fonts/`. |
| `design/reference/*.dc.html` | The approved mockups (see "About the reference files" below). |
| `content/course-source/` | Copy of the original course (source of truth: `E:\Tindal\course\site`), input of `scripts/migrate-course.mjs`. |
| `content/examples/` | Example release file (template for new releases) and the original MDX lesson example. |
| `content/guided/`, `content/course-overrides/` | Hand-written guided sequence (drum kit) and replacement course sections. |
| `src/`, `scripts/`, `deploy/`, `tests/` | The site, build/deploy scripts, server config, browser tests (docs/06). |

## Pushing to GitHub

After cloning, turn on the repository's pre-push check once:

```
git config core.hooksPath .githooks
```

Every `git push` then runs `scripts/check-push.mjs`, which stops the push if a new commit contains a
key, a token or the preview password; an author, committer or email address other than the GitHub
noreply one; a host that isn't on the allowlist in `scripts/lib/push-check.mjs`; an audio file, a git
bundle, an `.env` or key file; or a file over 2 MB. `npm run check-push` runs the same check by hand.

## Licences

The site code is AGPL-3.0-or-later (`LICENSE`). The course text is CC BY-SA 4.0 and the course code
(code boxes, guided steps, the course's example tracks) CC0 1.0. The releases (code and audio) and the
name, logo and icons are **all rights reserved** (forks must replace the logo and name). Which folder
uses which licence, and why: [`LICENSING.md`](LICENSING.md); for visitors: https://sunsetsequence.com/licences/.

## About the reference files

`design/reference/` holds the approved designs exported from the design canvas:

- **`SpecHome.dc.html`** — final home page (catalog with Covers / Tracklist switch, docked player).
- **`SpecTrack.dc.html`** — final track page ("Specimen sheet").
- **`SpecLesson.dc.html`** — final lesson page ("Split REPL", guided steps).
- `LessonDocs.dc.html` — long-form lesson layout, used for reference-style parts (8–10: command reference, sound bank, error messages) and long sections.
- `Home.dc.html`, `TrackSheet.dc.html`, `LessonRepl.dc.html` — the Round 2 originals the finals were derived from.

They are **design references, not runnable code**: they use a canvas runtime (`support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `{{holes}}`) that does not exist in the real site. Read them for layout, sizes, colours, copy and behaviour (the `renderVals()` script at the bottom shows the data and interactions). Rebuild them properly in the chosen stack. Live canvas: https://claude.ai/artifact/S117SkgDww4FXUq9Ro7wmC (page "Specimen — final"; the owner may need to share it).

## Status

Launched on 13 Oct 2026: https://sunsetsequence.com and this repository are public (docs/10 "Status").
Still to do: Firefox/Safari/phone check. Owner decisions: docs/11 (Ubuntu path before April 2027, Q18;
GitHub Discussions and About box, Q19).
