import { test, expect } from '@playwright/test';
import { VOCABULARY } from '../../lib/vocabulary';

test('vocabulary is text-only, searchable and links to its source sentence', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
  await page.goto('/');
  await page.getByRole('link', { name: /Vocabulary Words and expressions/ }).click();
  await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible();
  await expect(page.locator('main img, main audio')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search words' }).fill('op slot');
  await expect(page.getByRole('heading', { name: 'op slot doen' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByRole('link', { name: 'View sentence: home-03' }).click();
  await expect(page.getByText('Heb je de deur op slot gedaan?', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'op slot doen', exact: true }).click();
  await expect(page).toHaveURL(/\/vocabulary#op-slot-doen$/);
  await page.getByRole('searchbox', { name: 'Search words' }).fill('netjes');
  await expect(page.getByRole('heading', { name: 'opruimen', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Place', exact: true }).selectOption('school');
  await expect(page.getByText('No matching words. Try another search or filter.')).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
});

test('card vocabulary query shows only linked words and can return to the whole list', async ({ page }) => {
  await page.goto('/vocabulary?card=home-03');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'op slot doen' })).toBeVisible();
  await page.getByRole('link', { name: 'Browse all words' }).click();
  await expect(page.locator('article')).toHaveCount(VOCABULARY.length);
});
