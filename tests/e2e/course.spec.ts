import { expect, test, type Page } from '@playwright/test';

const LESSONS = [
  '01-start-here', '02-rhythm-and-drums', '03-notes-and-chords', '04-sound-and-effects', '05-song-structure', '06-visuals',
  '07-save-export-practice', '08-command-reference', '09-sound-bank', '10-error-messages', '11-example-tracks',
];

type Inspect = { error: string | null; events: number; missing: string[] };

// Every runnable Strudel block must evaluate, produce events and use only registered sounds.
// Needs internet: sample maps load from Strudel's CDN, as on strudel.cc.
test.describe('every course example plays', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1000, 'desktop only, the result does not depend on width');
  test.describe.configure({ timeout: 180_000 });

  for (const slug of LESSONS) {
    test(slug, async ({ page }) => {
      const logs: string[] = [];
      page.on('console', (m) => logs.push(m.text()));
      await page.goto(`/course/${slug}/`);
      const codes = await page.locator('.codeblock[data-runnable]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.code!));
      const results = await page.evaluate(async (codes) => {
        const rt = await (window as any).__sqStrudel();
        const out: Inspect[] = [];
        for (const code of codes) out.push(await rt.inspect(code));
        return out;
      }, codes);
      const bad = results
        .map((r, i) => ({ ...r, i, first: codes[i]!.split('\n').find((l) => l.trim() && !l.trim().startsWith('//'))?.slice(0, 60) }))
        .filter((r) => r.error || r.events === 0 || r.missing.length);
      expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
      expect(logs.filter((l) => /unknown chord/i.test(l))).toEqual([]);
    });
  }
});

const strudelLoaded = (urls: string[]) => urls.some((u) => u.includes('strudel-runtime'));

test('Strudel is not downloaded on home and catalog, only on the first Run', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/');
  await page.goto('/tracks/');
  await page.waitForLoadState('networkidle');
  expect(strudelLoaded(urls)).toBe(false);
  await page.goto('/course/02-rhythm-and-drums/');
  await page.waitForLoadState('networkidle');
  expect(strudelLoaded(urls)).toBe(false);
  await page.locator('.cb-run').first().click();
  await expect.poll(() => strudelLoaded(urls)).toBe(true);
});

const runBtn = (page: Page, n = 0) => page.locator('.cb-run').nth(n);

test('Run and Stop; one block at a time; Strudel and the music player take turns', async ({ page }) => {
  await page.goto('/course/02-rhythm-and-drums/');
  await runBtn(page, 0).click();
  await expect(runBtn(page, 0)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await expect(runBtn(page, 0)).toContainText('Stop');

  await runBtn(page, 1).click();
  await expect(runBtn(page, 1)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await expect(runBtn(page, 0)).toHaveAttribute('data-state', 'idle');

  await runBtn(page, 1).click();
  await expect(runBtn(page, 1)).toHaveAttribute('data-state', 'idle');

  // Playing a track stops Strudel; running Strudel pauses the track.
  await runBtn(page, 0).click();
  await expect(runBtn(page, 0)).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await page.goto('/tracks/hope/');
  await page.locator('.panel [data-play]').click();
  await expect.poll(() => page.evaluate(() => !document.querySelector('audio')!.paused)).toBe(true);
  await page.locator('.cb-run').click();
  await expect(page.locator('.cb-run')).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => document.querySelector('audio')!.paused)).toBe(true);
  await page.locator('.panel [data-play]').click();
  await expect(page.locator('.cb-run')).toHaveAttribute('data-state', 'idle');
});

test('Ctrl+Enter runs the focused block and Ctrl+. stops it; errors show under the block', async ({ page }) => {
  await page.goto('/course/02-rhythm-and-drums/');
  const box = page.locator('.codeblock[data-runnable]').first();
  await box.locator('pre').focus();
  await page.keyboard.press('Control+Enter');
  await expect(box.locator('.cb-run')).toHaveAttribute('data-state', 'playing', { timeout: 30_000 });
  await page.keyboard.press('Control+.');
  await expect(box.locator('.cb-run')).toHaveAttribute('data-state', 'idle');

  await box.evaluate((el) => ((el as HTMLElement).dataset.code = 's("bd*4"'));
  await box.locator('.cb-run').click();
  await expect(box.locator('.cb-msg')).toBeVisible({ timeout: 30_000 });
  await expect(box.locator('.cb-run')).toHaveAttribute('data-state', 'idle');
});

