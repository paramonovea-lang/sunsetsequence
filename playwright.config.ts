import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4330' },
  webServer: { command: 'npm run dev-audio && npm run build && node scripts/serve.mjs 4330', url: 'http://127.0.0.1:4330', reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 360, height: 780 } } },
  ],
});
