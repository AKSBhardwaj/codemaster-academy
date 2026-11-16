import { expect, test, type Locator } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import type { CodeTabsBlock, Lesson, Technology } from '../src/content-schema';

const COURSE = 'data-structures-algorithms';
const LANGUAGES = ['javascript', 'c', 'cpp', 'python', 'csharp', 'java'] as const;
const LABELS = ['JavaScript', 'C', 'C++', 'Python', 'C#', 'Java'];
const FILENAMES = ['main.js', 'main.c', 'main.cpp', 'main.py', 'Program.cs', 'Main.java'];

function site(baseURL: string | undefined, path: string): string {
  if (!baseURL) throw new Error('DSA browser checks require the configured baseURL.');
  return new URL(path.replace(/^\//, ''), baseURL.replace(/\/?$/, '/')).href;
}

function defaultExample(lesson: Lesson): CodeTabsBlock {
  const example = lesson.blocks.find((block) => block.type === 'code-tabs');
  if (!example || example.type !== 'code-tabs')
    throw new Error('The lesson needs language examples.');
  return example;
}

async function renderedCode(group: Locator): Promise<string> {
  return group.locator('.cma-code__line').evaluateAll((lines) =>
    lines
      .map((line) =>
        Array.from(line.children)
          .filter((token) => !token.classList.contains('cma-code__ln'))
          .map((token) => token.textContent ?? '')
          .join(''),
      )
      .join('\n'),
  );
}

test.describe('DSA in six languages', () => {
  test('the catalog opens a complete course with 28 navigable lessons', async ({
    page,
    baseURL,
  }) => {
    await page.goto(site(baseURL, 'tutorials/'));
    await page.locator('#catalog-search').fill('data structures');
    const course = page.getByRole('link', { name: 'Data Structures and Algorithms', exact: true });
    await expect(course).toBeVisible();
    await course.click();
    await expect(page.locator('h1')).toHaveText('Data Structures and Algorithms Tutorial');
    await expect(page.locator('.cma-overview__header .cma-status-badge--complete')).toBeVisible();
    await expect(page.locator('.cma-overview__header')).toContainText('28 lessons');
    await expect(page.locator('.cma-lesson-list__item')).toHaveCount(28);
    const links = await page
      .locator('.cma-lesson-list__item')
      .evaluateAll((items) => items.map((item) => (item as HTMLAnchorElement).href));
    expect(new Set(links).size).toBe(28);
    expect(links.every((url) => url.startsWith(site(baseURL, `tutorials/${COURSE}/`)))).toBe(true);
    await page.getByRole('link', { name: 'Start learning', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tutorials/${COURSE}/introduction/?$`));
    await expect(page.locator('cma-lesson h1')).toBeVisible();
    await expect(page.locator('cma-lesson .cma-lesson__meta')).toContainText('Lesson 1 of 28');
    await expect(page.locator('cma-code-tabs-block').first().getByRole('tab')).toHaveCount(6);
  });

  test('the chooser supports six languages, keyboard navigation, copying and shared output', async ({
    page,
    context,
    baseURL,
    browserName,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Chromium permits a real clipboard assertion on localhost, including its mobile project.
    if (browserName === 'chromium')
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const response = await page.request.get(
      site(baseURL, `assets/content/technologies/${COURSE}/lessons/introduction.json`),
    );
    expect(response.ok()).toBe(true);
    const lesson = (await response.json()) as Lesson;
    const example = defaultExample(lesson);
    expect(example.variants.map((variant) => variant.language)).toEqual(LANGUAGES);
    await page.goto(site(baseURL, `tutorials/${COURSE}/introduction/`));
    const group = page.locator('cma-code-tabs-block').first();
    const tabs = group.getByRole('tab');
    await expect(tabs).toHaveText(LABELS);
    const javascript = group.getByRole('tab', { name: 'JavaScript', exact: true });
    await expect(javascript).toBeEnabled();
    await expect(javascript).toHaveAttribute('aria-selected', 'true');
    const output = page.locator('cma-output-block .cma-output__text').first();
    await expect(output).toBeVisible();
    const outputText = await output.textContent();
    expect(outputText?.trim()).toBeTruthy();
    const outputNode = await output.elementHandle();
    const lessonTitle = await page.locator('cma-lesson h1').textContent();
    const originalURL = page.url();

    for (const [index, variant] of example.variants.entries()) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
      await expect(group.getByRole('tabpanel')).toHaveCount(1);
      await expect(group.locator('figure.cma-code')).toHaveCount(1);
      await expect.poll(() => renderedCode(group)).toBe(variant.code);
      await expect(group.locator('.cma-code__lang')).toHaveText(LABELS[index]);
      await expect(
        group.getByRole('button', { name: 'Copy code to clipboard', exact: true }),
      ).toBeVisible();
      const tryIt = group.getByRole('button', {
        name: 'Try it: open this example in the playground',
      });
      if (variant.language === 'javascript') await expect(tryIt).toBeVisible();
      else await expect(tryIt).toHaveCount(0);
      await expect(output).toHaveText(outputText!);
      await expect(page.locator('cma-lesson h1')).toHaveText(lessonTitle!);
      expect(page.url()).toBe(originalURL);
    }
    expect(await outputNode?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(page.locator('.cm-editor')).toHaveCount(0);
    if (browserName === 'chromium') {
      await group.getByRole('tab', { name: 'Python', exact: true }).click();
      await group.getByRole('button', { name: 'Copy code to clipboard', exact: true }).click();
      await expect(group.getByRole('button', { name: 'Copied to clipboard' })).toBeVisible();
      // The Windows clipboard stores text with CRLF even when writeText receives LF.
      expect(
        (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'),
      ).toBe(example.variants.find((variant) => variant.language === 'python')!.code);
    }

    await javascript.focus();
    await javascript.press('End');
    const java = group.getByRole('tab', { name: 'Java', exact: true });
    await expect(java).toBeFocused();
    await expect(java).toHaveAttribute('aria-selected', 'true');
    await java.press('ArrowRight');
    await expect(javascript).toBeFocused();
    await expect(javascript).toHaveAttribute('aria-selected', 'true');
    await javascript.press('ArrowLeft');
    await expect(java).toBeFocused();
    await java.press('Home');
    await expect(javascript).toBeFocused();
    await expect(javascript).toHaveAttribute('aria-selected', 'true');
    await expect(group.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('the JavaScript variant opens in the playground and produces the shared result', async ({
    page,
    baseURL,
  }) => {
    const response = await page.request.get(
      site(baseURL, `assets/content/technologies/${COURSE}/lessons/introduction.json`),
    );
    const lesson = (await response.json()) as Lesson;
    const code = defaultExample(lesson).variants.find(
      (variant) => variant.language === 'javascript',
    )!.code;
    const output = lesson.blocks.find((block) => block.type === 'output');
    if (!output || output.type !== 'output') throw new Error('The lesson needs shared output.');
    await page.goto(site(baseURL, `tutorials/${COURSE}/introduction/`));
    const group = page.locator('cma-code-tabs-block').first();
    await expect(group.getByRole('tab', { name: 'JavaScript', exact: true })).toBeEnabled();
    await group
      .getByRole('button', { name: 'Try it: open this example in the playground' })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.replace(/\/$/, '').endsWith('/playground') &&
        url.searchParams.get('lang') === 'javascript' &&
        url.searchParams.get('from') === 'lesson',
    );
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect
      .poll(async () => (await page.locator('.cm-content .cm-line').allTextContents()).join('\n'))
      .toBe(code);
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    for (const line of output.content.trim().split('\n')) {
      await expect(
        page.locator('.cma-output-panel__body').getByText(line, { exact: true }),
      ).toBeVisible();
    }
  });

  test('language tabs and code stay within narrow screens', async ({ page, baseURL }) => {
    await page.goto(site(baseURL, `tutorials/${COURSE}/introduction/`));
    const group = page.locator('cma-code-tabs-block').first();
    await expect(group.getByRole('tab').first()).toBeEnabled();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 850 });
      await group.getByRole('tab', { name: 'Java', exact: true }).click();
      await expect(group.getByRole('tab', { name: 'Java', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      expect(overflow, `The DSA lesson must fit a ${width}px viewport`).toBe(false);
      expect(
        await group.evaluate((element) => element.getBoundingClientRect().right <= innerWidth + 1),
      ).toBe(true);
      if (width === 320) {
        expect(
          await group.getByRole('tablist').evaluate((list) => list.scrollWidth > list.clientWidth),
        ).toBe(true);
      }
      await group.getByRole('tab', { name: 'Java', exact: true }).press('Home');
      await expect(group.getByRole('tab', { name: 'JavaScript', exact: true })).toBeFocused();
    }
  });

  test('examples default to JavaScript and can show each language or all 84 examples', async ({
    page,
    baseURL,
  }) => {
    await page.goto(site(baseURL, `examples/${COURSE}/`));
    const language = page.locator('#examples-language');
    const articles = page.locator('cma-examples-tech .cma-lesson > article');
    await expect(language).toBeEnabled();
    await expect(language).toHaveValue('javascript');
    await expect(articles).toHaveCount(14);
    for (const [index, value] of LANGUAGES.entries()) {
      await language.selectOption(value);
      await expect(articles).toHaveCount(14);
      await expect(articles.locator('.cma-code__lang')).toHaveText(
        Array<string>(14).fill(LABELS[index]),
      );
    }
    await language.selectOption('all');
    await expect(articles).toHaveCount(84);
    const labels = await articles.locator('.cma-code__lang').allTextContents();
    for (const label of LABELS)
      expect(labels.filter((value) => value.trim() === label)).toHaveLength(14);
    await language.selectOption('python');
    const firstTitle = (await articles.first().locator('h2').textContent())!.trim();
    await page.locator('#examples-filter').fill(firstTitle);
    await expect(articles).toHaveCount(1);
    await expect(articles.locator('.cma-code__lang')).toHaveText('Python');
    await page.locator('#examples-filter').fill('');
    await expect(articles).toHaveCount(14);
  });

  test('the linked ZIP supplies all 28 programs and expected outputs in every language', async ({
    page,
    baseURL,
  }) => {
    const overviewResponse = await page.request.get(
      site(baseURL, `assets/content/technologies/${COURSE}/overview.json`),
    );
    const overview = (await overviewResponse.json()) as Technology;
    expect(overview.lessons).toHaveLength(28);
    await page.goto(site(baseURL, `tutorials/${COURSE}/language-setup/`));
    const download = page.locator('cma-lesson a[href$="/downloads/dsa-six-languages.zip"]').first();
    await expect(download).toBeVisible();
    const url = await download.evaluate((link) => (link as HTMLAnchorElement).href);
    const response = await page.request.get(url);
    expect(response.status()).toBe(200);
    const archive = unzipSync(await response.body());
    const names = Object.keys(archive);
    expect(names).toContain('dsa-six-languages/README.md');
    expect(names.some((name) => /(^|\/)\.\.(\/|$)|\/(bin|obj|node_modules)\//.test(name))).toBe(
      false,
    );
    const programs = names.filter((name) =>
      FILENAMES.some((filename) => name.endsWith('/' + filename)),
    );
    expect(programs).toHaveLength(168);
    for (const [index, language] of LANGUAGES.entries()) {
      const languagePrograms = programs.filter((name) =>
        name.startsWith(`dsa-six-languages/${language}/`),
      );
      expect(languagePrograms).toHaveLength(28);
      for (const lesson of overview.lessons) {
        const folder = `dsa-six-languages/${language}/${lesson.slug}`;
        expect(names).toContain(`${folder}/${FILENAMES[index]}`);
        expect(strFromU8(archive[`${folder}/${FILENAMES[index]}`]).trim()).toBeTruthy();
        expect(names).toContain(`${folder}/expected-output.txt`);
        expect(strFromU8(archive[`${folder}/expected-output.txt`]).trim()).toBeTruthy();
        if (language === 'csharp') expect(names).toContain(`${folder}/DsaPractice.csproj`);
      }
    }
  });
});

test.describe('static DSA language examples', () => {
  test.skip(!process.env['STATIC_SITE'], 'Run against a built static site with STATIC_SITE=1.');

  test('the default code, shared output and metadata remain readable without JavaScript', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      const response = await page.goto(site(baseURL, `tutorials/${COURSE}/introduction/`));
      expect(response?.status()).toBe(200);
      await expect(page.locator('cma-lesson h1')).toBeVisible();
      const group = page.locator('cma-code-tabs-block').first();
      await expect(group.getByRole('tab')).toHaveText(LABELS);
      for (const tab of await group.getByRole('tab').all()) await expect(tab).toBeDisabled();
      await expect(group.getByRole('tab', { name: 'JavaScript', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(group.locator('figure.cma-code')).toHaveCount(1);
      expect((await renderedCode(group)).trim()).toBeTruthy();
      await expect(group.locator('[class^="tk-"]').first()).toBeVisible();
      await expect(page.locator('cma-output-block .cma-output__text').first()).toBeVisible();
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain(
        `/tutorials/${COURSE}/introduction/`,
      );
      const examplesResponse = await page.goto(site(baseURL, `examples/${COURSE}/`));
      expect(examplesResponse?.status()).toBe(200);
      await expect(page.locator('#examples-language')).toBeDisabled();
      await expect(page.locator('#examples-language')).toHaveValue('javascript');
      const articles = page.locator('cma-examples-tech .cma-lesson > article');
      await expect(articles).toHaveCount(14);
      await expect(articles.locator('.cma-code__lang')).toHaveText(
        Array<string>(14).fill('JavaScript'),
      );
    } finally {
      await context.close();
    }
  });

  test('tabs preserve their static nodes and become active only after hydration', async ({
    page,
    baseURL,
  }) => {
    let resumeScripts!: () => void;
    const scriptsReady = new Promise<void>((resolve) => (resumeScripts = resolve));
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*.js', async (route) => {
      await scriptsReady;
      await route.continue();
    });
    await page.goto(site(baseURL, `tutorials/${COURSE}/introduction/`), { waitUntil: 'commit' });
    const group = page.locator('cma-code-tabs-block').first();
    const javascript = group.getByRole('tab', { name: 'JavaScript', exact: true });
    let originalTab;
    let originalPanel;
    let tabId;
    try {
      await expect(page.locator('cma-lesson h1')).toBeVisible();
      await expect(javascript).toBeDisabled();
      await expect(group.getByRole('tab', { name: 'Python', exact: true })).toBeDisabled();
      await expect(group.locator('pre')).toBeVisible();
      tabId = await javascript.getAttribute('id');
      originalTab = await javascript.elementHandle();
      originalPanel = await group.getByRole('tabpanel').elementHandle();
    } finally {
      resumeScripts();
    }
    await expect(javascript).toBeEnabled();
    await expect(javascript).toHaveAttribute('id', tabId!);
    expect(await originalTab?.evaluate((tab) => tab.isConnected)).toBe(true);
    expect(await originalPanel?.evaluate((panel) => panel.isConnected)).toBe(true);
    const python = group.getByRole('tab', { name: 'Python', exact: true });
    await python.click();
    await expect(python).toHaveAttribute('aria-selected', 'true');
    await expect(group.locator('.cma-code__lang')).toHaveText('Python');
    await expect(
      group.getByRole('button', { name: 'Try it: open this example in the playground' }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
