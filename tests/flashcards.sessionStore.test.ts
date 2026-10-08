import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { loadFlashcardSession, loadQuizSession, saveFlashcardSession, saveQuizSession, sessionsInProgress } from '@/lib/flashcards/sessionStore';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } });
});
afterEach(() => vi.unstubAllGlobals());

const flash = { mode: 'say' as const, category: 'all', set: [CARDS[0].id, CARDS[1].id], cardId: CARDS[1].id, revealed: true, level: 'medium' as const };
const now = Date.UTC(2026, 9, 9, 10);

describe('saved sessions', () => {
  it('round-trips a flashcard session so a refresh can resume it', () => {
    saveFlashcardSession(flash, now);
    expect(loadFlashcardSession(now + 1000)).toEqual({ ...flash, savedAt: now });
  });
  it('round-trips a quiz question including an answered state', () => {
    const quiz = { category: 'school', n: 3, cardId: CARDS[2].id, outcome: 'wrong' as const };
    saveQuizSession(quiz, now);
    expect(loadQuizSession(now)).toMatchObject(quiz);
  });
  it('clears the session when it is finished', () => {
    saveFlashcardSession(flash, now); saveFlashcardSession(null, now);
    expect(loadFlashcardSession(now)).toBeNull();
  });
  it('ignores sessions older than a day', () => {
    saveFlashcardSession(flash, now);
    expect(loadFlashcardSession(now + 25 * 60 * 60 * 1000)).toBeNull();
  });
  it('ignores corrupted data and unknown cards instead of crashing', () => {
    store.set('dutchtap:session:flashcards:v1', '{not json');
    expect(loadFlashcardSession(now)).toBeNull();
    saveFlashcardSession({ ...flash, cardId: 'does-not-exist' }, now);
    expect(loadFlashcardSession(now)).toBeNull();
    saveQuizSession({ category: 'all', n: -1, cardId: CARDS[0].id, outcome: null }, now);
    expect(loadQuizSession(now)).toBeNull();
  });
  it('reports which sections have a session waiting', () => {
    expect(sessionsInProgress(now)).toEqual({ flashcards: false, quiz: false });
    saveFlashcardSession(flash, now);
    expect(sessionsInProgress(now)).toEqual({ flashcards: true, quiz: false });
  });
});
