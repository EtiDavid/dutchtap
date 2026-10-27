import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a split separable verb is shown as one main clause with the finite verb marked', async ({ page }) => {
  await page.goto('/sentences/pat-separable-25');
  const map = page.getByTestId('clause-map');
  await expect(map).toBeVisible({ timeout: 15000 }).catch(async () => { await page.getByText('Grammar rule & similar examples').click(); });
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('bel');
  await expect(page.getByTestId('topic-sense')).toContainText('terugbellen');
});

test('a dependent clause shows the separable verb written together', async ({ page }) => {
  await page.goto('/sentences/pat-separable-45');
  const map = page.getByTestId('clause-map');
  if (!(await map.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('dat hij de computer opstart');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('opstart');
});
