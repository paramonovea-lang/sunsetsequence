import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

// Real playback (not just inspect): the effects AudioWorklet must load under the site's CSP, and gm_*
// instruments must load through src/lib/soundfont-loader.mjs (read as data, never eval'd). Needs internet.
test('effects and gm_* instruments load and play without errors', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1000, 'desktop only');
  const logs: string[] = [];
  const fonts: number[] = [];
  page.on('console', (m) => logs.push(m.text()));
  page.on('response', (r) => { if (r.url().includes('webaudiofontdata')) fonts.push(r.status()); });
  await page.goto('/course/04-sound-and-effects/');
  await page.evaluate(async () => {
    const rt = await (window as any).__sqStrudel();
    await rt.run('stack(s("sawtooth*4").note("c3").crush(4).coarse(8).shape(.5).distort(1), note("c3 e3").s("gm_epiano1"))');
    await new Promise((r) => setTimeout(r, 2500));
    rt.stop?.();
  });
  expect(logs.filter((l) => /could not load AudioWorklet|getTrigger\] error|soundfont/i.test(l))).toEqual([]);
  expect(logs.some((l) => /AudioWorklets loaded/.test(l))).toBe(true);
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((s) => s === 200)).toBe(true);
});
