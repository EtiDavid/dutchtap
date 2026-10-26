import { expect, test } from '@playwright/test';
import { GRAMMAR_CARDS } from '../../lib/flashcards/engine';
import { asGuest, savedGuestSessions, seedGuestLevels, switchMode } from './helpers';

test('ALS extra questions are optional and the choice survives reload without changing the fixed parent set', async ({ page }) => {
  await asGuest(page);
  const mastered = Object.fromEntries(
    GRAMMAR_CARDS.filter(card => card.category === 'als' && card.id !== 'pat-als-01')
      .map(card => [card.id, 'mastered' as const])
  );
  await seedGuestLevels(page, mastered);
  await page.goto('/flashcards?new=grammar:als');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await dialog.getByRole('button', { name: 'Other' }).click();
  await dialog.getByLabel(/Number of cards/).fill('1');
  await dialog.getByRole('button', { name: 'Create session', exact: true }).click();
  const session = (await savedGuestSessions(page))[0] as unknown as {cardIds:string[];variations:Record<string,{enabled:boolean;unlocked:number}>};
  expect(session.cardIds).toEqual(['pat-als-01']);
  const controls = page.getByRole('region', { name: 'Variation practice' });
  const toggle = controls.getByRole('checkbox', { name: 'Practise variations of this sentence' });
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(toggle).toBeChecked();
  await expect(controls).toContainText('2 of 10 variations released');
  await page.reload();
  await expect(toggle).toBeChecked();
  let saved = (await savedGuestSessions(page))[0] as unknown as typeof session;
  expect(saved.cardIds).toEqual(['pat-als-01']);
  expect(saved.variations['pat-als-01'].enabled).toBe(true);
  expect(saved.variations['pat-als-01'].unlocked).toBe(2);

  await toggle.uncheck();
  await page.reload();
  await expect(toggle).not.toBeChecked();
  saved = (await savedGuestSessions(page))[0] as unknown as typeof session;
  expect(saved.variations['pat-als-01'].enabled).toBe(false);

  await switchMode(page, 'speaking');
  await expect(page.getByRole('button', { name: 'Check the Dutch' })).toBeVisible();
  await switchMode(page, 'quiz');
  await expect(page.getByTestId('grammar-scenario-prompt')).toBeVisible();
  saved = (await savedGuestSessions(page))[0] as unknown as typeof session;
  expect(saved.cardIds).toEqual(['pat-als-01']);
});
