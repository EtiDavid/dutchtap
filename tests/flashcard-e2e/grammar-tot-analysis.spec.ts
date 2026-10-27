import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a tot-clause shows both clauses with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-tot-25');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('tot mijn collega mij heeft teruggebeld');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('heeft');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('wacht');
  await expect(page.getByTestId('topic-sense')).toContainText('tot = until (conjunction)');
});

test('the preposition tot is one main clause with no second verb', async ({ page }) => {
  await page.goto('/sentences/pat-tot-37');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('tot = until (preposition)');
});

test('a fixed combination such as toegang tot is not taught as a time word', async ({ page }) => {
  await page.goto('/sentences/pat-tot-45');
  await expect(page.getByTestId('topic-sense')).toContainText('fixed preposition');
  await expect(page.getByTestId('clause-map').locator('[data-clause="bijzin"]')).toHaveCount(0);
});
