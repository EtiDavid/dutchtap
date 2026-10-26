import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a Toen sentence shows the when-clause first and the inverted main clause with finite verbs marked', async ({ page }) => {
  await page.goto('/sentences/pat-toen-21');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Toen de storing begon');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('begon');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('belde');
  await expect(page.getByTestId('topic-sense')).toContainText('toen = when');
});

test('toen as the adverb "then" is one main clause, not a subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-toen-71');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('adverb');
});
