import { expect, test } from '@playwright/test';
import { asGuest, savedGuestSessions, switchMode } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test.describe('Grammar patterns work like flashcards', () => {
  test('a pattern tile opens Create session on that pattern, and the session has examples, a situation to speak from and a word-order quiz', async ({ page }) => {
    await page.goto('/flashcards');
    await expect(page.getByTestId('pattern-tiles').getByRole('link')).toHaveCount(9);
    await page.getByRole('link', { name: /^Als · conditions/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Create a session' });
    await expect(dialog.locator('select').first()).toHaveValue('grammar');
    await expect(dialog.locator('select').nth(1)).toHaveValue('als');
    await expect(dialog.getByRole('radio', { name: /Difficult/ })).toContainText('19 cards');
    await dialog.getByRole('button', { name: 'Create session', exact: true }).click();

    const session = (await savedGuestSessions(page))[0] as unknown as { collection: string; topic: string; cardIds: string[] };
    expect(session.collection).toBe('grammar');
    expect(session.topic).toBe('als');
    expect(session.cardIds).toHaveLength(10);
    expect(session.cardIds.every(id => id.startsWith('pat-als-'))).toBe(true);

    // Study: the sentence, its meaning and the explanation with many similar examples.
    await expect(page.locator('article').first()).toContainText(/\bals\b/i);
    await expect(page.getByTestId('grammar-notes')).toBeVisible();
    await page.getByText('Grammar rule & similar examples').click();
    await expect(page.getByRole('heading', { name: 'Similar examples' })).toBeVisible();
    expect(await page.getByRole('button', { name: /Listen to:/ }).count()).toBeGreaterThanOrEqual(10);

    // Say it: a situation first, the Dutch only after checking, then a level.
    await switchMode(page, 'speaking');
    await expect(page.getByRole('button', { name: 'Check the Dutch' })).toBeVisible();
    await expect(page.locator('article')).not.toContainText(/\bals ik\b/i);
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    for (const level of ['Difficult', 'Medium', 'Easy', 'Mastered']) await expect(page.getByRole('button', { name: level, exact: true })).toBeVisible();

    // Word order: tiles for the same sentences.
    await switchMode(page, 'quiz');
    await expect(page.getByTestId('quiz-situation')).toBeVisible();
    expect(await page.locator('article img').count()).toBe(0);
  });

  test('patterns are Dutch-only: French has no grammar tiles and never offers the collection', async ({ page }) => {
    await page.goto('/flashcards?lang=fr');
    await expect(page.getByTestId('pattern-tiles')).toHaveCount(0);
    await page.getByRole('button', { name: 'Create session' }).click();
    await expect(page.getByRole('dialog').locator('select')).toHaveCount(1); // only the place; no Collection choice
  });
});
