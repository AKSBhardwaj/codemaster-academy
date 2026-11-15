import { expect, test, type Locator, type Page } from '@playwright/test';

async function answerCurrentQuestion(scope: Locator | Page): Promise<void> {
  const radio = scope.locator('input[type="radio"]').first();
  if ((await radio.count()) > 0) {
    await radio.check();
    return;
  }
  const text = scope.locator('input[type="text"]').first();
  await text.fill('required');
}

test.describe('exercises', () => {
  test('grades a multiple-choice exercise and remembers it after reload', async ({ page }) => {
    await page.goto('/exercises/html');
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Exercises' })).toBeVisible();
    await page.locator('#ex-type').selectOption('multiple-choice');
    const first = page.locator('cma-exercise-card').first();
    await expect(first.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    await first.locator('input[type="radio"]').nth(2).check();
    await first.getByRole('button', { name: 'Check answer' }).click();
    await expect(first.getByRole('status')).toContainText(/Correct!|Not quite/);
    await expect(first.getByRole('button', { name: 'Try again' })).toBeVisible();
    await page.reload();
    await page.locator('#ex-type').selectOption('multiple-choice');
    await expect(page.locator('cma-exercise-card').first().getByText(/Solved|Correct|Not quite/).first()).toBeVisible({ timeout: 10000 });
  });

  test('find-the-error exercises show code with line numbers; fill-blank accepts typed answers', async ({ page }) => {
    await page.goto('/exercises/html');
    await page.locator('#ex-type').selectOption('find-error');
    const card = page.locator('cma-exercise-card').first();
    await expect(card.locator('.cma-code__ln').first()).toBeVisible();
    await page.locator('#ex-type').selectOption('fill-blank');
    const blank = page.locator('cma-exercise-card').first();
    await blank.locator('input[type="text"]').fill('_blank');
    await blank.getByRole('button', { name: 'Check answer' }).click();
    await expect(blank.getByRole('status')).toContainText(/Correct!|Not quite/);
  });

  test('coding task offers run, checklist, solution and completion', async ({ page }) => {
    await page.goto('/exercises/html');
    await page.locator('#ex-type').selectOption('coding-task');
    const task = page.locator('cma-exercise-card').first();
    await expect(task.locator('.cm-editor')).toBeVisible();
    await expect(task.getByRole('button', { name: 'Mark as done' })).toBeDisabled();
    const boxes = task.locator('input[type="checkbox"]');
    const count = await boxes.count();
    for (let i = 0; i < count; i++) await boxes.nth(i).check();
    await task.getByRole('button', { name: 'Show solution' }).click();
    await expect(task.getByText('One possible solution')).toBeVisible();
    await task.getByRole('button', { name: 'Mark as done' }).click();
    await expect(task.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(task.getByText('Solved')).toBeVisible();
  });
});

test.describe('quizzes', () => {
  test('runs the HTML quiz end to end with results, review and retry', async ({ page }) => {
    await page.goto('/quizzes/html');
    await expect(page.getByRole('heading', { level: 1, name: 'HTML Quiz' })).toBeVisible();
    await page.getByRole('button', { name: 'Start the quiz' }).click();
    const runner = page.locator('cma-quiz-runner');
    for (let i = 0; i < 13; i++) {
      await expect(runner.getByText(`Question ${i + 1} of 13`)).toBeVisible();
      await answerCurrentQuestion(runner);
      await runner.getByRole('button', { name: i < 12 ? 'Next' : 'Finish' }).click();
    }
    await expect(runner.locator('.cma-quiz__percent')).toContainText('%');
    await expect(runner.getByText('Total questions')).toBeVisible();
    await runner.getByRole('button', { name: 'Review answers' }).click();
    await expect(runner.locator('.cma-quiz__review-item')).toHaveCount(13);
    await expect(page.getByText('Best score:')).toBeVisible();
    await runner.getByRole('button', { name: 'Retry' }).click();
    await expect(runner.getByText('Question 1 of 13')).toBeVisible();
  });

  test('inline quick check inside a lesson works without persistence', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    const quick = page.locator('cma-quiz-block cma-quiz-runner').first();
    await quick.scrollIntoViewIfNeeded();
    await quick.getByRole('button', { name: 'Start the quiz' }).click();
    await answerCurrentQuestion(quick);
    await quick.getByRole('button', { name: 'Next' }).click();
    await answerCurrentQuestion(quick);
    await quick.getByRole('button', { name: 'Finish' }).click();
    await expect(quick.locator('.cma-quiz__percent')).toBeVisible();
  });

  test('inline exercise block renders the referenced exercise', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    const card = page.locator('cma-exercise-block cma-exercise-card').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByText('Multiple choice')).toBeVisible();
    await card.locator('input[type="radio"]').nth(2).check();
    await card.getByRole('button', { name: 'Check answer' }).click();
    await expect(card.getByRole('status')).toContainText('Correct!');
  });
});
