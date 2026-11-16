import { expect, test } from '@playwright/test';

test.describe('tutorial engine', () => {
  test('overview lists lessons and starts the first lesson', async ({ page }) => {
    await page.goto('/tutorials/html');
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Tutorial' })).toBeVisible();
    await expect(page.locator('.cma-status-badge--complete').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /HTML Introduction/ }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Start learning' }).click();
    await expect(page).toHaveURL(/\/tutorials\/html\/introduction$/);
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Introduction' })).toBeVisible();
  });

  test('lesson renders blocks, navigates to the next lesson and tracks completion', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/tutorials/html/introduction');
    await expect(page.getByRole('heading', { level: 2, name: 'What does HTML do?' })).toBeVisible();
    await expect(page.locator('figure.cma-code').first()).toBeVisible();
    await expect(page.locator('[class^="tk-"]').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Copy code to clipboard/ }).first(),
    ).toBeVisible();
    await expect(page.locator('.cma-output iframe').first()).toBeVisible();

    await page.getByRole('button', { name: 'Mark as completed' }).click();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();

    await page.getByRole('link', { name: /Next lesson/ }).click();
    await expect(page).toHaveURL(/\/tutorials\/html\/editors$/);
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Editors' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Lessons' }).click();
    }
    const sidebar = page.getByRole('navigation', { name: 'HTML lessons' }).first();
    await expect(sidebar.getByRole('link', { name: /HTML Introduction/ })).toContainText(
      '(completed)',
    );
    await expect(sidebar.getByRole('link', { name: /HTML Editors/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('new Rust tutorial has a complete course and opens its first lesson', async ({ page }) => {
    await page.goto('/tutorials/rust');
    await expect(page.getByRole('heading', { level: 1, name: 'Rust Tutorial' })).toBeVisible();
    await expect(page.locator('.cma-status-badge--complete').first()).toBeVisible();
    await expect(page.getByText('This tutorial is planned.')).toHaveCount(0);
    await page.getByRole('link', { name: 'Start learning' }).click();
    await expect(page).toHaveURL(/\/tutorials\/rust\/[^/]+\/?$/);
    await expect(page.locator('cma-lesson h1')).toBeVisible();
    await expect(page.locator('figure.cma-code').first()).toBeVisible();
  });

  test('reference and examples pages render the HTML content', async ({ page }) => {
    await page.goto('/references/html');
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Reference' })).toBeVisible();
    await page.locator('#reference-filter').fill('canvas');
    await expect(page.locator('.cma-reference__entry')).toHaveCount(1);
    await page.goto('/examples/html');
    await expect(page.getByRole('heading', { level: 2, name: 'Pricing table' })).toBeVisible();
  });
});
