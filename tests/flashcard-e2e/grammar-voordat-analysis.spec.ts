import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a voordat-clause shows both clauses with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-voordat-25');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('voordat we het voorstel opsturen');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('opsturen');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('bellen');
  await expect(page.getByTestId('topic-sense')).toContainText('voordat = before');
});

test('voor is a preposition and gives one main clause', async ({ page }) => {
  await page.goto('/sentences/pat-voordat-35');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('voor = before (preposition)');
});
