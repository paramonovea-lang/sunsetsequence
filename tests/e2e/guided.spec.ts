import { expect, test, type Page } from '@playwright/test';

const DRUM_KIT = '/course/02-rhythm-and-drums/drum-kit/';
const runState = (page: Page) => page.locator('.sq-guided__run');
// The editor loads on first use: focusing the code (keyboard) or clicking it.
const editorReady = async (page: Page) => {
  await page.locator('.sq-guided__static').focus();
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 15_000 });
};

test('lessons link to their guided sequences', async ({ page }) => {
  await page.goto('/course/02-rhythm-and-drums/');
  await expect(page.locator('.guided-cta')).toHaveAttribute('href', DRUM_KIT);
  await page.goto('/course/11-example-tracks/');
  const hrefs = await page.locator('.guided-cta').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(expect.arrayContaining(['/course/11-example-tracks/hardcore/', '/course/11-example-tracks/risefall/', '/course/11-example-tracks/colours/']));
  for (const h of hrefs) expect((await page.request.get(h!)).status()).toBe(200);
});

test('all 5 drum-kit steps with the keyboard only', async ({ page }) => {
  await page.goto(DRUM_KIT);
  await editorReady(page);
  // Ctrl+Enter in the editor plays step 1
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+Enter');
  await expect(runState(page)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });

  // Arrow keys move through the step tabs; the music keeps playing with each new layer
  await page.getByRole('tab', { name: '1' }).focus();
  for (const n of [2, 3, 4, 5]) {
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: String(n) })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: String(n) })).toBeFocused();
    await expect(page.locator('.sq-guided__count')).toHaveText(`LAYER ${n} OF 5`);
    await expect(runState(page)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  }
  await expect(page).toHaveURL(/#step-5$/);
  await expect(page.locator('.cm-content')).toContainText('[~ ~ [ht mt] [lt lt]]');

  // Ctrl+. in the editor stops
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+.');
  await expect(runState(page)).toHaveAttribute('data-state', 'idle');
});

test('edits are kept per step and Reset restores the step', async ({ page }) => {
  await page.goto(DRUM_KIT);
  await editorReady(page);
  await page.locator('.cm-content').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('.gain(.8)');
  await expect(page.getByRole('button', { name: 'reset' })).toBeVisible();

  await page.getByRole('button', { name: 'Add the next layer →' }).click();
  await expect(page.locator('.cm-content')).not.toContainText('.gain(.8)');
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page.locator('.cm-content')).toContainText('.gain(.8)');

  await page.getByRole('button', { name: 'reset' }).click();
  await expect(page.locator('.cm-content')).not.toContainText('.gain(.8)');
  await expect(page.locator('.cm-new-line')).toHaveCount(2);
});

test('the guided editor, code blocks and the music player never play at once', async ({ page }) => {
  // music → guided: the player pauses
  await page.goto('/tracks/hope/');
  await page.locator('.panel [data-play]').click();
  await expect.poll(() => page.evaluate(() => !document.querySelector('audio')!.paused)).toBe(true);
  // navigate the way a link click does, so the docked player stays (page.goto would reload)
  await page.evaluate((href) => {
    const a = document.createElement('a');
    a.href = href;
    document.body.append(a);
    a.click();
  }, DRUM_KIT);
  await expect(page).toHaveURL(new RegExp(DRUM_KIT));
  await editorReady(page);
  await runState(page).click();
  await expect(runState(page)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => document.querySelector('audio')!.paused)).toBe(true);

  // guided → music: the editor stops
  await page.getByRole('region', { name: 'Player' }).getByRole('button', { name: 'Play' }).click();
  await expect(runState(page)).toHaveAttribute('data-state', 'idle');
});

test('a broken edit shows the error under the toolbar', async ({ page }) => {
  await page.goto(DRUM_KIT);
  await editorReady(page);
  await page.locator('.cm-content').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(' @@ nonsense');
  await runState(page).click();
  await expect(page.locator('.sq-guided__msg')).toBeVisible({ timeout: 30_000 });
  await expect(runState(page)).toHaveAttribute('data-state', 'idle');
});

test('the editor bundle stays off pages without an editor', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/');
  await page.goto('/course/02-rhythm-and-drums/');
  await page.waitForLoadState('networkidle');
  expect(urls.filter((u) => /strudel-editor|strudel-runtime|codemirror/.test(u))).toEqual([]);
});
