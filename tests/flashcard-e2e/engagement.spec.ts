import { test, expect, type Page } from '@playwright/test';
import { CARDS, newReview, rateLevel, type Reviews } from '../../lib/flashcards/engine';
import { notesFor } from '../../lib/grammarNotes';

const GUEST_KEY = 'dutchtap:flashcards:v2:guest';
const guest = (page: Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
const shownDutch = (page: Page) => page.locator('article p[lang="nl"]').first().innerText();
const cardByDutch = (dutch: string) => CARDS.find(c => c.dutch === dutch)!;
async function startReading(page: Page) {
  await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.getByRole('button', { name: '10 cards' }).click();
  await expect(page.getByRole('button', { name: 'Next card' })).toBeVisible();
}
async function startBlankQuiz(page: Page) {
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Start the quiz' }).click();
  // A few sentences get word order instead of a blank; restart until a blank question appears.
  for (let i = 0; i < 30 && await page.getByText('Word order', { exact: true }).isVisible(); i++) {
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await page.getByRole('button', { name: 'Start the quiz' }).click();
  }
  await expect(page.getByText('Fill the blank', { exact: true })).toBeVisible();
}

test.describe('progress picture, streak and milestones', () => {
  test('the menu shows a level bar and an encouraging streak message', async ({ page }) => {
    await guest(page); await page.goto('/flashcards');
    await expect(page.getByTestId('streak')).toContainText('Practise today to start a streak.');
    const bar = page.getByRole('img', { name: /Difficult 300/ });
    await expect(bar).toBeVisible();
    await expect(page.getByLabel('Your cards by level')).toContainText('0 of 300 mastered');
    await expect(page.getByLabel('Your cards by level')).toContainText('10 more mastered cards until 10.');
  });

  test('practising starts a streak that is shown on the menu, the quiz and Home', async ({ page }) => {
    await guest(page); await startReading(page);
    await page.getByRole('button', { name: 'Next card' }).click();
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await expect(page.getByTestId('streak')).toContainText('You practised today. Nice start!');
    await page.getByRole('link', { name: /Quiz/ }).click();
    await expect(page.getByTestId('streak')).toContainText('You practised today');
    await page.getByRole('link', { name: /Home/ }).click();
    await expect(page.getByTestId('streak')).toContainText('You practised today');
  });

  test('a streak from yesterday is kept alive with no penalty message', async ({ page }) => {
    await guest(page);
    const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() - offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    await page.addInitScript(days => localStorage.setItem('dutchtap:practice-days:v1', JSON.stringify(days)), [day(3), day(2), day(1)]);
    await page.goto('/flashcards');
    await expect(page.getByTestId('streak')).toContainText('3-day streak. Practise today to keep it going.');
  });

  test('marking the 10th card Mastered shows a milestone message, and it can be dismissed', async ({ page }) => {
    await guest(page);
    const now = new Date('2026-10-09T10:00:00Z');
    const seeded: Reviews = Object.fromEntries(CARDS.slice(0, 9).map(c => [c.id, rateLevel(c.id, newReview(c.id, now), 'mastered', now)]));
    await page.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [GUEST_KEY, JSON.stringify(seeded)]);
    await page.goto('/flashcards');
    await expect(page.getByLabel('Your cards by level')).toContainText('9 of 300 mastered');
    await page.getByRole('button', { name: 'Start reading' }).click();
    await page.getByRole('button', { name: 'Unlimited' }).click();
    // Already-mastered cards cannot cross the milestone, so move on until a new one appears.
    for (let i = 0; i < 10 && !(await page.getByTestId('milestone').isVisible()); i++) {
      await page.getByRole('button', { name: 'Mastered', exact: true }).click();
      await page.getByRole('button', { name: 'Next card' }).click();
    }
    await expect(page.getByTestId('milestone')).toContainText('10 cards mastered!');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByTestId('milestone')).toHaveCount(0);
  });
});

