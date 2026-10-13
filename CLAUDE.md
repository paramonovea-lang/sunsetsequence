# CLAUDE.md — sunsetsequence.com

Music site + free live-coding course. Read `README.md`, then the doc you need from `docs/`. The approved designs are in `design/reference/` (canvas exports, not runnable — rebuild them).

## Ground rules

- **Stack:** Astro 7 (static output; Node ≥ 22.12 to build) + TypeScript + plain CSS with the tokens in `design/tokens.css`. Small interactive islands only (player, waveform, Split REPL); the view toggle, code-block Run and course widgets are plain scripts. No CSS framework, no UI kit. See `docs/06-architecture.md`.
- **Match the design.** Colours, type, 2px ink borders, square corners and spacing come from `docs/02-design-system.md`. Don't introduce rounded cards, gradients, shadows or new colours. Don't use emoji as icons; use inline stroke SVG.
- **Music never stops on navigation.** The docked player must persist across page changes (Astro `<ClientRouter />` + `transition:persist`). Treat any full page reload that kills audio as a bug.
- **Strudel loads on demand.** Never ship the Strudel bundle on pages that don't need it, and never start an AudioContext without a user gesture. See `docs/07-strudel-integration.md`.
- **Content lives in files,** not in components: tracks in `src/content/tracks/*.md` (Zod schema, `docs/05-content-model.md`); lessons in `src/content/lessons/*.html`, generated from the original course by `scripts/migrate-course.mjs` (never edit them by hand, see `docs/08`); guided sequences in `content/guided/*.json` or extracted from part 11 (Example tracks).
- **Covers are generated** from track data at build time (`docs/04-cover-generator.md`). Never hand-place cover art.
- **Placeholders stay visible.** Missing facts render as `[LIKE THIS]` until the owner supplies them (none are left on the live pages; the release template `content/examples/sq-001.example.md` still uses them). Never invent track titles, stats, quotes or credits.
- **Releases and the course are separate.** The owner's releases live only on the catalog/track pages (audio and code All rights reserved). Never copy a release's code or audio into a lesson, including part 11; a track page may link to lessons, not the other way round with release material. The course text is CC BY-SA 4.0; its code (code boxes, guided steps, its own example tracks) is CC0 1.0. The policy for visitors is on `/licences` (`src/pages/licences.astro`); keep it, `LICENSING.md` and `SITE.licenses` in step.
- **Do not use "Night Bus"** (the course's example track) anywhere in the site's marketing pages. Inside the migrated course it stays only until the owner decides (open question Q7).
- **Accessibility:** WCAG 2.1 AA, real `<button>`/`<a>`, visible focus, 44px touch targets, `prefers-reduced-motion` respected, every page usable at 360px wide.
- **Infrastructure:** the site lives on **sunsetsequence.com**. Only touch the site's own VPS and the `@` / `www` DNS records of sunsetsequence.com. Any other server, domain or DNS record is out of scope: never change it, even if you can reach it.

## Commands

```
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run check      # astro check + type check
npm run test       # unit tests (cover, og, highlighter, peaks, Caddyfile headers, push-check, soundfont-data)
npx playwright test  # browser tests in the installed Chrome (smoke, player, course, guided, sound, a11y; course and sound need internet)
npm run serve      # serve dist/ + media/ like Caddy does, http://127.0.0.1:4330
npm run dev-audio  # dev WAV loops + peaks for tracks marked placeholder: true (none now; Playwright still calls it)
npm run peaks      # peaks for real MP3s in media/audio (needs audiowaveform)
node scripts/wav-peaks.mjs media/audio/sq-001.wav  # peaks + level check for a WAV rendered in Strudel (no tools needed)
npm run deploy     # build + upload site and media to the VPS (tar over SSH, see docs/09)
npm run lighthouse # mobile Lighthouse on the live site (LH_LOGIN_FILE only if the preview password is ever put back)
node scripts/migrate-course.mjs  # course-source → src/content/lessons (after a course update)
npm run check-push # what the pre-push hook checks, for the commits origin doesn't have yet
```

## Working style

- Status and remaining work: `docs/10-roadmap-and-acceptance.md`. Every change ends with the checks passing; deploy with `npm run deploy` only when they do.
- Never paste the preview password (a login file in the owner's home folder, `sunsetsequence-preview-login.txt`; `SQ_LOGIN_FILE` can point `check-push` elsewhere) into chat or git.
- When a doc and a reference mockup disagree, the doc wins; note the conflict in your summary.
- Ask the owner before anything that costs money, publishes publicly, or changes DNS.
- **GitHub** (`origin` = https://github.com/paramonovea-lang/sunsetsequence): **public** since the launch on 13 Oct 2026 and must stay public while the site is live (AGPL: the footer "Source" link and `/licences` point to it). Commit locally as usual, but push only when the owner asks, in batches. GitHub usage is limited: no GitHub Actions, no per-commit pushes. Every push runs `.githooks/pre-push` (`git config core.hooksPath .githooks`, set once per clone): it blocks secrets, the preview password, email addresses other than the noreply one, hosts not on the allowlist in `scripts/lib/push-check.mjs`, audio, bundles and files over 2 MB. Run `npm run check-push` before asking to push; never bypass it with `--no-verify`; add a host to the allowlist only on purpose. Licences per folder: `LICENSING.md` (the logo stays all rights reserved).
