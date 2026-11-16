import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { strFromU8, unzipSync } from 'fflate';

test('the C# and Oracle course is discoverable and downloads a source-only project', async ({
  page,
}) => {
  await page.goto('/tutorials');
  await page.locator('#catalog-search').fill('oracle');
  await page.getByRole('link', { name: 'C# .NET and Oracle Backend', exact: true }).click();
  await expect(page.locator('h1')).toContainText('C# .NET and Oracle Backend');
  await page.getByRole('link', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Meet your Reading List backend');
  await expect(page.locator('cma-tutorial-sidebar input').first()).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download the Reading List project' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('dotnet-oracle-backend.zip');
  const archive = unzipSync(await readFile((await download.path())!));
  const names = Object.keys(archive);
  expect(names).toContain('dotnet-oracle-backend/ReadingListApi/Program.cs');
  expect(names).toContain('dotnet-oracle-backend/database/02-create-table.sql');
  expect(names).toContain('dotnet-oracle-backend/browser-client/app.js');
  expect(names).toContain('dotnet-oracle-backend/scripts/test-api.ps1');
  expect(names.some((name) => /\/(bin|obj)\//.test(name))).toBe(false);
  expect(
    strFromU8(archive['dotnet-oracle-backend/ReadingListApi/ReadingListApi.csproj']),
  ).toContain('<TargetFramework>net10.0</TargetFramework>');
  await expect(page).toHaveURL(/\/tutorials\/dotnet-oracle-backend\/introduction\/?$/);
  await page.getByRole('link', { name: 'C# .NET and Oracle learning path', exact: true }).click();
  await expect(page.locator('.cma-stage')).toHaveCount(4);
  await expect(page.locator('.cma-stage .cma-status-badge--complete')).toHaveCount(4);
});

test('new backend lessons fit the screen and pass accessibility checks', async ({ page }) => {
  for (const lesson of ['introduction', 'connect-oracle', 'browser-client']) {
    await page.goto(`/tutorials/dotnet-oracle-backend/${lesson}`);
    await expect(page.locator('cma-lesson h1')).toBeVisible();
    await expect(page.locator('cma-tutorial-sidebar input').first()).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
      false,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
