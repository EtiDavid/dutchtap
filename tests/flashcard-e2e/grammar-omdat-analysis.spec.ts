import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('an Omdat sentence shows its subordinate and main clause with the finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-omdat-24');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Omdat de server niet reageert');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('reageert');
  await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('controleer ik de logs');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('controleer');
  await expect(page.getByTestId('topic-sense')).toContainText('omdat = because');
  await expect(page.getByTestId('contrast')).toContainText('want de server reageert niet');
});

test('a want sentence is shown as two main clauses, not as a subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-omdat-81');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(2);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('want = for/because');
});
