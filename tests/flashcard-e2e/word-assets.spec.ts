import { test, expect } from '@playwright/test';

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const noAccount = (page: import('@playwright/test').Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));

test('article questions show the installed noun picture', async ({ page }) => {
  await noAccount(page);
  await page.goto('/game/article');
  await expect(page.locator('main img')).toBeVisible();
  await expect(page.getByTestId('word-image-placeholder')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Listen/ })).not.toBeVisible();
  await page.getByRole('button', { name: 'de', exact: true }).click();
  await expect(page.getByRole('button', { name: /Listen/ })).toBeVisible();
});

test('demonstrative questions show the installed noun picture', async ({ page }) => {
  await noAccount(page);
  await page.goto('/game/demonstrative');
  await expect(page.locator('main img')).toBeVisible();
  await expect(page.getByTestId('word-image-placeholder')).toHaveCount(0);
});

test('a PNG noun picture is used when a WebP is unavailable', async ({ page }) => {
  await noAccount(page);
  await page.route('**/words/nouns/*.webp', route => route.fulfill({ status: 404 }));
  await page.route('**/words/nouns/*.png', route => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  await page.goto('/game/article');
  await expect(page.locator('main img')).toBeVisible();
});

test('adjective questions show a picture slot for the noun and for the adjective', async ({ page }) => {
  await noAccount(page);
  await page.route('**/words/nouns/*.webp', route => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  await page.goto('/game/adjective');
  await expect(page.locator('main img')).toHaveCount(1);
  await expect(page.getByTestId('word-image-placeholder')).toHaveCount(1);
});
