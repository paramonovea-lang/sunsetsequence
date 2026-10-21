# 01 · Product brief

## One line

A home for Egor P.'s music written in code, where every track can be heard, read and opened in an editor, and a free course teaches visitors to write music the same way.

## Who it's for

1. **Listeners** — want to press play fast, browse releases, follow new ones. Most will never read code.
2. **Curious makers** — producers and coders who want to see how a track is built and tweak it.
3. **Learners** — beginners taking the free course; they need a working editor in the browser and no setup.

## Goals for v1

- Play any track within one click from the home page; audio keeps playing while browsing.
- Every track has a "specimen sheet": cover, player, data (key, tempo, form, chords, engine, drum machine), 16-step sequence, full code, how it was made.
- The full 11-part Strudel course is on the site, free, English only, running Strudel in the browser with nothing to install.
- Fast, accessible, works on a phone.

## Non-goals for v1 (later phases)

- Accounts, comments, user remixes saved on the server.
- Live code checks, AI lab partner, jam mode, live-stream from the VPS (explored in design rounds 3–6; parked).
- Selling music on-site (link out to Bandcamp/Spotify instead).
- Translations.

## Brand

- **Name:** **Sunset Sequence** — domain **sunsetsequence.com**. Wordmark "SUNSET SEQUENCE". Sunset Sequence is the site/label; the author is **Egor P.** (Q1, answered 12 Oct 2026).
- **Tagline:** "The sunset is the sequence." Hero line: "Every track has a sequence."
- **Idea:** music as sequenced code. Tracks are *specimens* with catalogue numbers `SQ-001…`. Each track's sunset cover is drawn from its own sequence. Never use the prefix "SS-".
- **Voice:** plain, confident, specific. Short sentences. No hype words. Lab vocabulary used lightly ("specimen", "protocol", "lab notes"), never so much it gets in the way.

## Sitemap (v1)

```
/                       Home: hero specimen, catalog (Covers | Tracklist), how covers work, course, about
/tracks/                Full catalog (same component as home, all tracks)
/tracks/[slug]/         Specimen sheet (track page)
/course/                Course overview: 11 parts ("the protocol")
/course/[slug]/         Lesson pages (long-form, Run on every example)
/course/[slug]/[guide]/ Guided "Split REPL" pages (drum kit, part 11 "how it was made")
/about/                 Artist, contact, links
/licences/              Licence policy for visitors
/privacy/               What the site records (Google Analytics, with consent) and the visitor's choice
/rss.xml                Releases feed
/sitemap-index.xml      Sitemap (+ robots.txt)
/covers/sq-xxx.png      1000×1000 covers;  /og/sq-xxx.png  1200×630 social images
/404
```

## Success measures (owner can check without accounts)

- Plays per visit, course step completion. Google Analytics 4 since 21 Oct 2026 (Q9), only for visitors who allow it: page views + a `track_play` event.
- Course: % of visitors who reach Step 03.
- Lighthouse ≥ 95 performance/accessibility on home and a track page (mobile). Measured 12 Oct 2026 on the live site: performance 97–100, accessibility 100 (`npm run lighthouse`).
