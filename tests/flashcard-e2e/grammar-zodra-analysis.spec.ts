import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a zodra-clause shows both clauses with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-zodra-25');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('zodra iemand de deur forceert');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('forceert');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('gaat');
  await expect(page.getByTestId('topic-sense')).toContainText('zodra = as soon as');
});

test('zolang is labelled as a condition and keeps the verb last', async ({ page }) => {
  await page.goto('/sentences/pat-zodra-27');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('betaalt');
  await expect(page.getByTestId('topic-sense')).toContainText('zolang = as long as');
});

test('meteen is an adverb and gives one main clause', async ({ page }) => {
  await page.goto('/sentences/pat-zodra-23');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('meteen = immediately');
});
