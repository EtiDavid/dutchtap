import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a nadat-clause shows the perfect group with the finite auxiliary marked', async ({ page }) => {
  await page.goto('/sentences/pat-nadat-14');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('nadat ze de kinderen had opgehaald');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('had');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('ging');
  await expect(page.getByTestId('topic-sense')).toContainText('nadat = after');
});

test('na is a preposition and gives one main clause', async ({ page }) => {
  await page.goto('/sentences/pat-nadat-41');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('na = after (preposition)');
});
