import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a terwijl-clause shows both clauses with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-terwijl-26');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('terwijl jij de afwas afdroogt');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('afdroogt');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('ruim');
  await expect(page.getByTestId('topic-sense')).toContainText('terwijl = while');
});

test('terwijl as contrast is labelled differently from the time meaning', async ({ page }) => {
  await page.goto('/sentences/pat-terwijl-33');
  await expect(page.getByTestId('topic-sense')).toContainText('whereas');
});

test('tijdens is a preposition and gives one main clause', async ({ page }) => {
  await page.goto('/sentences/pat-terwijl-46');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('tijdens = during');
});
