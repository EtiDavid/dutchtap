import { expect, test, type Page } from '@playwright/test';
import { asAccount, asGuest, createSession, rateSpeaking, solveQuiz, switchMode } from './helpers';
import { FakeServer } from '../helpers/fakeServer';
import { cardFor } from '../../lib/content/cards';

const LANGUAGE_KEY = 'dutchtap:language:v1';
// These tests start as a brand-new visitor (the config seeds Dutch for the older suites).
test.use({ storageState: { cookies: [], origins: [] } });

const frenchCard = (page: Page) => page.locator('article p[lang="fr"]').first();
const savedSessions = (page: Page) => page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('dutchtap:sessions:v1:guest') || '{"sessions":{}}');
  return Object.values(state.sessions) as { id: string; lang: string; cardIds: string[] }[];
});

/** A controllable speech synthesis: voices can be absent, late, or of several languages; every utterance is recorded. */
async function fakeSpeech(page: Page, voices: { name: string; lang: string }[], options: { late?: boolean } = {}) {
  await page.addInitScript(([list, late]) => {
    const w = window as unknown as Record<string, unknown>;
    w.__spoken = []; w.__cancels = 0;
    let current = late ? [] : list;
    const listeners = new Set<() => void>();
    class Utterance { text: string; voice: unknown = null; lang = ''; rate = 1; onend: ((e: unknown) => void) | null = null; onerror: ((e: unknown) => void) | null = null; constructor(text: string) { this.text = text; } }
    w.SpeechSynthesisUtterance = Utterance;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => current,
      speak: (u: Utterance) => { (w.__spoken as unknown[]).push({ text: u.text, voice: (u.voice as { name: string } | null)?.name, lang: u.lang, rate: u.rate }); setTimeout(() => u.onend?.({}), 5); },
      cancel: () => { (w.__cancels as number)++; },
      addEventListener: (type: string, fn: () => void) => { if (type === 'voiceschanged') listeners.add(fn); },
      removeEventListener: (type: string, fn: () => void) => { if (type === 'voiceschanged') listeners.delete(fn); },
    } });
    w.__loadVoices = () => { current = list; listeners.forEach(fn => fn()); };
  }, [voices, !!options.late] as const);
}
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: { text: string; voice: string; lang: string; rate: number }[] }).__spoken);

test.describe('choosing and switching the learning language', () => {
  test('a first launch asks which language to learn, remembers the answer, and offers a visible switch', async ({ page }) => {
    await asGuest(page);
    await page.goto('/');
    await expect(page.getByTestId('language-chooser')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What do you want to learn?' })).toBeVisible();
    await expect(page.getByText('Flashcards')).toHaveCount(0);
    await page.locator('[data-lang="fr"]').click();
    await expect(page.getByTestId('language-chooser')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Flashcards/ })).toHaveAttribute('href', '/flashcards?lang=fr');
    await expect(page.getByTestId('dutch-games-note')).toBeVisible();
    await expect(page.getByRole('link', { name: /De or Het/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('language-chooser')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), LANGUAGE_KEY)).toBe('fr');
    // A returning learner goes straight in; switching back shows the Dutch games again.
    await page.getByTestId('language-switch').click();
    await page.getByRole('radio', { name: /Nederlands/ }).click();
    await expect(page.getByRole('link', { name: /De or Het/ })).toBeVisible();
    await expect(page.getByTestId('dutch-games-note')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), LANGUAGE_KEY)).toBe('nl');
  });

  test('a returning Dutch learner (saved Dutch progress, no choice yet) goes straight into Dutch', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(() => localStorage.setItem('dutchtap:flashcards:v2:guest', '{}'));
    await page.goto('/flashcards');
    await expect(page.getByTestId('language-chooser')).toHaveCount(0);
    await expect(page.getByTestId('dashboard-language')).toContainText('Nederlands');
  });

  test('the address names the language: ?lang=fr wins over a saved Dutch choice, survives reload and back', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(key => localStorage.setItem(key, 'nl'), LANGUAGE_KEY);
    await page.goto('/flashcards?lang=fr');
    await expect(page.getByTestId('dashboard-language')).toContainText('Français');
    await page.reload();
    await expect(page.getByTestId('dashboard-language')).toContainText('Français');
    await page.goto('/vocabulary?lang=fr');
    await expect(page.getByRole('heading', { name: 'Vocabulary' })).toBeVisible();
    await expect(page.locator('main[data-lang="fr"]')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('dashboard-language')).toContainText('Français');
  });
});

