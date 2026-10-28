import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a hoewel-clause ends in its verb and the clause map marks it', async ({ page }) => {
  await page.goto('/sentences/pat-hoewel-03');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('hoewel hij ziek is');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('is');
  await expect(page.getByTestId('topic-sense')).toContainText('hoewel = although');
});

test('maar joins two main clauses', async ({ page }) => {
  await page.goto('/sentences/pat-hoewel-29');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(2);
  await expect(page.getByTestId('topic-sense')).toContainText('maar = but');
});

test('ook al puts the verb directly behind al and tenzij names the exception', async ({ page }) => {
  await page.goto('/sentences/pat-hoewel-33');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('ook al is het laat');
  await expect(page.getByTestId('topic-sense')).toContainText('ook al = even though');
  await page.goto('/sentences/pat-hoewel-42');
  await expect(page.getByTestId('topic-sense')).toContainText('tenzij = unless');
});
