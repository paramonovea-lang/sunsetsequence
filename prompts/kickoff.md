# Resume prompt for Claude Code

The site launched on 13 Oct 2026 (https://sunsetsequence.com and the GitHub repo are public). Paste this into a new Claude Code
session opened in this folder (`E:\Tindal\sunsetsequence-site`):

---

We're continuing sunsetsequence.com: my music site (tracks written in Strudel/TidalCycles) with my free live-coding course.

1. Read `CLAUDE.md`, `README.md`, `docs/10-roadmap-and-acceptance.md` (Status), `docs/11-open-questions.md` and `docs/12-start-checklist.md`, plus `E:\Tindal\HANDOFF.md` section 5b (on the owner's PC only). Read the other docs when the task touches them.
2. Run the checks (`npm run check`, `npm test`, `npx playwright test`) and tell me if anything fails before changing code.
3. Then: [what I want next — e.g. add a new release, a new guided sequence, the Firefox/Safari/phone check].

Rules: placeholders stay visible until I give the facts; releases never go into the course; only the site's VPS and sunsetsequence.com DNS are in scope; ask before installing, touching the server or changing DNS; push to GitHub only when I ask (`npm run check-push` first). Never paste the preview password into chat.
