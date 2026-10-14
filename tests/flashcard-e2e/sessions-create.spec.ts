import { test, expect } from '@playwright/test';
import { CARDS } from '../../lib/flashcards/engine';
import { asGuest, createSession, GUEST_LEVELS_KEY, savedGuestSessions, seedGuestLevels, rateSpeaking } from './helpers';

const school = CARDS.filter(c => c.category === 'school').map(c => c.id);
const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Create session' }).click();
  return page.getByRole('dialog', { name: 'Create a session' });
};

test.describe('the session dashboard and the create dialog', () => {
  test('an empty dashboard explains what a session is and offers Create session', async ({ page }) => {
    await asGuest(page); await page.goto('/flashcards');
    await expect(page.getByTestId('empty')).toContainText('A session is a fixed set of sentences');
    await expect(page.getByRole('button', { name: 'Create session' })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Active \(0\/5\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Completed \(0\)/ })).toBeVisible();
    await expect(page.getByTestId('sync-status')).toContainText('Saved on this device');
  });

  test('defaults to All places, 10 cards and Difficult, and shows the count for all four levels', async ({ page }) => {
    await asGuest(page);
    const dialog = await open(page);
    await expect(dialog.getByLabel('Place (topic)')).toHaveValue('all');
    await expect(dialog.getByRole('button', { name: '10', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByRole('radio', { name: /Difficult/ })).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByRole('radio', { name: /Difficult/ })).toContainText('600 cards'); // cards without a record are Difficult
    for (const level of ['Medium', 'Easy', 'Mastered']) {
      await expect(dialog.getByRole('radio', { name: new RegExp(level) })).toBeDisabled();
      await expect(dialog.getByRole('radio', { name: new RegExp(level) })).toContainText('0 cards');
    }
    await expect(dialog.getByTestId('why-easy')).toContainText('There are no Easy cards here');
    await expect(dialog.getByLabel('Session name')).toHaveAttribute('placeholder', /^All places · 10 Difficult cards · \d+ \w+$/);
  });

  test('counts use the latest global levels for the chosen place, and disabled levels explain themselves', async ({ page }) => {
    await asGuest(page);
    await seedGuestLevels(page, Object.fromEntries(school.slice(0, 12).map(id => [id, 'easy' as const])));
    const dialog = await open(page);
    await dialog.getByLabel('Place (topic)').selectOption('school');
    await dialog.getByRole('button', { name: '20', exact: true }).click();
    await expect(dialog.getByRole('radio', { name: /Easy/ })).toContainText('12 cards');
    await expect(dialog.getByRole('radio', { name: /Easy/ })).toBeDisabled();
    await expect(dialog.getByTestId('why-easy')).toHaveText('Easy has 12 cards; you requested 20. Choose fewer cards or practise Difficult cards and rate them Easy.');
    await expect(dialog.getByRole('radio', { name: /Difficult/ })).toContainText(`${school.length - 12} cards`);
    await dialog.getByRole('button', { name: '10', exact: true }).click();
    await expect(dialog.getByRole('radio', { name: /Easy/ })).toBeEnabled();
    await dialog.getByRole('radio', { name: /Easy/ }).click();
    await dialog.getByRole('button', { name: 'Create session' }).click();
    await page.waitForURL(/session=/);
    const [session] = await savedGuestSessions(page);
    expect(session.cardIds).toHaveLength(10);
    expect(new Set(session.cardIds).size).toBe(10);
    expect(session.cardIds.every(id => school.slice(0, 12).includes(id))).toBe(true); // only Easy school cards
  });

  test('a selected level that stops being available is flagged, never silently replaced', async ({ page }) => {
    await asGuest(page);
    await seedGuestLevels(page, Object.fromEntries(school.slice(0, 12).map(id => [id, 'easy' as const])));
    const dialog = await open(page);
    await dialog.getByLabel('Place (topic)').selectOption('school');
    await dialog.getByRole('radio', { name: /Easy/ }).click();
    await expect(dialog.getByRole('button', { name: 'Create session' })).toBeEnabled();
    await dialog.getByRole('button', { name: '20', exact: true }).click();
    await expect(dialog.getByTestId('level-unavailable')).toContainText('Easy has 12 cards; you requested 20');
    await expect(dialog.getByTestId('level-unavailable')).toContainText('choose another level or fewer cards');
    await expect(dialog.getByRole('radio', { name: /Easy/ })).toHaveAttribute('aria-checked', 'true'); // not swapped for another level
    await expect(dialog.getByRole('button', { name: 'Create session' })).toBeDisabled();
    expect(await savedGuestSessions(page)).toHaveLength(0);
  });

  test('a custom count is validated, and creation is disabled when no level can supply it', async ({ page }) => {
    await asGuest(page);
    const dialog = await open(page);
    await dialog.getByRole('button', { name: 'Other' }).click();
    for (const bad of ['0', '101', 'abc', '']) {
      await dialog.getByLabel(/Number of cards/).fill(bad);
      await expect(dialog.getByRole('button', { name: 'Create session' })).toBeDisabled();
      await expect(dialog.getByRole('alert')).toContainText('from 1 to 100');
    }
    await dialog.getByLabel(/Number of cards/).fill('15');
    await expect(dialog.getByRole('button', { name: 'Create session' })).toBeEnabled();
    await dialog.getByLabel('Place (topic)').selectOption('school');
    await dialog.getByLabel(/Number of cards/).fill('99');
    await expect(dialog.getByRole('button', { name: 'Create session' })).toBeDisabled();
    await expect(dialog.getByTestId('level-unavailable')).toContainText('No level has 99 cards for School');
  });

  test('creates the fixed set once, with a useful default name that can be changed', async ({ page }) => {
    await asGuest(page);
    const id = await createSession(page, { topic: 'shopping', count: 10 });
    await expect(page.getByTestId('session-name')).toHaveText(/^Shopping · 10 Difficult cards · \d+ \w+$/);
    const [session] = await savedGuestSessions(page);
    expect(session.id).toBe(id);
    expect(session.cardIds).toHaveLength(10);
    expect(session.cardIds.every(card => CARDS.find(c => c.id === card)!.category === 'shopping')).toBe(true);
    await page.getByRole('button', { name: 'Rename' }).click();
    await page.getByLabel('Session name').fill('Bakery words');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('session-name')).toHaveText('Bakery words');
    await page.reload();
    await expect(page.getByTestId('session-name')).toHaveText('Bakery words');
    expect((await savedGuestSessions(page))[0].cardIds).toEqual(session.cardIds);
  });

  test('the create dialog is keyboard accessible: labelled, Tab stays inside, Escape closes and focus returns', async ({ page }) => {
    await asGuest(page);
    await page.goto('/flashcards');
    const trigger = page.getByRole('button', { name: 'Create session' });
    await trigger.focus(); await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Create a session' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true); }
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Shift+Tab'); expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true); }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe('limits and deleting', () => {
  test('allows five active sessions, then explains how to make room', async ({ page }) => {
    await asGuest(page);
    for (let i = 0; i < 5; i++) await createSession(page, { count: 10, name: `Session ${i + 1}` });
    await page.goto('/flashcards');
    await expect(page.getByRole('button', { name: /Active \(5\/5\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create session' })).toBeDisabled();
    await expect(page.getByTestId('limit-hint')).toContainText('Finish one (complete Speaking and the Quiz) or delete one');
    expect(await savedGuestSessions(page)).toHaveLength(5);
  });

  test('deleting needs one clear confirmation, removes only that session, and keeps global card levels', async ({ page }) => {
    await asGuest(page);
    await createSession(page, { count: 10, name: 'Keep me' });
    await createSession(page, { count: 10, name: 'Delete me' });
    await page.locator('[data-mode="speaking"]').click();
    await rateSpeaking(page, 'Mastered'); // sets one global level
    const levelsBefore = await page.evaluate(k => localStorage.getItem(k), GUEST_LEVELS_KEY);
    expect(levelsBefore).toContain('mastered');
    await page.goto('/flashcards');
    const card = page.locator('[data-testid="session-card"]', { hasText: 'Delete me' });
    await card.getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete this session?' });
    await expect(dialog).toContainText('card levels');
    await expect(dialog).toContainText('stay as they are');
    await expect(dialog).toContainText('other sessions are not affected');
    await dialog.getByRole('button', { name: 'Keep session' }).click();
    await expect(page.getByTestId('session-card')).toHaveCount(2);
    await card.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete session' }).click();
    await expect(page.getByTestId('session-card')).toHaveCount(1);
    await expect(page.getByTestId('session-card')).toContainText('Keep me');
    expect(await page.evaluate(k => localStorage.getItem(k), GUEST_LEVELS_KEY)).toBe(levelsBefore);
    await page.reload();
    await expect(page.getByTestId('session-card')).toHaveCount(1);
  });
});
