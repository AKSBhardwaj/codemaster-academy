import { expect, test } from '@playwright/test';

test.describe('static deployment', () => {
  test.skip(!process.env['STATIC_SITE'], 'Run against a built static site with STATIC_SITE=1.');
  const site = (path: string) =>
    new URL(path.replace(/^\//, ''), process.env['E2E_BASE_URL']!.replace(/\/?$/, '/')).href;

  test('lesson content and metadata work without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const path of [
      'tutorials/html/introduction/',
      'tutorials/rust/borrowing/',
      'tutorials/web-accessibility/keep-keyboard-focus-clear/',
      'tutorials/dotnet-oracle-backend/connect-oracle/',
    ]) {
      const response = await page.goto(site(path));
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('figure.cma-code').first()).toBeVisible();
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(
        new RegExp(path + '$'),
      );
    }
    await context.close();
  });

  for (const path of ['exercises/html/', 'tutorials/html/introduction/']) {
    test(`practice controls wait for their handlers on ${path}`, async ({ page }) => {
      let resumeScripts!: () => void;
      const scriptsReady = new Promise<void>((resolve) => (resumeScripts = resolve));
      await page.route('**/*.js', async (route) => {
        await scriptsReady;
        await route.continue();
      });
      await page.goto(site(path), { waitUntil: 'commit' });
      const inline = path.startsWith('tutorials/');
      const card = page.locator(
        inline ? 'cma-exercise-block cma-exercise-card' : 'cma-exercise-card',
      );
      try {
        // Static HTML is readable, but native controls must not accept an answer that would be lost.
        await expect(page.locator('h1')).toBeVisible();
        await expect(card.locator('input[type="radio"]').first()).toBeDisabled();
        if (!inline) await expect(page.locator('#ex-type')).toBeDisabled();
        else {
          await expect(
            page.locator('cma-quiz-block').getByRole('button', { name: 'Start the quiz' }),
          ).toBeDisabled();
          await expect(
            page
              .locator('cma-inline-runner')
              .first()
              .getByRole('button', { name: 'Run', exact: true }),
          ).toBeDisabled();
        }
      } finally {
        resumeScripts();
      }
      if (!inline) await page.locator('#ex-type').selectOption('multiple-choice');
      const exercise = card.first();
      if (inline) {
        await expect(page.locator('cma-tutorial-sidebar input').first()).toBeEnabled();
        // Idle hydration also makes offscreen practice reachable by keyboard.
        await expect(
          page.locator('cma-quiz-block').getByRole('button', { name: 'Start the quiz' }),
        ).toBeEnabled();
        await exercise.scrollIntoViewIfNeeded();
      }
      await exercise.locator('input[type="radio"]').nth(2).check();
      await exercise.getByRole('button', { name: 'Check answer' }).click();
      await expect(exercise.getByRole('status')).toContainText('Correct!');
      if (inline) {
        const quiz = page.locator('cma-quiz-block').first();
        await quiz.scrollIntoViewIfNeeded();
        await quiz.getByRole('button', { name: 'Start the quiz' }).click();
        await expect(quiz.getByText('Question 1 of 2')).toBeVisible();
      }
    });
  }

  test('all tutorials are published and assets and links keep the deployment prefix', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(site('tutorials/'));
    await expect(page.getByText('Showing 149 of 149 tutorials')).toBeVisible();
    await page.locator('#catalog-search').fill('rust');
    await page.getByRole('link', { name: 'Rust', exact: true }).click();
    await page.getByRole('link', { name: 'Start learning', exact: true }).click();
    await expect(page).toHaveURL(/\/tutorials\/rust\/[^/?]+\/?$/);
    expect(page.url()).toContain(site('tutorials/rust/'));
    await expect(page.locator('cma-lesson h1')).toBeVisible();
    const response = await page.reload();
    expect(response?.status()).toBe(200);
    await expect(page.locator('cma-lesson h1')).toBeVisible();
    expect(
      await page
        .locator('.navbar-brand img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test('sitemap, manifest and 404 are served as static files', async ({ request }) => {
    const sitemap = await request.get(site('sitemap.xml'));
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('/tutorials/rust/borrowing/</loc>');
    const manifest = await (await request.get(site('site.webmanifest'))).json();
    expect(manifest.scope).toBe(new URL(site('')).pathname);
    const missing = await request.get(site('there-is-no-such-lesson/'));
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toContain('noindex');
  });

  test('the SQL worker and WebAssembly engine load under the deployment path', async ({ page }) => {
    await page.goto(site('playground/?lang=sql&template=select-basics'));
    await expect(page.locator('.cm-editor')).toBeVisible();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'Notebook' })).toBeVisible();
  });

  test('main screens fit small phones, tablets and desktops', async ({ page }) => {
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      for (const path of ['', 'tutorials/', 'tutorials/html/introduction/', 'playground/']) {
        await page.goto(site(path));
        await expect(page.locator('h1')).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(overflow, `${path} at ${width}px`).toBe(false);
        if (width < 992)
          await expect(page.getByRole('navigation', { name: 'Quick navigation' })).toBeVisible();
      }
    }
  });
});
