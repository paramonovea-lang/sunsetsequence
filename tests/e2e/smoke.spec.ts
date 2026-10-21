import { expect, test } from '@playwright/test';
import { SITE } from '../../src/site';

const pages = ['/', '/tracks/', '/tracks/hope/', '/course/', '/course/01-start-here/', '/course/03-notes-and-chords/', '/course/11-example-tracks/', '/about/', '/licences/', '/privacy/'];

for (const url of pages) {
  test(`${url} renders without sideways scroll or console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('every internal link resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const url of pages) {
    await page.goto(url);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) seen.add(href.split('#')[0]!);
  }
  for (const href of seen) expect((await request.get(href)).status(), href).toBe(200);
});

test('catalog view switch is remembered', async ({ page }) => {
  await page.goto('/tracks/');
  await expect(page.locator('[data-panel="list"]')).toBeHidden();
  await page.getByRole('tab', { name: 'Tracklist' }).click();
  await expect(page.locator('[data-panel="list"]')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Tracklist' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-panel="covers"]')).toBeHidden();
});

test('favicons, manifest, logo and social image load', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.locator('head link[rel~="icon"], head link[rel="apple-touch-icon"], head link[rel="manifest"]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThanOrEqual(4);
  const og = new URL((await page.locator('meta[property="og:image"]').getAttribute('content'))!).pathname;
  for (const href of [...hrefs, og, '/logo-mark.svg', '/icon-192.png', '/icon-512.png']) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.getByRole('link', { name: 'Sunset Sequence, home' }).locator('img')).toHaveJSProperty('complete', true);
  expect(await page.evaluate(() => document.fonts.check('800 19px "Schibsted Grotesk"'))).toBe(true);
});

test('about page: author, bio and a working contact link that is not in the page source', async ({ page, request }) => {
  const address = [SITE.contact.user, SITE.contact.domain].join(String.fromCharCode(64));
  const html = await (await request.get('/about/')).text();
  expect(html).not.toContain(address);
  await page.goto('/about/');
  await expect(page.locator('h1')).toHaveText('Egor P.');
  await expect(page.locator('.lede')).toContainText('new age of creative inquiry');
  const mail = page.locator('a.sq-email');
  await expect(mail).toHaveAttribute('href', `mailto:${address}`);
  await expect(mail).toHaveText('Write to me →');
  await expect(page.locator('main')).not.toContainText(address);
});

test('home: no newsletter form, a visible RSS link to a valid feed', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('form')).toHaveCount(0);
  const rss = page.getByRole('link', { name: /Follow new releases \(RSS\)/ });
  await expect(rss).toHaveAttribute('href', '/rss.xml');
  const feed = await request.get('/rss.xml');
  expect(feed.status()).toBe(200);
  expect(await feed.text()).toContain('<title>SQ-001 · Hope</title>');
});

test('the author avatar shows on the About page, home and course, and the About page has Person data', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('.photo img.sq-avatar')).toBeVisible();
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld).toMatchObject({ '@type': 'Person', name: 'Egor P.', image: 'https://sunsetsequence.com/avatar/avatar-1024.png' });
  await page.goto('/');
  await expect(page.locator('#about img.sq-avatar')).toBeVisible();
  await page.goto('/course/02-rhythm-and-drums/');
  await expect(page.locator('.sq-byline')).toContainText('Written by Egor P.');
  for (const src of ['/avatar/avatar.svg', '/avatar/avatar-1024.png']) expect((await page.request.get(src)).status()).toBe(200);
});

test('coming soon cards: no link, no play button, and no track page', async ({ page, request }) => {
  await page.goto('/tracks/');
  for (const card of await page.locator('[data-upcoming]').all()) {
    await expect(card.locator('a, button')).toHaveCount(0);
  }
  const titles = await page.locator('[data-panel="covers"] [data-upcoming] .t').allInnerTexts();
  const feed = await (await request.get('/rss.xml')).text();
  for (const t of titles) expect(feed).not.toContain(t);
});

test('audio and cover artwork links change when the file does (?v= tag)', async ({ request }) => {
  const html = await (await request.get('/tracks/hope/')).text();
  expect(html).toMatch(/sq-001\.wav\?v=[0-9a-f]{8}/);
  expect(html).toMatch(/covers\/sq-001\.png\?v=[0-9a-f]{8}/);
});
