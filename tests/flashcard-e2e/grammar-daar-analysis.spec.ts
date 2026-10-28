import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('daar as a conjunction sends the verb to the end, daar as an adverb does not', async ({ page }) => {
  await page.goto('/sentences/pat-daar-01');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Daar hij ziek was');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('was');
  await page.goto('/sentences/pat-daar-07');
  await expect(page.getByTestId('clause-map').locator('[data-clause="bijzin"]')).toHaveCount(0);
});

test('stel dat opens a supposition whose verb is last, followed by a question', async ({ page }) => {
  await page.goto('/sentences/pat-daar-15');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Stel dat het regent');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('regent');
});

test('zoals gebruikelijk is a short phrase: one main clause, no subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-daar-23');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
});
