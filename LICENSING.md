# Licensing

This repository holds several kinds of work, and they are licensed differently. The table says
which licence covers which folder. Where a folder is listed with exceptions, the more specific
line wins.

| Folder or file | What it is | Licence |
|---|---|---|
| `src/`, `scripts/`, `tests/`, `deploy/`, `design/tokens.css`, `design/tokens.json`, `public/robots.txt`, `public/site.webmanifest`, config files in the root (`package.json`, `astro.config.mjs`, …), `docs/`, `prompts/`, `.githooks/`, `content/examples/sq-001.example.*` (the template for a new release), `README.md`, `CLAUDE.md`, `LICENSING.md` | The site's code, build and deploy scripts, tests and documentation | [GNU AGPL-3.0-or-later](LICENSE) |
| `content/course-source/`, `content/course-overrides/`, `content/guided/`, `src/content/lessons/`, `content/examples/02-rhythm-and-drums.example.mdx` | The free course. **Text** (explanations, tables, pictures), and the course's own page scripts and styles (`course.js`, `course.css`, `build-nav.js` in `content/course-source/`) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| the same folders | The free course. **Code**: every code box, the code in the guided steps, and the course's own example tracks (including Night Bus) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication) |
| `src/content/tracks/` (including `code/`) | The releases: their code and notes | **All rights reserved** |
| Release audio (`media/`, not in this repository) | The recordings of the releases | All rights reserved |
| `design/logo/` (including `source/`), `design/icons/`, and in `public/`: `logo-mark.svg`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `og-default.png` | The Sunset Sequence name, logo, icons and social image | **All rights reserved** |
| `design/avatar/`, `public/avatar/` | The author's avatar ("The path") | **All rights reserved** |
| `design/reference/` | The approved design mockups | All rights reserved |
| `design/fonts/`, `src/assets/fonts/`, `src/assets/og-fonts/` | Schibsted Grotesk and DM Mono | [SIL Open Font License 1.1](design/fonts/) (the licence texts are next to the fonts) |

Copyright © 2026 Egor P.

## Why these licences

- **Site code: AGPL-3.0-or-later.** The site bundles Strudel (`@strudel/*`, AGPL-3.0-or-later), so
  the site must use the AGPL too, and its source must be offered to everyone who uses the site:
  this public repository and the "Source" link in the footer.
- **Course text: CC BY-SA 4.0.** Teaching material may be shared and adapted with credit, and
  improved versions stay free.
- **Course code: CC0 1.0.** The course is there so learners write their own music. With BY-SA, a
  track built from a course snippet would have to be BY-SA as well (and Creative Commons advises
  against its BY-SA licences for code). CC0 lets anyone use the code with no conditions.
- **Releases: all rights reserved, code and audio.** The author's own music, released for sale.
  The code is the score of the recording. The repository shows it (GitHub's terms let visitors view
  and fork it on GitHub) but grants no licence to reuse it. Playing it through Strudel does not put
  it under the AGPL: it is input to the program, not part of it.
- **Name, logo, icons, avatar: all rights reserved.** They identify the site and its author.
- **Fonts: SIL OFL 1.1**, the licence their makers chose (no Reserved Font Names).

The same policy, in plain words for visitors: https://sunsetsequence.com/licences/

## The logo is not part of the open licences

The AGPL covers the code that draws the site, not the brand. The Sunset Sequence name, logo
and icons are all rights reserved. If you fork this repository, replace the files in the logo row
above with your own and change the name in `src/site.ts` before you publish your copy.

## The course examples run on Strudel

The course and its examples are written for [Strudel](https://strudel.cc/) (AGPL-3.0-or-later). The
site bundles Strudel's packages from npm; they are not stored in this repository, except
`src/lib/soundfont-loader.mjs`, an AGPL copy of Strudel's soundfont loader changed to read the sound
files as data. Strudel's sounds load from its public hosts; the sample packs have their own licences
(see `docs/07-strudel-integration.md`).
