import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the Angular dev server by default.
 * Set E2E_BASE_URL to point at a served production build (npm run preview).
 */
const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
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
        // ng serve is launched directly (not via npm) so Playwright can terminate the whole process tree on Windows.
        command: 'npx ng serve --port 4200',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
