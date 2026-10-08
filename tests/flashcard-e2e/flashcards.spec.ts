import { test, expect, type Page } from '@playwright/test';
import { CARDS, newReview, rateLevel } from '../../lib/flashcards/engine';

const GUEST_KEY = 'dutchtap:flashcards:v2:guest';
const guest = (page: Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
// Cards are drawn at random, so tests read which card is on screen.
const shownDutch = (page: Page) => page.locator('article p[lang="nl"]').first().innerText();
const cardByDutch = (dutch: string) => CARDS.find(c => c.dutch === dutch)!;
const cardByScenario = async (page: Page) => { const text = await page.locator('article p').first().innerText(); return CARDS.find(c => c.scenario === text)!; };
const stored = (page: Page) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), GUEST_KEY);

test('menu explains both modes and asks how many cards', async ({ page }) => {
  await guest(page); await page.goto('/flashcards');
  await expect(page.getByRole('heading', { name: 'Read & understand' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Say it from memory' })).toBeVisible();
  await page.getByRole('button', { name: 'Start reading' }).click();
  const dialog = page.getByRole('dialog', { name: 'How many cards do you want to practise?' });
  for (const label of ['10 cards', '20 cards', '30 cards', 'Unlimited']) await expect(dialog.getByRole('button', { name: label })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).not.toBeVisible();
  const { width, viewport } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width).toBeLessThanOrEqual(viewport);
});

test('read mode shows the Dutch, defaults to Difficult and saves the chosen level', async ({ page }) => {
  await guest(page); await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.getByRole('button', { name: '10 cards' }).click();
  const first = cardByDutch(await shownDutch(page));
  await expect(page.getByText(first.english, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Difficult', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await page.getByRole('button', { name: 'Next card' }).click();
  expect((await stored(page))[first.id].level).toBe('easy');
  // Keep going until the same card comes back: its last choice is pre-selected.
  for (let i = 0; i < 80 && (await shownDutch(page)) !== first.dutch; i++) await page.getByRole('button', { name: 'Next card' }).click();
  await expect(page.getByText(first.dutch, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Easy', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
  await expect(page.getByLabel('Your cards by level')).toContainText('Easy 1');
});

test('say-it mode shows only the picture and situation until you check', async ({ page }) => {
  await guest(page); await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Start saying' }).click();
  await page.getByRole('button', { name: 'Unlimited' }).click();
  const card = await cardByScenario(page);
  await expect(page.getByText('How do you say it?')).toBeVisible();
  await expect(page.getByText(card.dutch, { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Next card' })).not.toBeVisible();
  await expect.poll(() => page.locator('article img').evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Check the Dutch' }).click();
  await expect(page.getByText(card.dutch, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mastered', exact: true }).click();
  await page.getByRole('button', { name: 'Next card' }).click();
  const review = (await stored(page))[card.id];
  expect(review.level).toBe('mastered'); expect(review.masteredCount).toBe(1);
  await expect(page.getByText('How do you say it?')).toBeVisible();
});

test('signed-in levels load from and sync to the account', async ({ page }) => {
  const remote: Record<string, unknown> = Object.fromEntries(CARDS.map(c => [c.id, rateLevel(c.id, newReview(c.id), 'medium')]));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'flashcard_test', lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 } }));
  await page.route('**/api/flashcards', async route => {
    if (route.request().method() === 'POST') { for (const r of route.request().postDataJSON().records) remote[r.id] = r; await route.fulfill({ json: { ok: true } }); }
    else await route.fulfill({ json: { reviews: remote } });
  });
  await page.goto('/flashcards');
  await expect(page.getByText('Account progress loaded')).toBeVisible();
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.getByRole('button', { name: 'Unlimited' }).click();
  const card = cardByDutch(await shownDutch(page));
  await expect(page.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mastered', exact: true }).click();
  await page.getByRole('button', { name: 'Next card' }).click();
  await expect(page.getByText('Saved & synced')).toBeVisible();
  expect((remote[card.id] as { level: string }).level).toBe('mastered');
});
