import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the Angular dev server by default.
 * Set E2E_BASE_URL to point at a served production build (npm run preview), or E2E_PORT to start the dev server
 * on another port when 4200 is already in use.
 */
const port = process.env['E2E_PORT'] ?? '4200';
const baseURL = process.env['E2E_BASE_URL'] ?? `http://localhost:${port}`;
const useExternalServer = !!process.env['E2E_BASE_URL'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        // The CLI is started as a single node process (no npm/npx wrappers) so Playwright can terminate it on Windows.
        command: `node node_modules/@angular/cli/bin/ng.js serve --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
