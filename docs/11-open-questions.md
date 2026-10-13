# 11 · Open questions (owner decides)

Until answered, the build uses the placeholder shown. Claude Code: never guess these.

| # | Question | Placeholder / default until answered |
|---|---|---|
| Q1 | Artist name — is it "Sunset Sequence", or a different name with Sunset Sequence as the label/site? | **Answered 12 Oct 2026:** author **Egor P.**; Sunset Sequence is the site/label (wordmark "SUNSET SEQUENCE"). Bio and contact in `src/site.ts`. |
| Q2 | Tracks at launch: titles, styles, BPM, key, length, release dates, the `.strudel` code, final MP3s, stems? | **Answered 12 Oct 2026:** SQ-001 Hope (piano house, 124 BPM, C major) and SQ-002 Quarrel (cinematic downtempo, 84 BPM, A minor), both released 12 Oct; audio = WAV rendered from the code in Strudel. No stems. |
| Q3 | Licences: audio, code, course text? | **Answered 12 Oct, changed 13 Oct 2026:** the owner's releases (catalog tracks, separate from the course), code **and** audio: **All rights reserved** (the owner plans to sell them). Course text **CC BY-SA 4.0**; course code (code boxes, guided steps, the course's example tracks incl. Night Bus) **CC0 1.0**. Policy page `/licences`, folder map `LICENSING.md`. (Until 13 Oct the release code was planned under a NonCommercial licence; no longer used.) Check the sample packs each release uses before selling it. |
| Q4 | Site source licence: OK to publish the repo under AGPL-3.0? | **Answered 12 Oct 2026: yes.** Site code AGPL-3.0-or-later, public repo, "Source" link in the footer. Repo: https://github.com/paramonovea-lang/sunsetsequence (`origin` and `SITE.sourceRepo` set). Public since the launch (13 Oct 2026) and must stay public while the site is live; push only when the owner asks, in batches. |
| Q5 | Media hosting: on the VPS (simple, uses VPS bandwidth) or a free CDN? | **Answered (default kept):** VPS `/media/`; switch with `PUBLIC_MEDIA_BASE`. |
| Q6 | VPS and DNS | **Answered 12 Oct 2026.** VPS and domain at hoster.kz (DNS there too). Ubuntu 22.04 (the host offers no newer image), deploy user `claude` (docs/09). A records for `@` and `www` set; AAAA (IPv6) optional, not set yet. |
| Q7 | The course's example track "Night Bus": keep it, rename it, or replace it with another course example (never a release — releases stay out of the course)? | Keep in course text only; never on marketing pages |
| Q8 | Newsletter provider (Buttondown, self-hosted Listmonk, none for now)? | **Answered 12 Oct 2026:** no newsletter for now; the form is removed. Followers use RSS (`/rss.xml`). |
| Q9 | Analytics: none, or privacy-friendly (self-hosted Umami/Plausible)? | None |
| Q10 | Links: Bandcamp, Spotify, SoundCloud, GitHub, contact email, social? | **Answered 12 Oct 2026:** GitHub only (https://github.com/paramonovea-lang) + footer "Source"; contact = "Write to me →" mailto (address assembled in the browser, never shown). No Bandcamp/SoundCloud/Spotify; a release shows Bandcamp only if it has a link. |
| Q11 | Self-host Strudel sample packs (check each pack's licence) or keep Strudel's default remote samples? | **Answered (default):** Strudel's own remote samples. |
| Q12 | Tidal install guide: Windows only (your setup) or Windows + macOS + Linux? | **Withdrawn:** the course is Strudel-only (v27+), so there is no Tidal install guide. |
| Q13 | Mastering credit and other credits per track? | Field hidden when empty |
| Q14 | Bio text and photo for About? | **Answered 12 Oct 2026:** bio = `SITE.about`; avatar "The path" (`design/avatar/`) instead of a photo. |
| Q16 | Also register sunsetsequence.net / .fm (both free on 12 Oct 2026) as redirects? | Not registered |
| Q17 | Launch: when to remove the preview password (`/etc/caddy/auth.caddy`, docs/09)? | **Answered 13 Oct 2026: launched.** The GitHub repo was made public first, then `/etc/caddy/auth.caddy` was emptied (its preview content is kept on the server as `auth.caddy.preview-backup-2026-10-13`; to protect the site again, copy it back and reload Caddy). |
| Q18 | Ubuntu 22.04 support ends April 2027: in-place upgrade to 24.04, or free Ubuntu Pro (updates to 2032)? | Decide before early 2027 |
| Q19 | GitHub repo for visitors: turn on Discussions; fill the About box (description, https://sunsetsequence.com, topics such as strudel, live-coding, music, course)? | Backlog (owner, 13 Oct 2026). Issues are on. |

(Q15 was withdrawn: other domains are out of scope.)

**Decided:** brand and domain = Sunset Sequence / sunsetsequence.com (registered 12 Oct 2026); catalogue prefix = `SQ-`.
