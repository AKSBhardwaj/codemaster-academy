import { expect, test, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Exercise, Lesson, Quiz, Technology } from '../src/content-schema';

const course = 'system-design';
const cases = [
  'design-a-library',
  'design-a-url-shortener',
  'design-a-chat-app',
  'design-a-news-feed',
  'design-a-file-upload',
];
const illustrated = [
  'follow-one-request',
  'load-balancers',
  'caches-keep-useful-copies',
  'queues-handle-work-later',
  ...cases.filter((slug) => slug !== 'design-a-news-feed'),
];
const site = (baseURL: string | undefined, path: string): string =>
  new URL(path.replace(/^\//, ''), `${baseURL!.replace(/\/$/, '')}/`).href;

async function answer(scope: Locator, question: Exercise): Promise<void> {
  if (question.type === 'fill-blank') {
    await scope.locator('input[type="text"]').fill(question.answers[0]);
  } else if (question.type === 'true-false') {
    await scope
      .locator('input[type="radio"]')
      .nth(question.correct ? 0 : 1)
      .check();
  } else if ('correctIndex' in question) {
    await scope.locator('input[type="radio"]').nth(question.correctIndex).check();
  } else {
    throw new Error('This knowledge check should not be a coding task.');
  }
}

test.describe('System Design tutorial', () => {
  test('discovery opens all 30 lessons and preserves learning progress', async ({
    page,
    baseURL,
  }) => {
    await page.goto(site(baseURL, '/tutorials/'));
    await page.locator('#catalog-search').fill('system design');
    await page.getByRole('link', { name: 'System Design', exact: true }).click();
    await expect(page.locator('h1')).toHaveText('System Design Tutorial');
    await expect(page.locator('.cma-overview__header .cma-status-badge--complete')).toBeVisible();
    await expect(page.locator('.cma-lesson-list__item')).toHaveCount(30);
    const response = await page.request.get(
      site(baseURL, `assets/content/technologies/${course}/overview.json`),
    );
    const overview = (await response.json()) as Technology;
    expect(overview.counts).toEqual({
      lessons: 30,
      exercises: 30,
      quizQuestions: 30,
      references: 30,
      examples: 30,
    });
    expect(cases.every((slug) => overview.lessons.some((lesson) => lesson.slug === slug))).toBe(
      true,
    );
    await page.getByRole('link', { name: 'Start learning', exact: true }).click();
    await expect(page).toHaveURL(/\/system-design\/introduction\/?$/);
    await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Next lesson/ }).click();
    await expect(page).toHaveURL(/\/system-design\/requirements-and-tradeoffs\/?$/);
  });

  test('all eight diagrams load and stay inside the lesson', async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const slug of illustrated) {
      await page.goto(site(baseURL, `tutorials/${course}/${slug}/`));
      const diagram = page.locator('cma-image-block img');
      await expect(diagram).toHaveCount(1);
      await diagram.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          diagram.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true);
      expect((await diagram.getAttribute('alt'))!.length).toBeGreaterThan(20);
      expect(
        await diagram.evaluate((img) => img.getBoundingClientRect().right <= innerWidth + 1),
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
        false,
      );
    }
    expect(errors).toEqual([]);
  });

  test('a capacity model runs with the expected output in the browser', async ({
    page,
    baseURL,
  }) => {
    const response = await page.request.get(
      site(baseURL, `assets/content/technologies/${course}/lessons/estimate-demand.json`),
    );
    const lesson = (await response.json()) as Lesson;
    const model = lesson.blocks.find(
      (block) => block.type === 'code' && block.language === 'javascript',
    );
    const output = lesson.blocks.find((block) => block.type === 'output');
    if (!model || model.type !== 'code' || !output || output.type !== 'output')
      throw new Error('Demand lesson needs a runnable model and result.');
    await page.goto(site(baseURL, `tutorials/${course}/estimate-demand/`));
    await page
      .getByRole('button', { name: 'Try it: open this example in the playground' })
      .first()
      .click();
    await expect(page.locator('.cm-editor')).toBeVisible();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    for (const line of output.content.trim().split('\n')) {
      await expect(
        page.locator('.cma-output-panel__body').getByText(line, { exact: true }),
      ).toBeVisible();
    }
  });

  test('practice, the full quiz, examples, and references work together', async ({
    page,
    baseURL,
  }) => {
    const exercises = (await (
      await page.request.get(site(baseURL, `assets/content/technologies/${course}/exercises.json`))
    ).json()) as { exercises: Exercise[] };
    await page.goto(site(baseURL, `exercises/${course}/`));
    await expect(page.locator('cma-exercise-card')).toHaveCount(30);
    const first = page.locator('cma-exercise-card').first();
    await answer(first, exercises.exercises[0]);
    await first.getByRole('button', { name: 'Check answer' }).click();
    await expect(first.getByRole('status')).toContainText('Correct!');

    const quiz = (await (
      await page.request.get(site(baseURL, `assets/content/technologies/${course}/quiz.json`))
    ).json()) as Quiz;
    await page.goto(site(baseURL, `quizzes/${course}/`));
    await page.getByRole('button', { name: 'Start the quiz' }).click();
    const runner = page.locator('cma-quiz-runner');
    for (const [index, question] of quiz.questions.entries()) {
      await expect(runner.getByText(`Question ${index + 1} of 30`, { exact: true })).toBeVisible();
      await answer(runner, question);
      await runner
        .getByRole('button', { name: index === 29 ? 'Finish' : 'Next', exact: true })
        .click();
    }
    await expect(runner.locator('.cma-quiz__percent')).toHaveText('100%');
    await runner.getByRole('button', { name: 'Review answers' }).click();
    await expect(runner.locator('.cma-quiz__review-item')).toHaveCount(30);
    await page.goto(site(baseURL, `references/${course}/`));
    await expect(page.locator('.cma-reference__entry')).toHaveCount(30);
    await page.goto(site(baseURL, `examples/${course}/`));
    await expect(page.locator('cma-examples-tech .cma-lesson > article')).toHaveCount(30);
    await expect(page.locator('#examples-language')).toHaveValue('all');
    await page.locator('#examples-language').selectOption('javascript');
    expect(await page.locator('cma-examples-tech .cma-lesson > article').count()).toBeGreaterThan(
      0,
    );
  });

  test('diagrams and reference groups are accessible in light and dark themes', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(60_000);
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      for (const path of [`tutorials/${course}/load-balancers/`, `references/${course}/`]) {
        await page.goto(site(baseURL, path));
        await expect(page.locator('h1')).toBeVisible();
        await page.waitForLoadState('networkidle');
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(result.violations).toEqual([]);
      }
    }
  });

  test('lessons, diagrams, and search metadata work without JavaScript', async ({
    browser,
    baseURL,
  }) => {
    test.skip(!process.env['STATIC_SITE'], 'Requires a static production build.');
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      for (const slug of ['follow-one-request', 'design-a-chat-app']) {
        const response = await page.goto(site(baseURL, `tutorials/${course}/${slug}/`));
        expect(response?.status()).toBe(200);
        await expect(page.locator('cma-lesson h1')).toBeVisible();
        const diagram = page.locator('cma-image-block img');
        await diagram.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            diagram.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
          )
          .toBe(true);
        await expect(page.locator('cma-lesson figure.cma-code').first()).toBeVisible();
        expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain(
          `/tutorials/${course}/${slug}/`,
        );
        expect(
          (await page.locator('meta[name="description"]').getAttribute('content'))!.length,
        ).toBeGreaterThan(50);
      }
    } finally {
      await context.close();
    }
  });
});
