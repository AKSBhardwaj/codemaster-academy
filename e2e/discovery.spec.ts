import { expect, test } from '@playwright/test';

test.describe('discovery', () => {
  test('home page shows learning paths, categories and popular tutorials', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Popular learning paths' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Frontend Developer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Browse by category' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Databases/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Python/ }).first()).toBeVisible();
  });

  test('catalog lists every technology and filters by text and status', async ({ page }) => {
    await page.goto('/tutorials');
    await expect(page.getByText(/Showing 148 of 148 technologies/)).toBeVisible();
    await page.locator('#catalog-search').fill('cobol');
    await expect(page.getByText(/Showing 1 of 148 technologies/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'COBOL', exact: true })).toBeVisible();
    await page.locator('#catalog-search').fill('');
    await page.getByLabel('Planned').uncheck();
    await expect(page.getByText(/Showing 1 of 148 technologies/)).toBeVisible();
    await page.getByLabel('Complete').uncheck();
    await expect(page.getByText('No technologies match these filters')).toBeVisible();
    await page.getByRole('button', { name: 'Reset filters' }).first().click();
    await expect(page.getByText(/Showing 148 of 148 technologies/)).toBeVisible();
  });

  test('category page lists its technologies and links to others', async ({ page }) => {
    await page.goto('/tutorials/category/databases');
    await expect(page.getByRole('heading', { level: 1, name: 'Databases' })).toBeVisible();
    await expect(page.getByText('14 technologies in this category')).toBeVisible();
    await page.getByRole('link', { name: 'Web Development' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Web Development' })).toBeVisible();
  });

  test('quick search opens with Ctrl+K, finds Angular and navigates on Enter', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox', { name: /Search tutorials, lessons and categories/ });
    await expect(input).toBeFocused();
    await input.fill('angular');
    await expect(page.getByRole('option').first()).toContainText('Angular');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tutorials\/angular$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Angular');
  });

  test('search results page shows grouped results for a query', async ({ page }) => {
    await page.goto('/search?q=python');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('python');
    await expect(page.getByRole('link', { name: /^Python$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /All \(\d+\)/ })).toBeVisible();
  });

  test('learning paths index lists all paths', async ({ page }) => {
    await page.goto('/learning-paths');
    await expect(page.getByRole('link', { name: 'DevOps and Cloud Engineer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Engineer' })).toBeVisible();
  });
});
