import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a Wanneer time clause shows both clauses with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-wanneer-18');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Wanneer ik tijd heb');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('heb');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('ga');
  await expect(page.getByTestId('topic-sense')).toContainText('wanneer = when');
});

test('a direct wanneer-question is one main clause, not a subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-wanneer-45');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('question word');
});

test('an indirect question puts the verb last in its embedded clause', async ({ page }) => {
  await page.goto('/sentences/pat-wanneer-61');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('wanneer de reparatie begint');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('begint');
});
