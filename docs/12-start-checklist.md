# 12 · Owner checklist

What the owner provides or decides, and what runs where. Updated 13 Oct 2026. Details: `09` (server),
`10` (status), `11` (questions).

## What runs where

- **Visitors' browsers:** Strudel (bundled into the site from npm, loaded on demand), the music player,
  the guided editor. Sounds come from Strudel's own hosts, like strudel.cc.
- **The VPS:** only files — Caddy serves the built site and `media/` (release audio, currently WAVs, and peaks). No Node, no Strudel
  server, no SuperCollider.
- **The owner's PC:** TidalCycles + SuperCollider (not used by the site; the course is Strudel-only),
  rendering releases to WAV/MP3, building and deploying (`npm run deploy`).

## Server and domain (done)

VPS and domain at hoster.kz, Ubuntu 22.04, deploy user `claude` (narrowed sudo, `deploy/sudoers-claude`;
updates and reboots need the owner as root), firewall 22/80/443, fail2ban, Caddy with automatic HTTPS.
Launched 13 Oct 2026 (preview password removed). Optional: AAAA records for IPv6.
Before April 2027: Ubuntu upgrade or free Ubuntu Pro (Q18).

## Owner decisions still open

- **Content:** Q13 credits (the mastering field stays hidden while empty).
- **Course:** Q7 Night Bus.
- **Services:** Q9 analytics (none by default) · Q16 extra domains.
- **Server:** Q18 Ubuntu path (before April 2027).
- **GitHub:** Q19 Discussions and About box (backlog).
- **Still to test:** Firefox, Safari, a phone.

Answered: Q1 author Egor P., Q2 SQ-001 Hope / SQ-002 Quarrel, Q3 licences, Q4 AGPL + repo, Q5 media on
the VPS, Q6 VPS/DNS, Q8 no newsletter (RSS), Q10 GitHub only + mailto, Q11 Strudel's own samples,
Q14 bio + avatar, Q17 launched 13 Oct 2026. Q12 withdrawn (no Tidal in the course).

## The tracks in `E:\Tindal\tracks\`

night-bus (the course's example track, Q7), hardcore, rise-and-fall, bach-prelude-c, pachelbel-canon,
chord-colours, extensions-etude, open-road are
**course examples** (part 11 and lessons): code CC0 1.0, course text CC BY-SA 4.0. Releases are separate: each new release is a file
`src/content/tracks/sq-00n.md` + `code/sq-00n.strudel` + `media/audio/sq-00n.wav` (or `.mp3`) (template:
`content/examples/sq-001.example.md`). Never put a release into the course.

## For each new release

- Render the track in Strudel ("Export to WAV", cycles 0 to the form length). A 320 kbps MP3 is optional:
  it needs **ffmpeg**, and its peaks need **audiowaveform** (`npm run peaks`); neither is installed.
- Check the sample packs the track uses allow selling it (audio is All rights reserved; the samples
  have their own licences).
- Done (12 Oct): the placeholder tracks are gone; SQ-001 Hope and SQ-002 Quarrel are the first
  releases. Their audio is a WAV rendered from the code with Strudel's export tab (cycles 0 to the
  form length, "Multi Channel Orbits" off), copied to `media/audio/sq-00n.wav`, then
  `node scripts/wav-peaks.mjs media/audio/sq-00n.wav`. New code arrives in `MyTracks/` (git-ignored).

## Publishing the repo (AGPL)

- 13 Oct: the repo https://github.com/paramonovea-lang/sunsetsequence is **public** (launch day; it was
  public for a few hours earlier, then private until the launch). It must stay public while the site is
  live (AGPL: the footer "Source" link and `/licences` link to it). Issues are on;
  `origin` points to it and `SITE.sourceRepo` is set (footer "Source" link). Push only when the owner
  asks, in batches (GitHub usage is limited), and add no GitHub Actions.
- Done: `LICENSING.md` says which folder uses which licence; the logo and icons stay all rights reserved.
- Done (13 Oct): the history was restarted as one root commit that already has the 13 Oct licences
  (releases all rights reserved, course code CC0), checked before the push (no secrets, no other
  servers or domains, only the noreply email). Later pushes are checked by the pre-push hook below.
- Commits use the GitHub noreply address: repo git config, and since 13 Oct a global rule for every
  GitHub repo on the owner's PC (`~/.gitconfig` `includeIf "hasconfig:remote.*.url:https://github.com/**"`
  → `~/.gitconfig-github`). "Keep my email addresses private" and "Block command line pushes that
  expose my email" are on (owner, 13 Oct).
- Every push runs the pre-push check (`.githooks/pre-push` → `scripts/check-push.mjs`, rules in
  `scripts/lib/push-check.mjs`, tests in `src/lib/push-check.test.ts`). Enable it per clone with
  `git config core.hooksPath .githooks`; `npm run check-push` runs it by hand.
- The repo must never name other servers or domains of the owner (out of scope).

## Course updates

The course's source of truth is `E:\Tindal\course\site\` (also the claude.ai artifact). To update the
site: copy it into `content/course-source/`, run `node scripts/migrate-course.mjs`, run the tests, deploy.
