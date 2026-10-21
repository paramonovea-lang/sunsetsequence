// The "Allow statistics?" banner and Google Analytics (components/Analytics.astro, StatsBanner.astro).
// Google loads only on the live domain, so here the banner and the stored choice are checked, and
// that no request ever goes to Google.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SITE } from '../../src/site';

test.use({ storageState: { cookies: [], origins: [] } });

const banner = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Visit statistics' });

test('a first visit is asked once; the choice is remembered across navigation and reloads', async ({ page }) => {
  const google: string[] = [];
  page.on('request', (r) => /google/.test(new URL(r.url()).hostname) && google.push(r.url()));
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  const html = await (await page.request.get('/')).text();
  expect(html).toContain(SITE.analyticsId);
  await banner(page).getByRole('button', { name: 'Allow' }).click();
  await expect(banner(page)).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('sq.stats.v1'))).toBe('granted');
  await page.locator('a[href="/course/"]:visible').first().click();
  await expect(page).toHaveURL(/\/course\/$/);
  await expect(banner(page)).toBeHidden();
  await page.reload();
  await expect(banner(page)).toBeHidden();
  expect(google).toEqual([]);
});

test('No thanks hides the banner; the privacy page shows and changes the choice', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByText('Statistics: not chosen yet (off)')).toBeVisible();
  await banner(page).getByRole('button', { name: 'No thanks' }).click();
  await expect(banner(page)).toBeHidden();
  await expect(page.getByText('Statistics: off')).toBeVisible();
  await page.getByRole('button', { name: 'Allow statistics' }).click();
  await expect(page.getByText('Statistics: allowed')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sq.stats.v1'))).toBe('granted');
});

test('the banner has no serious or critical accessibility problems', async ({ page }) => {
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).include('.sq-stats').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
  expect(bad).toEqual([]);
});
