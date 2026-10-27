import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a sinds-clause keeps its verb last, marked in the clause map', async ({ page }) => {
  await page.goto('/sentences/pat-connectors-01');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('sinds ik in Utrecht woon');
  await expect(map.locator('[data-clause="bijzin"] mark')).toHaveText('woon');
  await expect(page.getByTestId('topic-sense')).toContainText('sinds = since');
});

test('sinds before a time word is a preposition: one main clause, no subordinate clause', async ({ page }) => {
  await page.goto('/sentences/pat-connectors-05');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="hoofdzin"]')).toHaveCount(1);
  await expect(map.locator('[data-clause="bijzin"]')).toHaveCount(0);
  await expect(page.getByTestId('topic-sense')).toContainText('preposition');
});

test('a fronted aangezien-clause makes the main clause start with its verb', async ({ page }) => {
  await page.goto('/sentences/pat-connectors-22');
  const map = page.getByTestId('clause-map');
  await expect(map.locator('[data-clause="bijzin"]')).toContainText('Aangezien de winkel dicht is');
  await expect(map.locator('[data-clause="hoofdzin"]')).toContainText('gaan we morgen terug');
});

test('the pattern tiles list the new topic under its own heading', async ({ page }) => {
  await page.goto('/flashcards');
  await expect(page.getByText('Purpose, cause & conditions')).toBeVisible();
  await expect(page.getByRole('link', { name: /More conjunctions/ })).toBeVisible();
});
