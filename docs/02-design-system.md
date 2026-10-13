# 02 · Design system — "Specimen × Sunset"

Light lab-paper look, heavy ink rules, square corners, one hot accent. Tokens live in `design/tokens.css` (CSS custom properties) and `design/tokens.json`.

## Colour

| Token | Hex | Use |
|---|---|---|
| `--ground` | `#ECEEE8` | Page background |
| `--paper` | `#F8F9F5` | Cards, panels, specimen sheet |
| `--ink` | `#13201B` | Text, 2px rules, dark sections (catalog, footer, player) |
| `--ink-2` | `#33403A` | Body copy on light, lines on dark |
| `--muted` | `#4E5A54` | Secondary text on light (≥ 4.5:1 on ground) |
| `--muted-on-ink` | `#B5BDB7` | Secondary text on ink |
| `--line` | `#C9CFC7` | Hairlines on light |
| `--cell-off` | `#E0E4DC` | Empty sequence step |
| `--accent` | `#F0562A` | Primary buttons (with ink text), active states, played progress |
| `--accent-text` | `#B23A16` | Accent-coloured **text** on light (orange text fails contrast; use this) |
| `--teal` | `#0E6B5B` | Hats in sequences, positive states |
| `--sand` | `#F1E7D4` | Sunset sky, "try changing" boxes, about section |
| `--sun-yellow` | `#F2C94C` | Cover palette |
| `--sea-blue` | `#2D5B6E` | Cover palette |
| `--mint` | `#D8E3DD` | Cover palette |
| `--code-bg` | `#0C1612` | Code blocks / editor |

Rules: accent is a **fill with ink text**, never small orange text on light. Sequence colours: kick = ink, clap = accent, hats = teal, bass = ink, chords = `#C99A1E`.

## Type

- **Schibsted Grotesk** (400, 500, 600, 700, 800) — everything. The variable font file is in `design/fonts/SchibstedGrotesk[wght].ttf` (SIL Open Font License, `design/fonts/OFL-SchibstedGrotesk.txt`): **self-host it** as WOFF2 (convert with `fonttools ttLib.woff2 compress`) instead of loading Google Fonts — faster, no third-party request, simpler CSP. DM Mono can be self-hosted the same way (download from google/fonts, OFL). **Done 12 Oct 2026:** both families are self-hosted as WOFF2 in `src/assets/fonts/` (sources and licences in `design/fonts/`); no Google Fonts requests.
- **DM Mono** (400, 500) — labels, catalogue numbers, metadata, code.
- Scale (desktop): H1 `clamp(56px, 7.4vw, 116px)` / 800 / line-height 0.92 / letter-spacing −0.045em. H2 `clamp(36px, 4vw, 56px)` / 800 / −0.035em. H3 24px / 700. Body 17px / 1.5. Small 15px. Mono labels 12–13px, uppercase, letter-spacing 0.08em.
- Uppercase only for mono eyebrows and the wordmark.

## Space, layout, shape

- Container max 1320px, side padding 24px (16px under 480px).
- Section padding 72–88px vertical (48px on phone).
- Grid gaps 20px (cards), 32px row gap in the catalog.
- **Borders:** 2px solid ink for cards/panels/buttons-outline; 1px `--line` hairlines in tables.
- **Corners:** square everywhere. Exceptions: circular play buttons, the sun.
- No shadows, no gradients, no glassmorphism.

## Logo (final: mark A + wordmark D)

Files in `design/logo/`:

| File | Use |
|---|---|
| `logo-mark.svg` / `logo-mark-dark.svg` | **Mark A, "Cover mark"**: exact output of the cover generator for *C major, 120 BPM, kick `x...x...x...x...`* ("track zero"): sun top y=20, four equal stripes + a 20% sea band. Favicon, app icon, player, social avatar. Square tile, never cropped. |
| `favicon.svg`, `favicon-16.svg`, `favicon-32.svg` | `favicon.svg` = the mark (large sizes). The 16 and 32 px versions are redrawn on the pixel grid (whole-pixel stripes) so they stay sharp; use them for those sizes. The finished PNG/ICO set is already rendered in `design/icons/` (with `site.webmanifest` and `head-snippet.html`) — copy it into `public/`; only regenerate with `@resvg/resvg-js` if the mark changes. |
| `logo-wordmark.svg` / `-dark.svg` | **Wordmark D, "Horizon wordmark"**: SUNSET over SEQUENCE at equal ink width (568 units, true font sizes 135.39 / 103.24 — no glyph stretching), line gap ¼ cap height, sun (r 64) fully inside the frame with 16-unit margins, SEQUENCE cut by three sea stripes that thicken downward; the **Q's tail is drawn uncut** and dips below the baseline through the sea — it is the one stroke that breaks the horizon and keeps the Q from reading as an O. ViewBox 620 × 268. Never apply the stripe cuts to the tail. Home hero, About, posters, sleeves, OG images. |
| `logo-horizontal.svg` / `-dark.svg` | Mark + one-line wordmark. Site header, docked player, emails. |

Rules: clear space = half the mark's width; minimum sizes: mark 16 px, stacked wordmark 160 px wide, horizontal 200 px; under 240 px wide use the horizontal lockup. Colours only ink `#13201B`, sand `#F1E7D4`, sun `#F0562A`. Never recolour the sun, stretch, outline or add effects.

All logo SVGs are **outlined** (text converted to paths from Schibsted Grotesk 800, shaped with HarfBuzz so kerning matches the browser) — they render identically in browsers, Figma, Illustrator and print, with no font dependency. Editable live-text sources are kept in `design/logo/source/*-livetext.svg`. The usage sheet is on the canvas page "Logo — final (A + D)".

## Motifs

- **Horizon stripes:** a band of 5 ink stripes of growing thickness (3, 5, 8, 12, 18px) used as section dividers and above the footer. It is the sea of the sunset.
- **Sunset cover:** see `docs/04-cover-generator.md`. Used for releases, the logo mark (36px in the header), the player thumbnail and tracklist thumbnails.
- **16-step sequence grid:** rows per instrument, 16 equal cells, `gap 2–4px`, filled cell = instrument colour, empty = `--cell-off`.
- **Sunrise progress (course):** small sunset squares where the sun sits a little higher at each step.

## Components (visual rules)

- **Primary button:** accent fill, ink text, 700, min-height 52px, padding 0 22px, square.
- **Secondary button:** transparent, 2px ink border, ink text.
- **On ink:** primary = ground fill + ink text; secondary = 1px `#50605A` border.
- **Play button (circular):** 44–64px, ink fill + paper icon (or ground fill + ink icon on dark).
- **Card / specimen:** paper fill, 2px ink border, header strip in mono with a 2px ink bottom rule.
- **Tag/badge:** mono 12px, paper on cover (`SQ-001`), ink on cover (`+ liner notes`).
- **Tables:** mono header 12px muted; rows separated by 1px lines.
- **Focus:** 3px outline `--accent` with 2px offset on every interactive element.

## Icons

Inline stroke SVG, 1.6px stroke, currentColor: play (filled triangle), pause (two bars), previous, next, queue (3 lines), volume, copy, external-link (↗ text glyph is fine). No icon fonts, no emoji.

## Motion

Minimal. Play state transitions 150ms. Sequence cells may light up in time with playback (stretch goal). Everything respects `prefers-reduced-motion`.
