import { expect, test } from '@playwright/test';
import { asGuest, currentQuizModel, savedGuestSessions, solveQuiz, switchMode } from './helpers';
import { cardFor } from '../../lib/content/cards';
import { ALS_ANALYSIS, analysisFor } from '../../lib/grammarAnalysis';

const alsByText = new Map(Object.keys(ALS_ANALYSIS).map(id => [cardFor('nl', id)!.text, id]));

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('ALS journey: lesson → study with the clause map → Dutch-first speaking → word-order quiz → reload', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:als');
  await page.getByRole('dialog', { name: 'Create a session' }).getByRole('button', { name: 'Create session', exact: true }).click();
  const session = (await savedGuestSessions(page))[0] as unknown as { cardIds: string[]; collection: string };
  expect(session.collection).toBe('grammar');
  expect(session.cardIds).toHaveLength(10);
  expect(session.cardIds.every(id => id.startsWith('pat-als-'))).toBe(true);

  // The topic guide opens in Study and carries the fact-checked toen/als/wanneer note.
  const lesson = page.getByTestId('grammar-topic-lesson');
  await expect(lesson).toBeVisible();
  await expect(lesson).toContainText('toen is the correct conjunction');

  // Study: every card shows the authored clause map for exactly that sentence.
  for (let i = 0; i < 3; i++) {
    const dutch = (await page.locator('article p[lang="nl"]').first().innerText()).trim();
    const id = alsByText.get(dutch);
    expect(id, `an authored analysis exists for "${dutch}"`).toBeTruthy();
    const record = analysisFor(id!)!;
    await page.getByText('Grammar rule & similar examples').click();
    const map = page.getByTestId('clause-map');
    await expect(map).toBeVisible();
    await expect(map.locator('[data-clause="bijzin"]')).toContainText(record.clauses.find(c => c.kind === 'bijzin')!.text);
    await expect(map.locator('[data-clause="hoofdzin"]')).toContainText(record.clauses.find(c => c.kind === 'hoofdzin')!.text);
    await expect(page.getByTestId('contrast')).toContainText(record.contrast.dutch);
    await page.getByRole('button', { name: 'Next sentence' }).click();
  }

  // Speaking: a Dutch situation first; the model sentence stays hidden until the learner checks it.
  await switchMode(page, 'speaking');
  const prompt = page.getByTestId('grammar-scenario-prompt');
  await expect(prompt).toBeVisible();
  await expect(prompt.locator('[lang="nl"]').first()).toBeVisible();
  await expect(prompt).not.toContainText(/\bals\b/i);
  const current = (await savedGuestSessions(page))[0] as unknown as { speaking?: { current?: { cardId: string } | null } };
  const cardId = current.speaking?.current?.cardId ?? session.cardIds[0];
  const model = cardFor('nl', cardId)?.text ?? '';
  if (model) await expect(page.locator('article')).not.toContainText(model);
  await page.getByRole('button', { name: /English help/ }).click();
  await expect(page.getByRole('button', { name: 'Hide English help' })).toBeVisible();
  await page.getByRole('button', { name: 'Check the Dutch' }).click();
  await expect(page.locator('article p[lang="nl"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Medium', exact: true }).click();

  // The same session, still on Speaking after a reload.
  await page.reload();
  await expect(page.locator('[data-mode="speaking"]')).toHaveAttribute('aria-current', 'page');

  // Quiz: a situation, never the answer; the tiles build a sentence the quiz accepts.
  await switchMode(page, 'quiz');
  await expect(page.getByTestId('grammar-scenario-prompt')).toBeVisible();
  const quizModel = await currentQuizModel(page);
  await expect(page.locator('article')).not.toContainText(quizModel.dutch);
  await solveQuiz(page, quizModel.dutch);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByTestId('quiz-feedback')).toContainText('Correct. +10 points');
  await expect(page.getByTestId('quiz-points')).toHaveText('10');
});

for (const width of [320, 375, 430]) {
  test(`ALS study, speaking and quiz stay readable at ${width}px and the analysis opens from the keyboard`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/flashcards?new=grammar:als');
    await page.getByRole('dialog', { name: 'Create a session' }).getByRole('button', { name: 'Create session', exact: true }).click();
    const noOverflow = async () => {
      const { scroll, inner } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
      expect(scroll).toBeLessThanOrEqual(inner);
    };
    // Keyboard: focus the disclosure and open it with Enter.
    const summary = page.getByText('Grammar rule & similar examples');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('clause-map')).toBeVisible();
    await noOverflow();
    await page.getByTestId('grammar-topic-lesson').locator('summary').focus();
    await page.keyboard.press('Enter'); // collapse the lesson again
    await switchMode(page, 'speaking');
    await expect(page.getByTestId('grammar-scenario-prompt')).toBeVisible();
    await noOverflow();
    await switchMode(page, 'quiz');
    await expect(page.getByTestId('grammar-scenario-prompt')).toBeVisible();
    await noOverflow();
  });
}
