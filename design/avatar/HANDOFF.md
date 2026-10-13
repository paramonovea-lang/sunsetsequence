# Author avatar + bio — handoff for Claude Code

> Status 12 Oct 2026: done. Name = Egor P. (Q1); no newsletter (Q8); files are in `design/avatar/` and `public/avatar/`.

Add-on for the **sunsetsequence.com** build (main handoff: `sunsetsequence-handoff.zip`). Chosen avatar: **A · "The path"**.

## The avatar

A road of light made of sequencer steps runs across the sea to the setting sun — the author's invitation "let's walk this path together", drawn with the same parts as the logo and the release covers (sun `#F0562A`, sand `#F1E7D4`, ink `#13201B`).

It is the **author's** image, not the brand mark: use the logo mark (`design/logo/logo-mark.svg`) for the site/brand, and this avatar wherever a person is meant (author page, course author byline, social profiles).

### Files (SVG masters in `design/avatar/`; all SVGs + PNGs in `public/avatar/`)

| File | Use |
|---|---|
| `avatar.svg` | Master, light. Use on the site (inline or `<img>`). |
| `avatar-dark.svg` | Master, dark (ink background). For dark sections/platforms. |
| `avatar-1024.png`, `avatar-dark-1024.png` | Profile uploads (YouTube, Bandcamp, SoundCloud, Instagram, GitHub…). |
| `avatar-400.png`, `avatar-dark-400.png` | Medium (author card, email signature). |
| `avatar-256.png`, `avatar-128.png` (+ dark) | Small bylines, comments. |

All files are square, full-bleed, and designed for a **circle crop** (most platforms crop to a circle): the sun and the path sit inside the safe circle. Never add a frame, shadow or rounded-square mask; never recolour.

### Where it goes in the site

1. Copy `files/avatar.svg` and `files/avatar-dark.svg` to `design/avatar/` and `public/avatar/`; copy the PNGs to `public/avatar/` too.
2. **About page `/about/`** — top card: avatar 160 px circle (`border-radius: 50%`), name (Egor P., `SITE.artist`), role line, bio (below), links.
3. **Home "About" section (RSS link, no newsletter)** — avatar 96 px circle next to the name.
4. **Course** — author byline on `/course/` and at the end of each lesson: avatar 48 px circle + "Written by Egor P.: music in code, and the course to write your own." (`components/Byline.astro`).
5. Alt text: `alt="Egor P."` (the image represents the person); `alt=""` when the name is printed right next to it.
6. Structured data: on `/about/`, add `Person` JSON-LD with `image: https://sunsetsequence.com/avatar/avatar-1024.png`.

Update `docs/03-pages-and-components.md` (About section, home section 6) and the README file table accordingly.

## Bio text

**Owner's original:**
> Modern technologies like music programming allow you to realize your own ideas that were previously difficult to achieve. This is your new age of creative inquiry. Let's walk this path together.

**Suggested adjustment — use this on the About page and home About section:**
> Music programming lets you build ideas that used to be out of reach. This is your new age of creative inquiry. Let's walk this path together.

Why: "Modern technologies like…" and "realize … previously difficult to achieve" are long and abstract; the shorter first sentence says the same thing in plain words and keeps the three-beat rhythm (what's possible → what it means for you → the invitation). "Your" is kept: it speaks directly to the visitor.

**Variants (owner picks; until then use the suggested text above):**

| Where | Text | Length |
|---|---|---|
| About page heading | Let's walk this path together. | 30 |
| Social bio (≤ 160) | Music written in code. Ideas that used to be out of reach, now playable. Let's walk this path together — free course at sunsetsequence.com | ~140 |
| Short bio (≤ 80) | Music written in code · a free course · sunsetsequence.com | 58 |
| Course byline | Written by Egor P.: music in code, and the course to write your own. | ~75 |

Q1 answered 12 Oct 2026: Egor P.
