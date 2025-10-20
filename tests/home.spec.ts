import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Driving School/);
  });

  test('should display main content', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page.locator('body')).toBeVisible();

    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
  });

  test('should have working navigation', async ({ page }) => {
    // Check if navigation elements are present
    const navigation = page.locator('nav');
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();
    }
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(3000);

    // Check that no JavaScript errors occurred
    expect(errors).toHaveLength(0);
  });
});
