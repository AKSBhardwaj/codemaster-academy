import { expect, test, type Locator, type Page } from '@playwright/test';

function site(baseURL: string | undefined, path = ''): string {
  if (!baseURL) throw new Error('These checks need the configured Playwright baseURL.');
  return new URL(path.replace(/^\//, ''), baseURL.replace(/\/?$/, '/')).href;
}

/** Pause actual requests, not a clock, so assertions run before these assets can arrive. */
async function holdExternalAssets(page: Page, holdStyles = false) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  const scripts = new Set<string>();
  const styles = new Set<string>();
  await page.route('**/*', async (route) => {
    const request = route.request();
    const kind = request.resourceType();
    if (kind === 'script' || (holdStyles && kind === 'stylesheet')) {
      (kind === 'script' ? scripts : styles).add(request.url());
      await released;
    }
    await route.continue();
  });
  return { release, scripts, styles };
}

async function headlineAppearance(headline: Locator) {
  return headline.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const accent = element.querySelector('span');
    if (!accent) throw new Error('The home headline is missing its highlighted phrase.');
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      color: style.color,
      accentColor: getComputedStyle(accent).color,
      background: getComputedStyle(document.body).backgroundColor,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      fitsViewport: document.documentElement.scrollWidth <= window.innerWidth + 1,
    };
  });
}

