import { test, expect, type Page } from '@playwright/test';
import { CARDS } from '../../lib/flashcards/engine';
import { buildExercise } from '../../lib/flashcards/exercises';

const GUEST_KEY = 'dutchtap:flashcards:v2:guest';
const stored = (page: Page) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), GUEST_KEY);
async function startQuiz(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Start the quiz' }).click();
  // A few sentences have nothing suitable to blank and get word order instead; restart until a blank question appears.
  for (let i = 0; i < 30 && await page.getByText('Word order', { exact: true }).isVisible(); i++) {
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await page.getByRole('button', { name: 'Start the quiz' }).click();
  }
  await expect(page.getByText('Fill the blank', { exact: true })).toBeVisible();
}
// Questions are random, so read which card is shown (its English meaning) and rebuild the exercise.
async function currentCard(page: Page) {
  const english = await page.locator('article p').first().innerText();
  return CARDS.find(c => c.english === english)!;
}
async function currentBlank(page: Page, n: number) {
  const card = await currentCard(page);
  const e = buildExercise(card, 'blank', String(n))!;
  if (e.kind !== 'blank') throw new Error('expected blank');
  return { card, e };
}

test('a correct fill-the-blank answer is recorded', async ({ page }) => {
  await startQuiz(page);
  await expect(page.getByText('Fill the blank')).toBeVisible();
  const { card, e } = await currentBlank(page, 0);
  await expect(page.getByText(card.dutch, { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: e.answer, exact: true }).click();
  await expect(page.getByText('Juist! Correct.')).toBeVisible();
  await expect(page.getByText(card.dutch, { exact: true })).toBeVisible();
  const review = (await stored(page))[card.id];
  expect(review.quizCorrect).toBe(1); expect(review.quizStreak).toBe(1);
});

test('a wrong answer breaks the streak and shows the sentence', async ({ page }) => {
  await startQuiz(page);
  const { card, e } = await currentBlank(page, 0);
  await page.getByRole('button', { name: e.options.find(o => o !== e.answer)!, exact: true }).click();
  await expect(page.getByText('Not quite. Here is the sentence:')).toBeVisible();
  await expect(page.getByText(card.dutch, { exact: true })).toBeVisible();
  const review = (await stored(page))[card.id];
  expect(review.quizWrong).toBe(1); expect(review.quizStreak).toBe(0);
});

test('the next question is a word-order exercise that is checked against the sentence', async ({ page }) => {
  await startQuiz(page);
  const first = await currentBlank(page, 0);
  await page.getByRole('button', { name: first.e.answer, exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Word order')).toBeVisible();
  const card = await currentCard(page);
  expect(card.id).not.toBe(first.card.id);
  const order = buildExercise(card, 'order', '1')!;
  if (order.kind !== 'order') throw new Error('expected order');
  for (const word of order.answer) await page.locator('article button:not([disabled])', { hasText: new RegExp(`^${word}$`) }).first().click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Juist! Correct.')).toBeVisible();
  expect((await stored(page))[card.id].quizCorrect).toBe(1);
});
