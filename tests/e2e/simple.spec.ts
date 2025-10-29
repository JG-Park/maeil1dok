import { test, expect } from '@playwright/test';

test('메인 페이지 접근', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/매일일독/);
});