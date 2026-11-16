import { expect, test, type Page } from '@playwright/test';
import * as axe from 'axe-core';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/**
 * Automated accessibility audit with axe-core, run directly in the page's main frame. Sandboxed preview frames are
 * skipped (they hold learner-supplied HTML and have no script context). Any WCAG-tagged violation fails the test
 * regardless of impact, and so does any serious/critical one; remaining best-practice findings are logged for review.
 */
async function scan(page: Page, label: string): Promise<void> {
  await page.evaluate(axe.source);
  const results = await page.evaluate(
    (tags) =>
      (window as unknown as { axe: typeof axe }).axe.run(document, {
        iframes: false,
        runOnly: { type: 'tag', values: tags },
      }),
    TAGS,
  );
  const failing = results.violations.filter(
    (v) =>
      v.impact === 'serious' || v.impact === 'critical' || v.tags.some((t) => /^wcag\d/.test(t)),
  );
  const advisory = results.violations.filter((v) => !failing.includes(v));
  if (advisory.length) {
    console.log(
      `[axe advisory] ${label}: ${advisory.map((v) => `${v.id} (${v.impact}, ${v.nodes.length})`).join('; ')}`,
    );
  }
  expect(
    failing.map((v) => ({
      help: v.help,
      id: v.id,
      impact: v.impact,
      nodes: v.nodes
        .slice(0, 4)
        .map(
          (n) =>
            `${n.target.join(' ')} :: ${(n.failureSummary ?? '').split('\n').slice(1, 2).join(' ').slice(0, 220)} :: ${n.html.slice(0, 140)}`,
        ),
    })),
    label,
  ).toEqual([]);
}

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1').first()).toBeVisible();
}

const PAGES = [
  '/',
  '/tutorials',
  '/tutorials/category/web-development',
  '/tutorials/html',
  '/tutorials/html/introduction',
  '/tutorials/html/forms',
  '/tutorials/css',
  '/references/html',
  '/examples/html',
  '/tutorials/data-structures-algorithms/introduction',
  '/examples/data-structures-algorithms',
  '/exercises/html',
  '/quizzes/html',
  '/learning-paths',
  '/learning-paths/frontend-developer',
  '/search?q=html',
  '/start',
  '/settings',
  '/dashboard',
  '/contact',
  '/about',
  '/privacy-policy',
  '/credits',
  '/bookmarks',
  '/404',
];

test.describe('accessibility (axe)', () => {
  test.describe.configure({ timeout: 60_000 });

  test('DSA language tabs remain accessible with another language in both themes', async ({
    page,
  }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await open(page, '/tutorials/data-structures-algorithms/introduction');
      const group = page.locator('cma-code-tabs-block').first();
      await group.getByRole('tab', { name: 'C++', exact: true }).click();
      await expect(group.getByRole('tab', { name: 'C++', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await scan(page, `DSA C++ in ${colorScheme} mode`);
    }
  });

  for (const path of PAGES) {
    test(`${path} has no WCAG violations`, async ({ page }) => {
      await open(page, path);
      await scan(page, path);
    });
  }

  test('playground has no WCAG violations once the editor is ready', async ({ page }) => {
    await open(page, '/playground');
    await page.locator('.cm-editor').first().waitFor();
    await scan(page, '/playground');
  });

  test('search dialog and navigation menus have no WCAG violations', async ({ page, isMobile }) => {
    await open(page, '/');
    await page.locator('.cma-search-trigger').click();
    await page.getByRole('combobox').fill('html');
    await page.getByRole('option').first().waitFor();
    await scan(page, 'search dialog');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search the site' })).toBeHidden();
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('dialog').waitFor();
      await scan(page, 'mobile menu');
    } else {
      await page.getByRole('button', { name: 'Tutorials' }).click();
      await page.locator('.dropdown-menu.show').first().waitFor();
      await scan(page, 'tutorials dropdown');
    }
  });

  test('quiz in progress and results have no WCAG violations', async ({ page }) => {
    await open(page, '/quizzes/html');
    await page.getByRole('button', { name: 'Start the quiz' }).click();
    await expect(page.getByText('Question 1 of 13')).toBeVisible();
    await scan(page, 'quiz question');
    for (let i = 1; i <= 13; i++) {
      await expect(page.getByText(`Question ${i} of 13`)).toBeVisible();
      const radio = page.locator('input[type="radio"]').first();
      if ((await radio.count()) > 0) await radio.check();
      else await page.locator('input[type="text"]').first().fill('answer');
      await page.getByRole('button', { name: i === 13 ? 'Finish' : 'Next' }).click();
    }
    await expect(page.locator('.cma-quiz__percent')).toBeVisible();
    await scan(page, 'quiz results');
  });

  test('learning settings confirmations and feedback draft have no WCAG violations', async ({
    page,
  }) => {
    await open(page, '/settings');
    await page.getByRole('button', { name: 'Reset learning data', exact: true }).click();
    await scan(page, '/settings reset confirmation');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Clear all saved data', exact: true }).click();
    await scan(page, '/settings clear confirmation');
    await open(page, '/contact');
    await page
      .getByLabel('Message', { exact: true })
      .fill('The HTML lesson has a small spelling mistake.');
    await page.getByRole('button', { name: 'Prepare my message' }).click();
    await scan(page, '/contact prepared feedback');
  });

  test('dark theme pages have no WCAG violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('cma:v1:theme', JSON.stringify('dark')));
    for (const path of [
      '/',
      '/tutorials/html/introduction',
      '/exercises/html',
      '/learning-paths/frontend-developer',
    ]) {
      await open(page, path);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
      await scan(page, `${path} (dark)`);
    }
  });
});