test.describe('French sessions', () => {
  test('create, study, speak and quiz a French session; the language is shown and never changes', async ({ page }) => {
    await asGuest(page);
    await fakeSpeech(page, [{ name: 'Fake Dutch', lang: 'nl-BE' }, { name: 'Fake French (Belgium)', lang: 'fr-BE' }, { name: 'Fake French (France)', lang: 'fr-FR' }, { name: 'Fake English', lang: 'en-US' }]);
    await page.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'fr'); }, LANGUAGE_KEY);
    const sessionId = await createSession(page, { count: 10, name: 'Mon français' });
    const saved = (await savedSessions(page))[0];
    expect(saved.lang).toBe('fr');
    await expect(page.getByTestId('session-language')).toContainText('Français');
    expect(saved.cardIds.every(id => !!cardFor('fr', id))).toBe(true);

    // Study shows French text, French labels in the grammar panel, and speaks with a French voice.
    await expect(frenchCard(page)).toBeVisible();
    const study = await frenchCard(page).innerText();
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
    const first = (await spoken(page))[0];
    expect(first.text).toBe(study);
    expect(first.voice).toBe('Fake French (Belgium)');
    expect(first.lang).toBe('fr-BE');
    await page.getByRole('button', { name: 'Listen slowly' }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(1);
    expect((await spoken(page))[1].rate).toBeLessThan(first.rate);
    await page.getByTestId('grammar-notes').locator('summary').click();
    await expect(page.getByTestId('breakdown')).toContainText('Pattern:');
    await expect(page.getByTestId('breakdown-help')).toBeVisible();

    // Speaking never shows the French (text or speech) before the reveal.
    await switchMode(page, 'speaking');
    await expect(page.getByText('How do you say it?')).toBeVisible();
    await expect(page.locator('article p[lang="fr"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Check the French' }).click();
    await expect(frenchCard(page)).toBeVisible();
    await page.getByRole('button', { name: 'Mastered', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Quiz uses the French sentence's own words, accents and apostrophes included.
    await switchMode(page, 'quiz');
    await expect(page.getByTestId('quiz-english')).toBeVisible();
    const english = await page.getByTestId('quiz-english').innerText();
    const card = saved.cardIds.map(id => cardFor('fr', id)!).find(c => c.english === english)!;
    await solveQuiz(page, card.text, 'fr');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByTestId('quiz-feedback')).toContainText('Exact !');
    await expect(page.getByTestId('quiz-points')).toHaveText('10');

    // Reopening the link from a Dutch-saved preference still shows the French session.
    await page.evaluate(key => localStorage.setItem(key, 'nl'), LANGUAGE_KEY);
    await page.goto(`/flashcards?session=${sessionId}&mode=study`);
    await expect(page.getByTestId('session-language')).toContainText('Français');
    await expect(frenchCard(page)).toBeVisible();
    expect((await savedSessions(page))[0].lang).toBe('fr');
  });

  test('French card levels, sessions and streaks are separate from Dutch ones', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'fr'); }, LANGUAGE_KEY);
    await createSession(page, { count: 10, name: 'Fr one' });
    await switchMode(page, 'speaking');
    await page.getByRole('button', { name: 'Check the French' }).click();
    await page.getByRole('button', { name: 'Mastered', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('dutchtap:')).sort());
    expect(keys).toContain('dutchtap:flashcards:v2:fr:guest');
    expect(keys).not.toContain('dutchtap:flashcards:v2:guest');
    expect(keys.some(k => k.startsWith('dutchtap:practice-days:v2:fr:'))).toBe(true);
    // Dutch has no French level: everything there is still Difficult and has no Dutch session.
    await page.goto('/flashcards?lang=nl');
    await expect(page.getByTestId('dashboard-language')).toContainText('Nederlands');
    await expect(page.getByTestId('empty')).toBeVisible();
    await expect(page.getByTestId('other-language-sessions')).toContainText('1 session in another language');
    await page.getByRole('button', { name: 'Show all sessions' }).click();
    await expect(page.getByTestId('session-card')).toHaveCount(1);
    await expect(page.getByTestId('session-card-language')).toContainText('Français');
  });

  test('five active sessions are the limit across both languages', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'fr'); }, LANGUAGE_KEY);
    for (const name of ['F1', 'F2', 'F3']) await createSession(page, { count: 10, name });
    await page.goto('/flashcards?lang=nl');
    for (const name of ['N1', 'N2']) await createSession(page, { count: 10, name });
    await page.goto('/flashcards?lang=nl');
    await expect(page.getByTestId('limit-hint')).toContainText('across all languages');
    await expect(page.getByRole('button', { name: 'Create session' })).toBeDisabled();
    await page.goto('/flashcards?lang=fr');
    await expect(page.getByRole('button', { name: 'Create session' })).toBeDisabled();
    await expect(page.getByTestId('other-language-sessions')).toContainText('2 sessions in another language');
  });

  test('vocabulary and sentence pages follow the language and link back correctly', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'fr'); }, LANGUAGE_KEY);
    await page.goto('/vocabulary?lang=fr&card=shopping-01');
    await expect(page.locator('main[data-lang="fr"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'où' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'le lait' })).toBeVisible();
    await page.getByLabel('Search words').fill('lait');
    await expect(page.getByRole('heading', { level: 2, name: 'le lait' })).toBeVisible();
    await page.getByLabel('Search words').fill('ou');
    await page.getByRole('link', { name: /View sentence: shopping-01/ }).first().click();
    await expect(page).toHaveURL(/\/sentences\/shopping-01\?lang=fr/);
    await expect(page.locator('article p[lang="fr"]').first()).toContainText('Où puis-je trouver le lait');
    // The Dutch address for the same sentence still shows Dutch.
    await page.goto('/sentences/shopping-01?lang=nl');
    await expect(page.locator('article p[lang="nl"]').first()).toContainText('Waar kan ik de melk vinden?');
  });
});

