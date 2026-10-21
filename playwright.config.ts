import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Tests start with the statistics choice made ("No thanks"), so the banner doesn't push the page down;
  // tests/e2e/stats.spec.ts covers the banner itself.
  use: {
    baseURL: 'http://127.0.0.1:4330',
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4330', localStorage: [{ name: 'sq.stats.v1', value: 'denied' }] }] },
  },
  webServer: { command: 'npm run dev-audio && npm run build && node scripts/serve.mjs 4330', url: 'http://127.0.0.1:4330', reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 360, height: 780 } } },
  ],
});
