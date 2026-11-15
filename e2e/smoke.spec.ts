import { expect, test } from '@playwright/test';

test.describe('application shell', () => {
  test('home page renders the navbar, main landmark and footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('theme switcher toggles the data-bs-theme attribute and persists', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Change theme' }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  });

  test('unknown routes show the not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Page not found');
  });
});
