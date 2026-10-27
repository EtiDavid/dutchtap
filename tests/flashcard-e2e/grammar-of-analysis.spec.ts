import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('an of-clause shows the embedded question with its verb marked', async ({ page }) => {
  await page.goto('/sentences/pat-of-03');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('of de winkel open is');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('is');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('vraagt');
  await expect(page.getByTestId('topic-sense')).toContainText('of = whether');
});

test('of as or is one main clause with no dependent clause', async ({ page }) => {
  await page.goto('/sentences/pat-of-28');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('of = or');
});

test('alsof is labelled as as-if', async ({ page }) => {
  await page.goto('/sentences/pat-of-37');
  await expect(page.getByTestId('topic-sense')).toContainText('alsof = as if');
});
