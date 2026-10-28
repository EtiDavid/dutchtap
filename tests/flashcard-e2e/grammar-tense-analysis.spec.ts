import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a zijn-perfect card shows the auxiliary and the participle with the reason', async ({ page }) => {
  await page.goto('/sentences/pat-tense-33');
  const map = page.getByTestId('clause-map');
  if (!(await map.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('ben');
  await expect(page.getByTestId('topic-sense')).toContainText('perfect (zijn)');
  await expect(page.getByTestId('breakdown')).toContainText('zijn');
});

test('a perfect in a dependent clause is cut into main and dependent clause', async ({ page }) => {
  await page.goto('/sentences/pat-tense-88');
  const map = page.getByTestId('clause-map');
  if (!(await map.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('dat hij het verslag heeft gelezen');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('heeft');
});
