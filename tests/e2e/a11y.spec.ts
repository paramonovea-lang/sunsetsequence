// WCAG 2.1 AA checks with axe (docs/10 Phase 5: "axe shows 0 serious issues", accessibility 100).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/tracks/',
  '/tracks/hope/',
  '/course/',
  '/course/02-rhythm-and-drums/',
  '/course/03-notes-and-chords/',
  '/course/02-rhythm-and-drums/drum-kit/',
  '/about/',
  '/licences/',
  '/nope/',
];

for (const url of PAGES) {
  test(`${url} has no serious or critical accessibility problems`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
    expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
  });
}
