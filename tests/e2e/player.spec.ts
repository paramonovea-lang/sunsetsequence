import { expect, test, type Page } from '@playwright/test';

const player = (page: Page) => page.getByRole('region', { name: 'Player' });
const audioTime = (page: Page) => page.evaluate(() => document.querySelector('audio')!.currentTime);
const audioPlaying = (page: Page) => page.evaluate(() => !document.querySelector('audio')!.paused);

test('music keeps playing from home → track page → lesson, on the same audio element', async ({ page }) => {
  await page.goto('/');
  await expect(player(page)).toBeHidden(); // hidden until the first play
  await page.getByRole('button', { name: 'Play the latest release' }).click();
  await expect(player(page)).toBeVisible();
  await expect.poll(() => audioPlaying(page)).toBe(true);
  await page.evaluate(() => ((window as any).__audio = document.querySelector('audio')));

  await page.getByRole('link', { name: 'Specimen sheet →' }).click();
  await expect(page).toHaveURL(/\/tracks\/crazy-breeze\/$/);
  await page.getByRole('link', { name: /Step 05 · Song structure/ }).click();
  await expect(page).toHaveURL(/\/course\/05-song-structure\/$/);

  expect(await page.evaluate(() => document.querySelector('audio') === (window as any).__audio)).toBe(true);
  expect(await audioPlaying(page)).toBe(true);
  const t1 = await audioTime(page);
  await expect.poll(() => audioTime(page)).toBeGreaterThan(t1);
  await expect(player(page)).toContainText('SQ-003 · playing');
});

test('track page play button and waveform mirror the docked player', async ({ page }) => {
  await page.goto('/tracks/hope/');
  const big = page.locator('.panel [data-play="SQ-001"]');
  await big.click();
  await expect(big).toHaveAttribute('data-state', 'playing');
  await expect(big).toHaveAttribute('aria-label', 'Pause');
  await expect(player(page).getByRole('button', { name: 'Pause' })).toBeVisible();

  await player(page).getByRole('button', { name: 'Pause' }).click();
  await expect(big).toHaveAttribute('data-state', 'paused');
  await expect.poll(() => audioPlaying(page)).toBe(false);

  // Clicking 3/4 of the way along the waveform seeks there.
  const bars = page.getByRole('slider', { name: /Seek in/ });
  const box = (await bars.boundingBox())!;
  // Locator click scrolls the waveform out from under the sticky player before clicking.
  await bars.click({ position: { x: box.width * 0.75, y: box.height / 2 } });
  await expect.poll(() => page.evaluate(() => document.querySelector('audio')!.duration)).toBeGreaterThan(0);
  const duration = await page.evaluate(() => document.querySelector('audio')!.duration);
  await expect.poll(() => audioTime(page)).toBeGreaterThan(duration * 0.7);
});

test('keyboard can play, pause and seek', async ({ page }) => {
  await page.goto('/tracks/quarrel/');
  await page.locator('.panel [data-play="SQ-002"]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => audioPlaying(page)).toBe(true);

  const seek = player(page).getByRole('slider', { name: 'Seek' });
  await seek.focus();
  const before = await audioTime(page);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => audioTime(page)).toBeGreaterThan(before + 4);

  await player(page).getByRole('button', { name: 'Pause' }).focus();
  await page.keyboard.press('Space');
  await expect.poll(() => audioPlaying(page)).toBe(false);
});

test('next and previous move through the catalog', async ({ page }) => {
  await page.goto('/tracks/');
  await page.locator('[data-panel="covers"] [data-play="SQ-002"]').click();
  await expect(player(page)).toContainText('SQ-002');
  await player(page).getByRole('button', { name: 'Next' }).click();
  await expect(player(page)).toContainText('SQ-001');
  await player(page).getByRole('button', { name: 'Previous' }).click();
  await expect(player(page)).toContainText('SQ-002');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('step strip does not animate', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play the latest release' }).click();
    await expect.poll(() => audioTime(page)).toBeGreaterThan(0.5);
    expect(await page.locator('[data-steps-for] i.on').count()).toBe(0);
    await expect(page.locator('[data-cycle-for]')).toHaveText('1');
  });
});

test('step strip and cycle counter follow playback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play the latest release' }).click();
  await expect.poll(() => page.locator('[data-steps-for] i.on').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-cycle-for]')).not.toHaveText('[n]');
});
