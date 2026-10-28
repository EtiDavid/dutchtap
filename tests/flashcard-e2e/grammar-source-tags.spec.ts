import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('an Everyday sentence with a separable verb names the grammar it practises', async ({ page }) => {
  await page.goto('/sentences/school-01');
  const box = page.getByTestId('grammar-topics-here');
  await expect(box).toContainText('Separable verbs');
  await expect(box).toContainText('uitleggen');
  await box.getByRole('link', { name: /Separable verbs/ }).click();
  await expect(page.getByRole('dialog', { name: 'Create a session' })).toBeVisible();
});

test('a grammar alias shows the same topics as its original sentence', async ({ page }) => {
  await page.goto('/sentences/pat-voordat-reuse-career-support-039');
  const box = page.getByTestId('grammar-topics-here');
  await expect(box).toContainText('Voordat');
  await expect(box).toContainText('Indirect questions');
});

test('a sentence without any grammar tag shows no such box', async ({ page }) => {
  await page.goto('/sentences/shopping-01');
  await expect(page.getByTestId('grammar-topics-here')).toHaveCount(0);
});

test('an Everyday sentence that opens with a fronted element is tagged for verb-second order', async ({ page }) => {
  await page.goto('/sentences/career-meetings-035');
  const box = page.getByTestId('grammar-topics-here');
  await expect(box).toContainText('Verb second');
  await expect(box).toContainText('fronted adverb');
});

test('a sentence with zonder before a noun is tagged as the preposition contrast', async ({ page }) => {
  await page.goto('/sentences/career-changes-007');
  await expect(page.getByTestId('grammar-topics-here')).toContainText('zonder (preposition)');
});
