import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test.describe('ALS sentence analysis', () => {
  for (const width of [320, 390, 1280]) {
    test(`an authored ALS sentence shows its clause map, mistakes and contrast, readable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/sentences/pat-als-02');
      await expect(page.getByRole('heading', { name: 'Sentence example' })).toBeVisible();
      const map = page.getByTestId('clause-map');
      await expect(map).toBeVisible();
      await expect(map.locator('[data-clause="bijzin"]')).toContainText('Als de server uitvalt');
      await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('uitvalt');
      await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('bel ik mijn collega');
      await expect(map.locator('[data-clause="hoofdzin"] mark')).toHaveText('bel');
      await expect(page.getByTestId('topic-sense')).toContainText('als = if');
      // Two different mistakes, each with its own reason, and the main-clause-first version.
      await expect(page.getByTestId('breakdown').getByText('Als de server valt uit, bel ik mijn collega.')).toBeVisible();
      await expect(page.getByTestId('extra-mistake')).toHaveCount(1);
      await expect(page.getByTestId('contrast')).toHaveText('Ik bel mijn collega als de server uitvalt.');
      const { scroll, inner } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
      expect(scroll).toBeLessThanOrEqual(inner);
    });
  }

  test('a sentence that has no authored analysis shows no invented clause map', async ({ page }) => {
    await page.goto('/sentences/pat-als-03');
    await expect(page.getByTestId('breakdown')).toHaveCount(0);
    await expect(page.getByTestId('clause-map')).toHaveCount(0);
  });

  test('a linked Everyday sentence gets the ALS analysis, not a regex guess, and keeps its own breakdown elsewhere', async ({ page }) => {
    await page.goto('/sentences/pat-als-reuse-career-priorities-051');
    await expect(page.getByTestId('clause-map').locator('[data-clause="bijzin"]')).toContainText('Pas als de toegang werkt');
    await expect(page.getByTestId('topic-sense')).toContainText('only when');
    await page.goto('/sentences/career-priorities-051');
    await expect(page.getByTestId('clause-map')).toHaveCount(0); // the original card is unchanged
  });
});