test('command reference can be searched', async ({ page }) => {
  await page.goto('/course/08-command-reference/');
  const rows = page.locator('.lesson-body tbody tr');
  const all = await rows.count();
  await page.getByLabel('Find a command').fill('lpf');
  await expect(page.locator('.filter-count')).toContainText('matching');
  const visible = await rows.evaluateAll((rs) => rs.filter((r) => !(r as HTMLElement).hidden).length);
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(all);
});

test('progress: visited parts get a ✓ and the course page offers to continue', async ({ page }) => {
  await page.goto('/course/03-notes-and-chords/');
  await page.goto('/course/');
  await expect(page.locator('[data-part="3"]')).toHaveAttribute('data-visited', '');
  await expect(page.getByRole('link', { name: 'Continue where you left off →' })).toHaveAttribute('href', /03-notes-and-chords/);
});

test('progress: a visited part keeps its number in the menu and gets a check', async ({ page }) => {
  test.skip(page.viewportSize()!.width <= 600, 'the phone menu shows only the current part');
  await page.goto('/course/03-notes-and-chords/');
  await page.goto('/course/04-sound-and-effects/');
  const item = page.locator('.course-menu [data-menu-part="3"]');
  await expect(item).toHaveAttribute('data-visited', '');
  await expect(item.locator('.mark')).toHaveText('03');
  await expect(item.locator('.seen')).toBeVisible();
  await expect(page.locator('.course-menu [data-menu-part="4"] .seen')).toBeHidden();
});

test('sections are numbered in the heading and the on-page links', async ({ page }) => {
  await page.goto('/course/03-notes-and-chords/');
  await expect(page.locator('.lesson-body h2').first()).toContainText('3.1');
  await expect(page.locator('ul.onpage a').first()).toHaveText(/^3\.1 /);
});

test('chord explorer and arpeggio keyboard work', async ({ page }) => {
  await page.goto('/course/03-notes-and-chords/');
  await page.locator('#chord-explorer-fig .cx-type', { hasText: 'Minor 7' }).click();
  await expect(page.locator('#cx-title')).toHaveText('Cm7 (minor 7)');
  await expect(page.locator('#cx-chord')).toHaveText('chord("Cm7").voicing().s("piano")');

  await page.goto('/course/11-example-tracks/');
  await page.locator('#arp-step').click();
  await expect(page.locator('#arp-keyboard .acell.now')).toHaveCount(1);
  await page.locator('#arp-stop').click();
  await expect(page.locator('#arp-keyboard .acell.now')).toHaveCount(0);
});

test('the keyboards play Strudel piano recordings, and still work when those cannot load', async ({ page }) => {
  await page.goto('/course/03-notes-and-chords/');
  // Cm7 = C4 E♭4 G4 B♭4: the nearest recordings are C4, D♯4, F♯4 and A4.
  const c4 = page.waitForResponse((r) => r.url().endsWith('/piano/C4v8.mp3'));
  await page.locator('#chord-explorer-fig .cx-type', { hasText: 'Minor 7' }).click();
  expect((await c4).status()).toBe(200);

  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('**/piano/*.mp3', (r) => r.abort());
  await page.goto('/course/11-example-tracks/');
  await page.locator('#arp-step').click();
  await expect(page.locator('#arp-keyboard .acell.now')).toHaveCount(1);
  await page.locator('#arp-stop').click();
  expect(errors).toEqual([]);
});

test('the small keyboard pictures play their chord on click and with the keyboard', async ({ page }) => {
  await page.goto('/course/03-notes-and-chords/');
  const pics = page.locator('.lesson-body svg.kbd-mini[data-notes]');
  await expect(pics).toHaveCount(11);
  const cMajor = pics.first();
  await expect(cMajor).toHaveAttribute('data-notes', '60 64 67');
  await expect(cMajor).toHaveAttribute('role', 'button');
  // C major = C4 E4 G4: the nearest recordings are C4, D♯4 (E4) and F♯4 (G4)
  const ds4 = page.waitForResponse((r) => r.url().endsWith('/piano/Ds4v8.mp3'));
  await cMajor.click();
  await expect(cMajor.locator('.chord.now')).toHaveCount(3);
  expect((await ds4).status()).toBe(200);
  // C minor by keyboard: Enter plays it
  await pics.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(pics.nth(1).locator('.chord.now')).toHaveCount(3);
});

test('drum grid and arrangement grid are drawn', async ({ page }) => {
  await page.goto('/course/02-rhythm-and-drums/');
  await expect(page.locator('#drumgrid .c.on')).toHaveCount(4 + 2 + 4 + 16);
  await page.goto('/course/01-start-here/');
  await expect(page.locator('#arr .c.on')).toHaveCount(16 + 14 + 12 + 8 + 4);
});
