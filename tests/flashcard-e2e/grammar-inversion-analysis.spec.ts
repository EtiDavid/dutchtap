import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a fronted time word keeps the finite verb second and the subject behind it', async ({ page }) => {
  await page.goto('/sentences/pat-inversion-01');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause]')).toHaveCount(1);
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('werk');
  await expect(page.getByTestId('topic-sense')).toContainText('fronted time');
});

test('a fronted object is shown as one main clause with the verb second', async ({ page }) => {
  await page.goto('/sentences/pat-inversion-41');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('Dit boek heb ik');
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('heb');
  await expect(page.getByTestId('topic-sense')).toContainText('fronted object');
});
