import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('mixed grammar shows a Dutch situation without naming the word, explains the answer, and finishes a round', async ({ page }) => {
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await expect(page.getByTestId('mixed-help')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show English help' }).click();
  await expect(page.getByTestId('mixed-help')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await expect(page.getByTestId('mixed-progress')).toContainText(`Question ${i + 1} of 8`);
    const options = page.getByTestId('mixed-option');
    await expect(options).toHaveCount(3);
    await options.nth(i % 3).click();
    await expect(page.getByTestId('mixed-feedback')).toBeVisible();
    await expect(page.getByTestId('mixed-why-correct')).toBeVisible();
    await expect(page.locator('[data-correct="true"]')).toHaveCount(1);
    await page.getByTestId('mixed-next').click();
  }
  await expect(page.getByTestId('mixed-summary')).toContainText(/You chose \d of 8 correctly/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dutchtap:grammar-mixed:v1') || '{}'));
  expect(Object.keys(saved).length).toBe(8);
  await page.getByTestId('mixed-again').click();
  await expect(page.getByTestId('mixed-progress')).toContainText('Question 1 of 8');
});

test('a wrong answer comes back more often: the saved progress marks it as last wrong', async ({ page }) => {
  await page.goto('/grammar/mixed');
  const options = page.getByTestId('mixed-option');
  for (let i = 0; i < 3; i++) {
    await options.first().click();
    const wasWrong = (await page.getByTestId('mixed-why-wrong').count()) > 0;
    const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('dutchtap:grammar-mixed:v1') || '{}')) as { lastWrong: boolean }[]);
    expect(saved[saved.length - 1].lastWrong).toBe(wasWrong);
    await page.getByTestId('mixed-next').click();
  }
});

test('the home screen links to mixed grammar next to Think in Dutch', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Mixed grammar/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Think in Dutch/ })).toBeVisible();
});
