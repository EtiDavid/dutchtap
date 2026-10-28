import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a relative clause interrupts the main clause and is marked separately', async ({ page }) => {
  await page.goto('/sentences/pat-relative-01');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('die naast me zit');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('zit');
  await expect(page.getByTestId('topic-sense')).toContainText('die = who, which, that');
});

test('an R-word relative clause keeps the verb at the end', async ({ page }) => {
  await page.goto('/sentences/pat-relative-70');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('waarin ze woont');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('woont');
});

test('a demonstrative die is one main clause, not a relative clause', async ({ page }) => {
  await page.goto('/sentences/pat-relative-90');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('demonstrative');
});
