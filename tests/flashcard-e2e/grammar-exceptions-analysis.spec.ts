import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('an ondanks dat-clause keeps its verb last, and the same word before a noun is only a preposition', async ({ page }) => {
  await page.goto('/sentences/pat-exceptions-01');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('ondanks dat hij ziek was');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('was');
  await page.goto('/sentences/pat-exceptions-07');
  await expect(page.getByTestId('clause-map').locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('preposition');
});

test('zonder ... te is a short phrase: one main clause and no subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-exceptions-21');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('zonder ... te');
});

test('a fronted behalve dat-clause adds a point and the main clause starts with its verb', async ({ page }) => {
  await page.goto('/sentences/pat-exceptions-25');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Behalve dat je er kunt winkelen');
  await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('kun je er ook');
});
