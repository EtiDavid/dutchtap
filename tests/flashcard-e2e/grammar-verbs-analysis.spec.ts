import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('hoeven teaches niet + te, with the finite verb marked', async ({ page }) => {
  await page.goto('/sentences/pat-verbs-51');
  const map = page.getByTestId('clause-map');
  if (!(await map.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('hoef');
  await expect(page.getByTestId('topic-sense')).toContainText('hoeven');
});

test('an inseparable verb is analysed as one whole finite form', async ({ page }) => {
  await page.goto('/sentences/pat-verbs-73');
  const map = page.getByTestId('clause-map');
  if (!(await map.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('bezoek');
  await expect(page.getByTestId('topic-sense')).toContainText('inseparable');
});