test.describe('French device speech', () => {
  test('voices that arrive late are used, and only French voices are ever chosen', async ({ page }) => {
    await asGuest(page);
    await fakeSpeech(page, [{ name: 'Fake Dutch', lang: 'nl-BE' }, { name: 'Fake French', lang: 'fr_FR' }], { late: true });
    await page.goto('/sentences/shopping-01?lang=fr');
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await page.evaluate(() => (window as unknown as { __loadVoices: () => void }).__loadVoices());
    await expect.poll(async () => (await spoken(page)).length).toBe(1);
    expect((await spoken(page))[0].voice).toBe('Fake French');
  });

  test('without a French voice nothing is spoken and the reason is explained; reading still works', async ({ page }) => {
    await asGuest(page);
    await fakeSpeech(page, [{ name: 'Fake Dutch', lang: 'nl-BE' }, { name: 'Fake English', lang: 'en-GB' }]);
    await page.goto('/sentences/shopping-01?lang=fr');
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'No French voice is installed' }).first()).toBeVisible();
    expect(await spoken(page)).toEqual([]);
    await expect(page.locator('article p[lang="fr"]').first()).toContainText('Où puis-je trouver le lait');
    await expect(page.getByTestId('voice-status')).toContainText('No French voice was found');
  });

  test('a browser without speech synthesis says so', async ({ page }) => {
    await asGuest(page);
    await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }); delete (window as unknown as Record<string, unknown>).speechSynthesis; });
    await page.goto('/sentences/shopping-01?lang=fr');
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'cannot speak text aloud' }).first()).toBeVisible();
  });

  test('a saved voice choice is used and several voices can be chosen from', async ({ page }) => {
    await asGuest(page);
    await fakeSpeech(page, [{ name: 'Voice A', lang: 'fr-FR' }, { name: 'Voice B', lang: 'fr-BE' }, { name: 'Voice C', lang: 'fr-CA' }]);
    await page.goto('/sentences/shopping-01?lang=fr');
    await page.getByTestId('voice-picker').locator('summary').click();
    await page.getByTestId('voice-select').selectOption('Voice C');
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);
    expect((await spoken(page))[0].voice).toBe('Voice C');
    await page.reload();
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);
    expect((await spoken(page))[0].voice).toBe('Voice C');
  });

  test('switching language stops anything that is speaking', async ({ page }) => {
    await asGuest(page);
    await fakeSpeech(page, [{ name: 'Fake French', lang: 'fr-BE' }]);
    await page.goto('/sentences/shopping-01?lang=fr');
    const before = await page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);
    await page.getByTestId('language-switch').click();
    await page.getByRole('radio', { name: /Nederlands/ }).click();
    expect(await page.evaluate(() => (window as unknown as { __cancels: number }).__cancels)).toBeGreaterThan(before);
  });
});

test.describe('French accounts', () => {
  test('French levels and sessions sync under the French language only', async ({ page }) => {
    const server = new FakeServer();
    const levels = await asAccount(page, server, 'anna');
    await page.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'fr'); }, LANGUAGE_KEY);
    await createSession(page, { count: 10, name: 'Compte' });
    await switchMode(page, 'speaking');
    await page.getByRole('button', { name: 'Check the French' }).click();
    await page.getByRole('button', { name: 'Easy', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect.poll(async () => (await server.repo.list(server.owner)).length).toBe(1);
    expect((await server.repo.list(server.owner))[0].session.lang).toBe('fr');
    await expect.poll(() => server.reviews.rows.size).toBe(1);
    expect([...server.reviews.rows.keys()][0]).toContain('\u0000fr\u0000');
    expect(levels.size).toBe(0); // the Dutch level store was not touched
  });
});

void rateSpeaking;
