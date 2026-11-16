import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** Use published content so certificate tests stay correct when lessons are added. */
async function pathLessons(page: Page): Promise<Record<string, string[]>> {
  const path = (await (
    await page.request.get('/assets/content/learning-paths/frontend-developer.json')
  ).json()) as { technologySlugs: string[] };
  const result: Record<string, string[]> = {};
  for (const slug of path.technologySlugs) {
    const response = await page.request.get(`/assets/content/technologies/${slug}/overview.json`);
    const body = await response.text();
    if (!response.ok() || !body.startsWith('{')) continue;
    const overview = JSON.parse(body) as { lessons: { slug: string }[] };
    if (overview.lessons.length) result[slug] = overview.lessons.map((lesson) => lesson.slug);
  }
  return result;
}

async function seedProgress(page: Page, completed: Record<string, string[]>): Promise<void> {
  await page.evaluate(
    ({ completed }) => {
      localStorage.setItem('cma:v1:progress:completed', JSON.stringify(completed));
      localStorage.setItem('cma:v1:paths:enrolled', JSON.stringify(['frontend-developer']));
    },
    { completed },
  );
}

test.describe('learning without an account', () => {
  test('dashboard and settings work on a first visit without credentials', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your learning journey' }),
    ).toBeVisible();
    await expect(page.getByText('You have not opened a lesson yet')).toBeVisible();
    await expect(page.locator('.cma-reco')).not.toHaveCount(0);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Learning settings' })).toBeVisible();
    await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
    await expect(page.locator('a[href="/login"], a[href="/register"]')).toHaveCount(0);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('lesson progress and bookmarks survive reloading without an account', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Mark as completed' }).click();
    await page.getByRole('button', { name: 'Bookmark this lesson', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove bookmark', exact: true })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.locator('a.cma-card[href="/tutorials/html/introduction"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tutorial progress' })).toBeVisible();
    await expect(page.locator('.cma-stat').first()).toContainText('1');
  });

  test('old demo credentials are removed while existing learning progress stays', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'cma:v1:auth:accounts',
        '[{"email":"old@example.com","passwordHash":"old-hash"}]',
      );
      localStorage.setItem('cma:v1:auth:session', '"old-user"');
      localStorage.setItem('cma:v1:progress:completed', '{"html":["introduction"]}');
    });
    await page.goto('/settings');
    await expect(page.getByText('1 lesson completed')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('cma:v1:auth:accounts'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('cma:v1:auth:session'))).toBeNull();
  });

  test('an optional nickname persists and resetting progress needs confirmation', async ({
    page,
  }) => {
    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Mark as completed' }).click();
    await page.goto('/settings');
    await page.getByLabel('Nickname (optional)').fill('Star Coder');
    await page.getByRole('button', { name: 'Save nickname' }).click();
    await expect(page.getByRole('status')).toHaveText('Nickname saved in this browser.');
    await page.reload();
    await expect(page.getByLabel('Nickname (optional)')).toHaveValue('Star Coder');
    await page.getByRole('button', { name: 'Reset learning data', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByText('1 lesson completed')).toBeVisible();
    await page.getByRole('button', { name: 'Reset learning data', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, reset my learning' }).click();
    await expect(page.getByText('0 lessons completed')).toBeVisible();
    await expect(page.getByLabel('Nickname (optional)')).toHaveValue('Star Coder');
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Hi, Star Coder' })).toBeVisible();
  });

  test('downloaded progress contains saved work and clear all preserves other sites data', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('cma:v1:progress:completed', '{"html":["introduction"]}');
      localStorage.setItem('cma:v1:learner:nickname', '"Star Coder"');
      localStorage.setItem('unrelated-setting', 'keep me');
    });
    await page.goto('/settings');
    await expect(page.getByLabel('Nickname (optional)')).toHaveValue('Star Coder');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download my progress' }).click();
    const download = await downloadPromise;
    const file = testInfo.outputPath('progress.json');
    await download.saveAs(file);
    const exported = JSON.parse(await readFile(file, 'utf8')) as { data: Record<string, unknown> };
    expect(exported.data['progress:completed']).toEqual({ html: ['introduction'] });
    expect(exported.data['learner:nickname']).toBe('Star Coder');
    expect(Object.keys(exported.data).some((key) => key.startsWith('auth:'))).toBe(false);
    await page.getByRole('button', { name: 'Clear all saved data', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, clear all saved data' }).click();
    await expect(page.getByLabel('Nickname (optional)')).toHaveValue('');
    await expect(page.getByText('0 lessons completed')).toBeVisible();
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => key.startsWith('cma:v1:')),
      ),
    ).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('unrelated-setting'))).toBe('keep me');
  });

  test('a keepsake certificate requires every published lesson of an enrolled path', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    const all = await pathLessons(page);
    const total = Object.values(all).reduce((sum, slugs) => sum + slugs.length, 0);
    const [firstTech] = Object.keys(all);
    const partial = { ...all, [firstTech]: all[firstTech].slice(0, -1) };
    await seedProgress(page, partial);
    await page.reload();
    await expect(
      page.getByText(
        `${Math.round(((total - 1) / total) * 100)}% · ${total - 1} / ${total} published lessons`,
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'View certificate' })).toHaveCount(0);
    await seedProgress(page, all);
    await page.reload();
    await expect(page.getByText(`100% · ${total} / ${total} published lessons`)).toBeVisible();
    await page.getByRole('button', { name: 'View certificate' }).click();
    const certificate = page.getByRole('img', {
      name: /Certificate of completion for Frontend Developer issued to Curious learner/,
    });
    await expect(certificate).toBeVisible();
    await expect(certificate).toContainText('not an official school or job certificate');
    await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  });

  test('desktop and mobile navigation expose learning tools without account actions', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: isMobile ? 'Open menu' : 'My learning menu' }).click();
    const menu = isMobile
      ? page.getByRole('navigation', { name: 'Mobile', exact: true })
      : page.locator('.dropdown-menu.show');
    await expect(menu.getByRole('link', { name: 'My learning', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Learning settings', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: /Log in|Create account/ })).toHaveCount(0);
  });

  test('feedback validates and downloads the latest message without pretending to send it', async ({
    page,
  }, testInfo) => {
    await page.goto('/contact');
    await expect(
      page.getByText(/Nothing you type is stored or sent by the site itself/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Prepare my message' }).click();
    await expect(page.getByText('Write at least 10 characters (up to 2000).')).toBeVisible();
    await page.getByLabel('Message', { exact: true }).fill('              ');
    await page.getByRole('button', { name: 'Prepare my message' }).click();
    await expect(page.getByText('Write at least 10 characters (up to 2000).')).toBeVisible();
    await page
      .getByLabel('Message', { exact: true })
      .fill('Please explain the HTML heading example.');
    await page.getByRole('button', { name: 'Prepare my message' }).click();
    await expect(page.getByLabel('Ready to copy')).toHaveValue(
      /Please explain the HTML heading example/,
    );
    await page
      .getByLabel('Message', { exact: true })
      .fill('The HTML heading example needs one more step.');
    await page.getByRole('button', { name: 'Prepare my message' }).click();
    await expect(page.getByLabel('Ready to copy')).toHaveValue(
      /The HTML heading example needs one more step/,
    );
    await expect(page.getByRole('button', { name: 'Open in my email app' })).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download message' }).click();
    const file = testInfo.outputPath('feedback.txt');
    await (await downloadPromise).saveAs(file);
    expect(await readFile(file, 'utf8')).toContain('The HTML heading example needs one more step.');
    await expect(page.getByRole('status')).toContainText('Nothing has been sent.');
  });
});
