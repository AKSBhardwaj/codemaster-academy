import { expect, test, type Page } from '@playwright/test';

async function waitForEditor(page: Page): Promise<void> {
  await expect(page.locator('.cm-editor').first()).toBeVisible();
}

async function setEditorCode(page: Page, code: string): Promise<void> {
  const editor = page.locator('.cm-content').first();
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText(code);
}

test.describe('playground', () => {
  test('runs an HTML template in a sandboxed frame and shows console output', async ({ page }) => {
    await page.goto('/playground?lang=html&template=button-counter');
    await waitForEditor(page);
    await page.getByRole('button', { name: 'Run' }).click();
    const frame = page.frameLocator('iframe.cma-sandbox-frame');
    await expect(frame.getByRole('button', { name: /Clicked 0 times/ })).toBeVisible();
    await frame.getByRole('button', { name: /Clicked/ }).click();
    await expect(page.getByText('count is now 1')).toBeVisible();
    await expect(page.locator('iframe.cma-sandbox-frame')).toHaveAttribute(
      'sandbox',
      'allow-scripts',
    );
  });

  test('runs JavaScript and reports errors from the sandbox', async ({ page }) => {
    await page.goto('/playground?lang=javascript');
    await waitForEditor(page);
    await setEditorCode(
      page,
      "console.log('sum', 2 + 3);\nconsole.warn('careful');\nthrow new Error('boom');",
    );
    await page.keyboard.press('Control+Enter');
    const output = page.locator('.cma-output-panel__body');
    await expect(output.getByText('sum 5')).toBeVisible();
    await expect(output.getByText('careful')).toBeVisible();
    await expect(output.getByText(/boom/)).toBeVisible();
  });

  test('runs SQL on the in-browser SQLite database', async ({ page }) => {
    await page.goto('/playground?lang=sql&template=select-basics');
    await waitForEditor(page);
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'Notebook' })).toBeVisible();
    await expect(page.getByText(/\d+ rows/)).toBeVisible();
  });

  test('is honest about languages it cannot execute', async ({ page }) => {
    await page.goto('/playground?lang=python');
    await waitForEditor(page);
    await expect(page.getByText('Execution not available')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run' })).toBeDisabled();
    await expect(page.getByText(/requires a Python interpreter/)).toBeVisible();
  });

  test('opens a runnable lesson example in the playground', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    await page
      .getByRole('button', { name: 'Try it: open this example in the playground' })
      .first()
      .click();
    await expect(page).toHaveURL(/\/playground\?lang=html&from=lesson/);
    await waitForEditor(page);
    await expect(page.locator('.cm-content')).toContainText('Hello, world!');
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(
      page.frameLocator('iframe.cma-sandbox-frame').getByRole('heading', { name: 'Hello, world!' }),
    ).toBeVisible();
  });

  test('inline "try it" runner in a lesson executes the example', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    // The runner lives in a deferred block that loads/hydrates once its placeholder scrolls into view.
    await page.getByText('Try it yourself').first().scrollIntoViewIfNeeded();
    const runner = page.locator('cma-inline-runner').first();
    await expect(runner.locator('.cm-editor')).toBeVisible({ timeout: 15000 });
    await runner.getByRole('button', { name: 'Run' }).click();
    await expect(
      runner.frameLocator('iframe.cma-sandbox-frame').getByRole('heading', { name: 'Edit me' }),
    ).toBeVisible();
  });
});
