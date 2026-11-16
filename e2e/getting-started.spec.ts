import { expect, test } from '@playwright/test';

test('a new learner can try a page and open the first lesson without an account', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.cma-hero').getByRole('link', { name: 'Start here', exact: true }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole('heading', { name: 'You can learn to code' })).toBeVisible();
  await page.locator('cma-interactive-block').scrollIntoViewIfNeeded();
  const runner = page.locator('cma-inline-runner');
  await expect(runner.locator('.cm-editor')).toBeVisible({ timeout: 15_000 });
  await runner.getByRole('button', { name: 'Run', exact: true }).click();
  const preview = runner.frameLocator('iframe.cma-sandbox-frame');
  await expect(preview.getByRole('heading', { name: 'My first page' })).toBeVisible();

  const editor = runner.getByRole('textbox', { name: 'Your first web page editor' });
  await editor.fill('<h1>My favourite animal</h1><p>A cat has whiskers.</p>');
  await runner.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'My favourite animal' })).toBeVisible();
  await runner.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(editor).toContainText('My first page');
  await runner.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'My first page' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.getByRole('link', { name: 'Begin the first HTML lesson' }).click();
  await expect(page).toHaveURL(/\/tutorials\/html\/introduction$/);
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeVisible();
});

test('the JavaScript starter example runs without an external service', async ({ page }) => {
  await page.goto('/playground?lang=javascript&template=read-json');
  await expect(page.locator('.cm-editor')).toBeVisible();
  await page.route('https://**/*', (route) => route.abort());
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.cma-output-panel__body')).toContainText('My animal book');
  await expect(page.locator('.cma-output-panel__body')).toContainText('Pages: 24');
});
