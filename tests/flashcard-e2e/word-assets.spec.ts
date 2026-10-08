import { test, expect } from '@playwright/test';

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const noAccount = (page: import('@playwright/test').Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));

test('words without files show a placeholder naming the file to add', async ({ page }) => {
  await noAccount(page);
  await page.goto('/game/article');
  const placeholder = page.getByTestId('word-image-placeholder');
  await expect(placeholder).toBeVisible();
  await expect(placeholder).toContainText('nouns/');
  await expect(placeholder).toContainText('.webp');
  await expect(page.getByRole('button', { name: /Listen/ })).not.toBeVisible();
  await page.getByRole('button', { name: 'de', exact: true }).click();
  await expect(page.getByRole('button', { name: /Listen/ })).toBeVisible();
});

test('a picture dropped into public/words replaces the placeholder', async ({ page }) => {
  await noAccount(page);
  await page.route('**/words/nouns/*.png', route => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  await page.goto('/game/article');
  // .webp 404s, then the .png fallback loads.
  await expect(page.locator('main img')).toBeVisible();
  await expect(page.getByTestId('word-image-placeholder')).toHaveCount(0);
});

test('adjective questions show a picture slot for the noun and for the adjective', async ({ page }) => {
  await noAccount(page);
  await page.goto('/game/adjective');
  await expect(page.getByTestId('word-image-placeholder')).toHaveCount(2);
});