test.describe('refreshing keeps you where you were', () => {
  test('a flashcard session resumes on the same card, level and reveal state after a reload', async ({ page }) => {
    await guest(page); await startReading(page);
    const dutch = await shownDutch(page);
    await page.getByRole('button', { name: 'Medium', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Read & understand' })).toHaveCount(0);
    await expect(page.getByText(dutch, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'true');
    // The rest of the set is still there: rating a card moves on to another one.
    await page.getByRole('button', { name: 'Next card' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Next card' })).toBeVisible();
    expect(await shownDutch(page)).not.toBe(dutch);
  });

  test('a say-it session resumes with the answer still revealed', async ({ page }) => {
    await guest(page); await page.goto('/flashcards');
    await page.getByRole('button', { name: 'Start saying' }).click();
    await page.getByRole('button', { name: 'Unlimited' }).click();
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    const dutch = await shownDutch(page);
    await page.reload();
    await expect(page.getByText(dutch, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check the Dutch' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Next card' })).toBeVisible();
  });

  test('finishing a session clears it so the next visit starts at the menu', async ({ page }) => {
    await guest(page); await startReading(page);
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Read & understand' })).toBeVisible();
  });

  test('a quiz question resumes after a reload, including an answered state', async ({ page }) => {
    await guest(page); await startBlankQuiz(page);
    const english = await page.locator('article p').first().innerText();
    await page.reload();
    await expect(page.getByText('Fill the blank', { exact: true })).toBeVisible();
    await expect(page.getByText(english, { exact: true })).toBeVisible();
    const card = CARDS.find(c => c.english === english)!;
    // Answer with whichever option is shown first, then reload again.
    await page.locator('article button').first().click();
    await expect(page.getByText(card.dutch, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(card.dutch, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    // The answer was counted once, not again after the reload.
    const stored = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), GUEST_KEY);
    expect(stored[card.id].quizCorrect + stored[card.id].quizWrong).toBe(1);
  });
});

test.describe('navigation', () => {
  test('every learning page has a tab bar, and the current page is marked', async ({ page }) => {
    await guest(page);
    for (const [path, tab] of [['/flashcards', 'Flashcards'], ['/quiz', 'Quiz'], ['/vocabulary', 'Words'], ['/sentences/shopping-01', null]] as const) {
      await page.goto(path);
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav).toBeVisible();
      for (const name of ['Home', 'Flashcards', 'Quiz', 'Words']) await expect(nav.getByRole('link', { name: new RegExp(name) })).toBeVisible();
      if (tab) await expect(nav.getByRole('link', { name: new RegExp(tab), includeHidden: false })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('leaving a flashcard session for the quiz and coming back continues the same card', async ({ page }) => {
    await guest(page); await startReading(page);
    const dutch = await shownDutch(page);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Quiz/ }).click();
    await expect(page.getByRole('heading', { name: 'Quiz' })).toBeVisible();
    // The Flashcards tab tells the learner a session is waiting.
    const back = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Flashcards/ });
    await expect(back).toContainText('session in progress');
    await back.click();
    await expect(page.getByText(dutch, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next card' })).toBeVisible();
  });

  test('from a sentence page the learner can go back or continue flashcards', async ({ page }) => {
    await guest(page); await startReading(page);
    const dutch = await shownDutch(page);
    const card = cardByDutch(dutch);
    await page.goto(`/sentences/${card.id}`);
    await page.getByRole('link', { name: 'Continue flashcards' }).click();
    await expect(page.getByText(dutch, { exact: true })).toBeVisible();
  });

  test('the back button on a sentence page returns to the page the learner came from', async ({ page }) => {
    await guest(page); await page.goto('/vocabulary');
    await page.getByRole('link', { name: /View sentence/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Sentence example' })).toBeVisible();
    await page.getByRole('button', { name: /Back/ }).click();
    await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible();
  });
});

test.describe('grammar notes', () => {
  test('a flashcard has an expandable grammar rule with similar examples that can be heard', async ({ page }) => {
    await guest(page); await startReading(page);
    const card = cardByDutch(await shownDutch(page));
    const note = notesFor(card.id)!;
    const notes = page.getByTestId('grammar-notes');
    await notes.getByText('Grammar rule & similar examples').click();
    await expect(notes.getByText(note.rule, { exact: true })).toBeVisible();
    for (const example of note.examples) {
      await expect(notes.getByText(example.dutch, { exact: true })).toBeVisible();
      await expect(notes.getByText(example.english, { exact: true })).toBeVisible();
    }
    await expect(notes.getByText(card.variation, { exact: true })).toBeVisible();
    await expect(notes.getByRole('button', { name: /Listen to:/ })).toHaveCount(note.examples.length);
  });

  test('the notes are in the quiz after answering and open by default on the sentence page', async ({ page }) => {
    await guest(page); await startBlankQuiz(page);
    await expect(page.getByTestId('grammar-notes')).toHaveCount(0);
    await page.locator('article button').first().click();
    await expect(page.getByTestId('grammar-notes')).toBeVisible();

    const card = CARDS.find(c => c.id === 'school-09')!;
    await page.goto(`/sentences/${card.id}`);
    await expect(page.getByText(notesFor(card.id)!.rule, { exact: true })).toBeVisible();
  });

  test('the pages stay within the screen width with the tab bar', async ({ page }) => {
    await guest(page);
    for (const path of ['/flashcards', '/quiz', '/vocabulary', '/sentences/school-09']) {
      await page.goto(path);
      const { width, viewport } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
      expect(width, path).toBeLessThanOrEqual(viewport);
    }
  });
});
