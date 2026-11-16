import { expect, test } from '@playwright/test';

test('playground controls preserve static options and wait for input handlers', async ({
  page,
}) => {
  test.skip(!process.env['STATIC_SITE'], 'Run against a built static site with STATIC_SITE=1.');
  const url = new URL('playground/', process.env['E2E_BASE_URL']!.replace(/\/?$/, '/')).href;
  let resumeScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => (resumeScripts = resolve));
  await page.route('**/*.js', async (route) => {
    await scriptsReady;
    await route.continue();
  });
  await page.goto(url, { waitUntil: 'commit' });
  const language = page.locator('#pg-language');
  const template = page.locator('#pg-template');
  const fallback = page.getByRole('textbox', { name: 'Playground code editor' });
  let originalOption;
  try {
    await expect(page.locator('h1')).toBeVisible();
    await expect(language).toBeDisabled();
    await expect(template).toBeDisabled();
    await expect(language.locator('option').first()).toHaveText('HTML / CSS / JS');
    originalOption = await language.locator('option').first().elementHandle();
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveJSProperty('readOnly', true);
  } finally {
    resumeScripts();
  }
  await expect(language).toBeEnabled();
  await expect(template).toBeEnabled();
  // Transferred content must keep the prerendered options attached during hydration.
  expect(await originalOption?.evaluate((option) => option.isConnected)).toBe(true);
  await language.selectOption('python');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled();
  await language.selectOption('javascript');
  await expect(page).toHaveURL(/lang=javascript/);
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  await expect(page.locator('.cm-editor')).toBeVisible();
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('console.log("My saved playground draft");');
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('My saved playground draft');
});
