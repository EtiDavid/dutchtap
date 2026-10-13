import { test, expect, type Page } from '@playwright/test';
import { CARDS, newReview, rateLevel } from '../../lib/flashcards/engine';
import { notesFor } from '../../lib/grammarNotes';
import { asGuest, cardByDutch, createSession, GUEST_LEVELS_KEY, rateSpeaking, savedGuestSessions, shownDutch, switchMode } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });

test.describe('navigation', () => {
  test('every learning page has the tab bar and marks the current page', async ({ page }) => {
    for (const [path, tab] of [['/flashcards', 'Flashcards'], ['/quiz', 'Quiz'], ['/vocabulary', 'Words'], ['/sentences/shopping-01', null]] as const) {
      await page.goto(path);
      for (const name of ['Home', 'Flashcards', 'Quiz', 'Words']) await expect(nav(page).getByRole('link', { name: new RegExp(name) })).toBeVisible();
      if (tab) await expect(nav(page).getByRole('link', { name: new RegExp(tab) })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('the Quiz tab opens a session chooser (never an unrelated deck), and its links open that session\'s quiz', async ({ page }) => {
    await page.goto('/quiz');
    await expect(page.getByTestId('quiz-empty')).toContainText('You need a session first');
    await expect(page.getByRole('link', { name: 'Create a session' })).toBeVisible();
    await createSession(page, { count: 10, name: 'Alpha' });
    await createSession(page, { count: 10, name: 'Beta' });
    await nav(page).getByRole('link', { name: /Quiz/ }).click();
    await expect(page.getByRole('heading', { name: 'Quiz', exact: true })).toBeVisible();
    await expect(page.getByTestId('quiz-session')).toHaveCount(2);
    await expect(page.getByTestId('continue-quiz')).toContainText('Beta'); // the session you were last in
    await page.getByTestId('quiz-session').filter({ hasText: 'Alpha' }).getByRole('link').click();
    await expect(page.getByTestId('session-name')).toHaveText('Alpha');
    await expect(page.locator('[data-mode="quiz"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('quiz-english')).toBeVisible();
  });

  test('leaving a session for another page and coming back continues the same mode and card', async ({ page }) => {
    await createSession(page, { topic: 'shopping', count: 10 });
    await switchMode(page, 'speaking');
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    const dutch = await shownDutch(page);
    await page.getByRole('button', { name: 'Medium', exact: true }).click();
    await nav(page).getByRole('link', { name: /Words/ }).click();
    await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible();
    const back = nav(page).getByRole('link', { name: /Flashcards/ });
    await expect(back).toContainText('session in progress'); // the dot
    await back.click();
    await expect(page.getByTestId('continue')).toContainText('speaking');
    await page.getByTestId('continue').click();
    expect(await shownDutch(page)).toBe(dutch);
    await expect(page.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('back-to-sessions').click();
    await expect(page.getByTestId('session-card')).toBeVisible();
  });

  test('a vocabulary link returns to the same session, mode and card', async ({ page }) => {
    await createSession(page, { topic: 'shopping', count: 10 });
    await switchMode(page, 'speaking');
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    const dutch = await shownDutch(page);
    const url = page.url();
    await page.getByRole('link', { name: /Vocabulary for this sentence|Browse vocabulary/ }).click();
    await expect(page.getByRole('heading', { name: 'Vocabulary', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Back/ }).click();
    expect(page.url()).toBe(url);
    expect(await shownDutch(page)).toBe(dutch);
    await expect(page.getByRole('button', { name: 'Check the Dutch' })).toHaveCount(0); // still revealed
  });

  test('an unknown session id says so and leads back to the sessions', async ({ page }) => {
    await page.goto('/flashcards?session=does-not-exist-123');
    await expect(page.getByTestId('session-missing')).toContainText('Session not found');
    await page.getByRole('link', { name: 'Back to sessions' }).click();
    await expect(page.getByRole('button', { name: 'Create session' })).toBeVisible();
  });

  test('the browser back button moves between the dashboard and a session', async ({ page }) => {
    await createSession(page, { count: 10, name: 'History' });
    await page.getByTestId('back-to-sessions').click();
    await expect(page.getByTestId('session-card')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('session-name')).toHaveText('History');
    await page.goForward();
    await expect(page.getByTestId('session-card')).toBeVisible();
  });
});

test.describe('encouragement and explanations still work with sessions', () => {
  test('practising starts a gentle streak, shown on the dashboard, the quiz page and Home', async ({ page }) => {
    await page.goto('/flashcards');
    await expect(page.getByTestId('streak')).toContainText('Practise today to start a streak.');
    await createSession(page, { count: 10 });
    await page.getByRole('button', { name: 'Next sentence' }).click();
    await page.getByTestId('back-to-sessions').click();
    await expect(page.getByTestId('streak')).toContainText('You practised today. Nice start!');
    await nav(page).getByRole('link', { name: /Quiz/ }).click();
    await page.goto('/');
    await expect(page.getByTestId('streak')).toContainText('You practised today');
  });

  test('a streak from yesterday stays alive with no penalty message', async ({ page }) => {
    const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() - offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    await page.addInitScript(days => localStorage.setItem('dutchtap:practice-days:v1', JSON.stringify(days)), [day(3), day(2), day(1)]);
    await page.goto('/flashcards');
    await expect(page.getByTestId('streak')).toContainText('3-day streak. Practise today to keep it going.');
  });

  test('the 10th Mastered card shows a milestone once, and a reload does not repeat it', async ({ page }) => {
    const now = new Date('2026-10-09T10:00:00Z');
    const seeded = Object.fromEntries(CARDS.slice(0, 9).map(c => [c.id, rateLevel(c.id, newReview(c.id, now), 'mastered', now)]));
    await page.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [GUEST_LEVELS_KEY, JSON.stringify(seeded)] as [string, string]);
    await createSession(page, { count: 10 }); // Difficult cards only, so none of the nine mastered ones
    await switchMode(page, 'speaking');
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    await page.getByRole('button', { name: 'Mastered', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByTestId('milestone')).toContainText('10 cards mastered!');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByTestId('milestone')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('speaking-progress')).toBeVisible();
    await expect(page.getByTestId('milestone')).toHaveCount(0);
  });

  test('every mode explains the grammar: Study and Speaking after reveal, the Quiz after answering', async ({ page }) => {
    await createSession(page, { topic: 'shopping', count: 10 });
    const card = cardByDutch(await shownDutch(page));
    const note = notesFor(card.id)!;
    const notes = page.getByTestId('grammar-notes');
    await notes.getByText('Grammar rule & similar examples').click();
    await expect(notes.getByText(note.rule, { exact: true })).toBeVisible();
    for (const example of note.examples) await expect(notes.getByText(example.dutch, { exact: true })).toBeVisible();
    await expect(notes.getByRole('button', { name: /Listen to:/ })).toHaveCount(note.examples.length);
    await switchMode(page, 'speaking');
    await expect(page.getByTestId('grammar-notes')).toHaveCount(0); // hidden until the answer is revealed
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    await expect(page.getByTestId('grammar-notes')).toBeVisible();
    await switchMode(page, 'quiz');
    await expect(page.getByTestId('grammar-notes')).toHaveCount(0);
  });
});

test.describe('earlier practice and layout', () => {
  test('an unfinished set from before saved sessions can be kept as a session, once', async ({ page }) => {
    const ids = CARDS.slice(0, 6).map(c => c.id);
    await page.addInitScript(([set]) => { localStorage.setItem('dutchtap:session:flashcards:v1', JSON.stringify({ savedAt: Date.now(), mode: 'read', category: 'all', set: JSON.parse(set), cardId: JSON.parse(set)[0], revealed: false, level: 'difficult' })); }, [JSON.stringify(ids)] as [string]);
    await page.goto('/flashcards');
    await expect(page.getByTestId('legacy-banner')).toContainText('earlier flashcard set of 6 sentences');
    await page.getByRole('button', { name: 'Keep as a session' }).click();
    await page.waitForURL(/session=/);
    const [session] = await savedGuestSessions(page);
    expect(session.cardIds).toEqual(ids);
    expect(session.cards[ids[0]]).toMatchObject({ spStreak: 0, qStreak: 0 }); // nothing is invented
    expect(await page.evaluate(() => localStorage.getItem('dutchtap:session:flashcards:v1'))).toBeNull();
    await page.goto('/flashcards');
    await expect(page.getByTestId('legacy-banner')).toHaveCount(0);
  });

  test('an unreadable earlier practice is discarded once with an explanation, and card levels are untouched', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('dutchtap:session:quiz:v1', '{"savedAt":1}'); });
    await page.goto('/flashcards');
    await expect(page.getByTestId('legacy-banner')).toContainText('Your card levels are unchanged');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('legacy-banner')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('dutchtap:session:quiz:v1'))).toBeNull();
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`no horizontal overflow and no console errors at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('console', m => { if (m.type() === 'error' && !/401/.test(m.text())) errors.push(m.text()); });
      page.on('pageerror', e => errors.push(e.message));
      await createSession(page, { topic: 'shopping', count: 10 });
      const overflow = async (label: string) => { const { width, viewportWidth } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewportWidth: innerWidth })); expect(width, label).toBeLessThanOrEqual(viewportWidth); };
      await overflow('study');
      await switchMode(page, 'speaking'); await page.getByRole('button', { name: 'Check the Dutch' }).click(); await overflow('speaking');
      await switchMode(page, 'quiz'); await expect(page.locator('[data-token]').first()).toBeVisible(); await overflow('quiz');
      await page.goto('/flashcards'); await overflow('dashboard');
      await page.getByRole('button', { name: 'Create session' }).click(); await overflow('create dialog');
      await page.keyboard.press('Escape');
      await page.goto('/quiz'); await overflow('quiz chooser');
      expect(errors).toEqual([]);
      await expect(page.locator('nextjs-portal [data-nextjs-dialog-overlay], nextjs-portal [data-nextjs-toast-errors]')).toHaveCount(0); // no framework error overlay
    });
  }
});
void rateSpeaking;
