import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('an embedded question ends in its verb and the map marks it', async ({ page }) => {
  await page.goto('/sentences/pat-indirect-23');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('waar hij woont');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('woont');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('weet');
  await expect(page.getByTestId('topic-sense')).toContainText('waar = where');
});

test('an R-word question splits the preposition before the verb', async ({ page }) => {
  await page.goto('/sentences/pat-indirect-30');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('waar je het over hebt');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('hebt');
});

test('a direct question is one main clause', async ({ page }) => {
  await page.goto('/sentences/pat-indirect-77');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('direct question');
});