test.describe('static home loading', () => {
  test.skip(!process.env['STATIC_SITE'], 'Run against a built static site with STATIC_SITE=1.');

  test('home search waits for handlers, then trims a query submitted with Enter', async ({
    page,
    baseURL,
  }) => {
    const held = await holdExternalAssets(page);
    const input = page.getByRole('searchbox', { name: 'Search tutorials', exact: true });
    const submit = page.getByRole('button', { name: 'Find a lesson', exact: true });
    try {
      await page.goto(site(baseURL), { waitUntil: 'commit' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect.poll(() => held.scripts.size).toBeGreaterThan(0);
      await expect(input).toBeDisabled();
      await expect(submit).toBeDisabled();
      await expect(input).toHaveValue('');
    } finally {
      held.release();
    }

    await expect(input).toBeEnabled();
    await expect(submit).toBeEnabled();
    await input.fill('   python   ');
    await input.press('Enter');
    const searchPath = new URL(site(baseURL, 'search')).pathname;
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.replace(/\/$/, '') === searchPath && url.searchParams.get('q') === 'python',
    );
    await expect(page.getByRole('heading', { level: 1 })).toContainText('python');
    await expect(page.getByRole('searchbox', { name: 'Search', exact: true })).toHaveValue(
      'python',
    );
    await expect(page.getByRole('link', { name: 'Python', exact: true })).toBeVisible();
  });

  const themes = {
    light: {
      color: 'rgb(28, 27, 46)',
      accentColor: 'rgb(98, 70, 217)',
      background: 'rgb(248, 249, 253)',
    },
    dark: {
      color: 'rgb(246, 245, 251)',
      accentColor: 'rgb(183, 165, 255)',
      background: 'rgb(25, 27, 40)',
    },
  } as const;

  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} homepage keeps its font, colors and layout before external CSS and scripts arrive`, async ({
      page,
      baseURL,
    }) => {
      // Saved preference must win even when the operating system requests the other theme.
      await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
      await page.addInitScript((preference) => {
        localStorage.setItem('cma:v1:theme', JSON.stringify(preference));
      }, theme);
      const held = await holdExternalAssets(page, true);
      const headline = page.getByRole('heading', { level: 1 });
      const input = page.getByRole('searchbox', { name: 'Search tutorials', exact: true });
      let before!: Awaited<ReturnType<typeof headlineAppearance>>;
      try {
        await page.goto(site(baseURL), { waitUntil: 'commit' });
        await expect(headline).toBeVisible();
        await expect(headline).toContainText('Your next big idea');
        await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
        await expect(
          page.locator('.hero-actions').getByRole('link', { name: 'Start here', exact: true }),
        ).toBeVisible();
        await expect(page.locator('.hero-description')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
        await expect(input).toBeDisabled();
        await expect.poll(() => held.styles.size).toBeGreaterThan(0);
        await expect.poll(() => held.scripts.size).toBeGreaterThan(0);

        // Explicitly load the inline-declared face. An absent @font-face returns an empty list,
        // so a fallback font cannot make this check pass merely by looking approximately right.
        const faces = await headline.evaluate(async (element) => {
          const style = getComputedStyle(element);
          const loaded = await document.fonts.load(
            `${style.fontWeight} ${style.fontSize} "Manrope Variable"`,
            element.textContent ?? '',
          );
          return loaded.map((face) => ({ family: face.family, status: face.status }));
        });
        expect(faces.length).toBeGreaterThan(0);
        expect(
          faces.every((face) => face.family.includes('Manrope') && face.status === 'loaded'),
        ).toBe(true);
        before = await headlineAppearance(headline);
        expect(before).toMatchObject(themes[theme]);
        expect(before.fontFamily).toContain('Manrope Variable');
        expect(before.width).toBeGreaterThan(0);
        expect(before.height).toBeGreaterThan(0);
        expect(before.fitsViewport).toBe(true);
      } finally {
        held.release();
      }

      await page.waitForLoadState('load');
      await expect(input).toBeEnabled();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const after = await headlineAppearance(headline);
      expect(after).toMatchObject(themes[theme]);
      for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'] as const)
        expect(after[property], `${theme} headline ${property}`).toBe(before[property]);
      for (const dimension of ['x', 'y', 'width', 'height'] as const)
        expect(
          Math.abs(after[dimension] - before[dimension]),
          `${theme} headline ${dimension} must not shift when the full stylesheet arrives`,
        ).toBeLessThanOrEqual(1);
      expect(after.fitsViewport).toBe(true);
    });
  }
});

test.describe('search loaded on first use', () => {
  for (const firstTrigger of ['keyboard', 'navbar'] as const) {
    test(`opens first from ${firstTrigger}, closes, and reopens from both controls`, async ({
      page,
      baseURL,
    }) => {
      await page.goto(site(baseURL));
      await expect(
        page.getByRole('searchbox', { name: 'Search tutorials', exact: true }),
      ).toBeEnabled();
      await expect(page.locator('cma-search-dialog')).toHaveCount(0);

      const navbarSearch = page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('button', { name: 'Search', exact: true });
      const dialog = page.getByRole('dialog', { name: 'Search the site' });
      const input = dialog.getByRole('combobox', {
        name: 'Search tutorials, lessons and categories',
      });
      if (firstTrigger === 'keyboard') await page.keyboard.press('ControlOrMeta+k');
      else await navbarSearch.click();
      await expect(dialog).toBeVisible();
      await expect(input).toBeFocused();
      await input.fill('python');
      await expect(dialog.getByRole('option').first()).toContainText('Python');
      await input.press('Escape');
      await expect(dialog).not.toBeVisible();

      if (firstTrigger === 'keyboard') await navbarSearch.click();
      else await page.keyboard.press('ControlOrMeta+k');
      await expect(dialog).toBeVisible();
      await expect(input).toBeFocused();
      await expect(page.locator('cma-search-dialog')).toHaveCount(1);
      await dialog.getByRole('button', { name: 'Close search' }).click();
      await expect(dialog).not.toBeVisible();

      await page.keyboard.press('ControlOrMeta+k');
      await expect(input).toBeFocused();
      await input.fill('html');
      await expect(dialog.getByRole('option').first()).toContainText('HTML');
      await input.press('Enter');
      const tutorialPath = new URL(site(baseURL, 'tutorials/html')).pathname;
      await expect(page).toHaveURL((url) => url.pathname.replace(/\/$/, '') === tutorialPath);
      await expect(dialog).not.toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('HTML');
    });
  }
});
