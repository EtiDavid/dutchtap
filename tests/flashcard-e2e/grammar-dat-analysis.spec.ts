import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a Dat sentence shows the main clause and the dat-clause with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-dat-26');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('De klant meldt');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('meldt');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('dat hij zich niet kan aanmelden');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('kan');
  await expect(page.getByTestId('topic-sense')).toContainText('dat = that');
});

test('a relative clause is shown between the two halves of its main clause', async ({ page }) => {
  await page.goto('/sentences/pat-dat-58');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause]')).toHaveCount(3);
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('dat ik zoek');
  await expect(page.getByTestId('topic-sense')).toContainText('relative pronoun');
});

test('a pointing "dat" is one main clause, not a subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-dat-reuse-work-143');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('pointing word');
});
