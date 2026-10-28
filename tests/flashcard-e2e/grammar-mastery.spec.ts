import { expect, test } from '@playwright/test';
import { asGuest, savedGuestSessions, switchMode } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('learn verbs before speaking: guide opens in Study but does not expose answers in recall modes', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:verbs');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('select').first()).toHaveValue('grammar');
  await expect(dialog.locator('select').nth(1)).toHaveValue('verbs');
  await dialog.getByRole('button', { name: 'Create session', exact: true }).click();
  const sessionId = new URL(page.url()).searchParams.get('session');
  expect(sessionId).toBeTruthy();

  const before = (await savedGuestSessions(page))[0] as unknown as {cardIds:string[]};
  expect(before.cardIds).toHaveLength(10);
  const guide = page.getByTestId('grammar-topic-lesson');
  await expect(guide).toHaveAttribute('open', '');
  await expect(guide).toContainText('I don\'t have to work tomorrow.');
  await expect(guide).toContainText('Ik heb de afwas gedaan.');

  // The learner can close the explanation without losing the chosen session.
  await guide.getByTestId('grammar-topic-lesson-summary').click();
  await expect(guide).not.toHaveAttribute('open', '');
  await guide.getByTestId('grammar-topic-lesson-summary').click();
  await expect(guide).toHaveAttribute('open', '');

  // Changing modes collapses the lesson, making recall genuine.
  await switchMode(page, 'speaking');
  await expect(page.getByRole('button', { name: 'Check the Dutch' })).toBeVisible();
  await expect(guide).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Check the Dutch' }).click();
  await page.getByRole('button', { name: 'Medium', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('session-name')).toBeVisible();

  await switchMode(page, 'quiz');
  await expect(page.getByTestId('grammar-scenario-prompt')).toBeVisible();
  await expect(guide).not.toHaveAttribute('open', '');
  const after = (await savedGuestSessions(page))[0] as unknown as {cardIds:string[]};
  expect(after.cardIds).toEqual(before.cardIds);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await switchMode(page, 'study');
  await expect(guide).toHaveAttribute('open', '');
});

test('expanded lessons exist for V2, because and reported dat', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:omdat');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  const guide = dialog.getByTestId('grammar-topic-lesson');
  await guide.getByTestId('grammar-topic-lesson-summary').click();
  await expect(guide).toContainText('Omdat versus want versus daarom');
  await expect(guide).toContainText('Omdat het regent, neem ik de bus.');
  await dialog.locator('select').nth(1).selectOption('dat');
  await guide.getByTestId('grammar-topic-lesson-summary').click();
  await expect(guide).toContainText('DAT is not always a conjunction');
  await dialog.locator('select').nth(1).selectOption('inversion');
  await guide.getByTestId('grammar-topic-lesson-summary').click();
  await expect(guide).toContainText('Count phrases, not individual words.');
});
