import { expect, test } from '@playwright/test';

test.describe('keyboard navigation', () => {
  test('section links stay on the current lesson', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    const link = page.getByRole('link', { name: 'Link to section What does HTML do?' });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tutorials\/html\/introduction\/?#what-does-html-do$/);
    await expect(page.locator('h1')).toHaveText('HTML Introduction');
  });
  test('the skip link is the first tab stop and moves focus to the main content', async ({
    page,
  }) => {
    await page.goto('/tutorials/html/introduction');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    await expect(page).toHaveURL(/\/tutorials\/html\/introduction\/?#main-content$/);
  });

  test('navbar dropdowns open, move focus and close with the keyboard', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Dropdowns only exist in the desktop navbar.');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Tutorials' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: /All tutorials/ }).first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('.dropdown-menu.show .dropdown-item').last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('the search dialog is fully keyboard operable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('html');
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/^http:\/\/[^/]+\/$/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('moving between lessons returns focus to the main content', async ({ page }) => {
    await page.goto('/tutorials/html/introduction');
    // Exercise client-side navigation after startup; native links also work before hydration.
    await expect(page.locator('cma-tutorial-sidebar input').first()).toBeEnabled();
    const next = page.getByRole('link', { name: /Next/ }).first();
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tutorials\/html\/editors$/);
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('the escape key closes the mobile menu and restores focus', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The offcanvas menu only exists on small screens.');
    await page.goto('/');
    const open = page.getByRole('button', { name: 'Open menu' });
    await open.focus();
    await open.press('Enter');
    await expect(page.locator('.offcanvas.show, [role="dialog"]').first()).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(
      page.locator('.offcanvas.show, [role="dialog"]').first().locator(':focus'),
    ).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(open).toBeFocused();
  });
});
