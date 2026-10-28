import { expect, test } from '@playwright/test';
import { asGuest, savedGuestSessions } from './helpers';
import { analysisFor } from '../../lib/grammarAnalysis';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('the repair exercise starts with mistakes written for this session\'s own sentences', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:wanneer');
  await page.getByRole('dialog', { name: 'Create a session' }).getByRole('button', { name: 'Create session', exact: true }).click();
  const session = (await savedGuestSessions(page))[0] as unknown as { cardIds: string[] };
  const first = analysisFor(session.cardIds[0])!.mistakes[0];
  await page.getByTestId('grammar-error-repair').locator('summary').click();
  await expect(page.getByTestId('wrong-sentence')).toContainText(first.wrong);
  await page.getByRole('button', { name: 'Show explanation' }).click();
  await expect(page.getByTestId('grammar-repair-explanation')).toContainText(first.right);
  await expect(page.getByTestId('grammar-repair-explanation')).toContainText(first.why);
  await page.getByLabel('Your corrected sentence').fill(first.right);
  await page.getByRole('button', { name: 'Check against model' }).click();
  await expect(page.getByTestId('grammar-repair-status')).toContainText('matches');
});
