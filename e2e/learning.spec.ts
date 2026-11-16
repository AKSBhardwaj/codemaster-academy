import { expect, test } from '@playwright/test';

test.describe('learning features', () => {
  test('bookmarks a lesson and a tutorial and lists them with recently viewed lessons', async ({
    page,
  }) => {
    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Bookmark this lesson' }).click();
    await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

    await page.goto('/tutorials/html');
    await page.getByRole('button', { name: 'Bookmark this tutorial' }).click();
    await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

    await page.goto('/bookmarks');
    await expect(page.getByRole('heading', { name: 'Bookmarked tutorials' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'HTML', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'HTML Introduction' })).toHaveCount(2); // bookmarked + recently viewed
    await page.getByRole('button', { name: 'Remove bookmark for HTML Introduction' }).click();
    await expect(page.getByText('No bookmarked lessons yet')).toBeVisible();
  });

  test('learning path shows stages, progress and a recommended next lesson, and enrolment persists', async ({
    page,
  }) => {
    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Mark as completed' }).click();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();

    await page.goto('/learning-paths/frontend-developer');
    await expect(page.getByRole('heading', { level: 1, name: 'Frontend Developer' })).toBeVisible();
    await expect(page.locator('.cma-stage')).toHaveCount(7);
    await expect(page.getByText(/1 of \d+ lessons completed/)).toBeVisible();
    await expect(page.getByText('Recommended next lesson')).toBeVisible();
    await expect(page.getByRole('link', { name: /HTML Editors/ })).toBeVisible();
    await expect(page.getByText(/of the tutorials on this path are still planned/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Enrol in this path' }).click();
    await expect(page.getByRole('button', { name: 'Enrolled' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Enrolled' })).toBeVisible();
  });
});
