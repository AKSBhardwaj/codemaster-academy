import { expect, test, type Page } from '@playwright/test';

const user = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse-9' };
const HTML_LESSONS = [
  'introduction',
  'editors',
  'basic-examples',
  'elements',
  'attributes',
  'headings',
  'paragraphs',
  'formatting',
  'links',
  'images',
  'tables',
  'lists',
  'forms',
  'input-types',
  'semantic-elements',
  'audio-video',
  'apis',
  'seo',
];

async function register(page: Page): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Display name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);
  await page.getByLabel(/I understand this is a browser-local demo account/).check();
  await page.getByRole('button', { name: 'Create demo account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Hi, Ada' })).toBeVisible();
}

async function seedProgress(page: Page, lessons: string[]): Promise<void> {
  await page.evaluate(
    ({ lessons }) => {
      localStorage.setItem('cma:v1:progress:completed', JSON.stringify({ html: lessons }));
      localStorage.setItem('cma:v1:paths:enrolled', JSON.stringify(['frontend-developer']));
    },
    { lessons },
  );
}

test.describe('browser-local demo accounts', () => {
  test('guests are redirected from account pages to login with a return URL', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Log in' })).toBeVisible();
    await expect(page.getByText('Accounts live in this browser only')).toBeVisible();
  });

  test('registration validates input, creates the account and the dashboard reflects local activity', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);

    await register(page);
    await expect(page.getByText('You have not opened a lesson yet')).toBeVisible();
    await expect(page.locator('.cma-reco')).not.toHaveCount(0);

    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Mark as completed' }).click();
    await page.goto('/dashboard');
    await expect(
      page.getByRole('link', { name: /Last opened · HTML HTML Introduction/ }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tutorial progress' })).toBeVisible();
    await expect(page.getByText('1 / 18')).toBeVisible();
  });

  test('login rejects a wrong password, accepts the right one and honours the return URL', async ({
    page,
  }) => {
    await register(page);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fprofile$/);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');

    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByLabel('Display name')).toHaveValue(user.name);
  });

  test('profile edits persist across reloads and learning data can be reset', async ({ page }) => {
    await register(page);
    await page.goto('/tutorials/html/introduction');
    await page.getByRole('button', { name: 'Mark as completed' }).click();

    await page.goto('/profile');
    await expect(page.getByText('1 lesson completed')).toBeVisible();
    await page.getByLabel('Display name').fill('Ada L.');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toHaveText('Profile updated.');
    await page.reload();
    await expect(page.getByLabel('Display name')).toHaveValue('Ada L.');

    await page.getByRole('button', { name: 'Reset learning data…' }).click();
    await page.getByRole('button', { name: 'Yes, reset everything' }).click();
    await expect(page.getByText('Learning data in this browser was reset.')).toBeVisible();
    await expect(page.getByText('0 lessons completed')).toBeVisible();
  });

  test('a certificate is offered only when every published lesson of an enrolled path is completed', async ({
    page,
  }) => {
    await register(page);
    await seedProgress(page, HTML_LESSONS.slice(0, -1));
    await page.goto('/dashboard');
    await expect(page.getByText('94% · 17 / 18 published lessons')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View certificate' })).toHaveCount(0);

    await seedProgress(page, HTML_LESSONS);
    await page.reload();
    await expect(page.getByText('100% · 18 / 18 published lessons')).toBeVisible();
    await page.getByRole('button', { name: 'View certificate' }).click();
    const certificate = page.getByRole('img', {
      name: /Certificate of completion for Frontend Developer issued to Ada Lovelace/,
    });
    await expect(certificate).toBeVisible();
    await expect(certificate).toContainText('Self-issued demo certificate');
    await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  });

  test('the navbar account menu switches between guest and signed-in links', async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      'The account dropdown lives in the desktop navbar; mobile uses the offcanvas menu.',
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByRole('link', { name: 'Create account' }).first()).toBeVisible();

    await register(page);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
  });

  test('the contact form validates input and explains that nothing is stored server-side', async ({
    page,
  }) => {
    await page.goto('/contact');
    await expect(
      page.getByText('Nothing you type is stored or sent by the site itself.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Open in my email app' }).click();
    await expect(page.getByText('Please tell us your name.')).toBeVisible();
    await expect(page.getByText('Write at least 10 characters (up to 2000).')).toBeVisible();
  });
});
