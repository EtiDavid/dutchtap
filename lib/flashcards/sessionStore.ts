import { z } from 'zod';
import { CARDS, LEVELS } from './engine';

// An in-progress session is kept on this device so a refresh (or leaving for another page) resumes it.
const KEYS = { flashcards: 'dutchtap:session:flashcards:v1', quiz: 'dutchtap:session:quiz:v1' } as const;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ids = new Set(CARDS.map(c => c.id));
const cardId = z.string().refine(id => ids.has(id));

const flashcardSchema = z.object({
  savedAt: z.number(), mode: z.enum(['read', 'say']), category: z.string(),
  set: z.array(cardId).min(1), cardId, revealed: z.boolean(), level: z.enum(LEVELS),
});
const quizSchema = z.object({
  savedAt: z.number(), category: z.string(), n: z.number().int().nonnegative(), cardId,
  outcome: z.enum(['right', 'wrong']).nullable(),
});
export type SavedFlashcardSession = Omit<z.infer<typeof flashcardSchema>, 'savedAt'>;
export type SavedQuizSession = Omit<z.infer<typeof quizSchema>, 'savedAt'>;

function load<T extends z.ZodType>(key: string, schema: T, now: number): z.infer<T> | null {
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(key) || 'null'));
    return parsed.success && now - (parsed.data as { savedAt: number }).savedAt < MAX_AGE_MS ? parsed.data : null;
  } catch { return null; }
}
function save(key: string, value: object | null, now: number) {
  try { if (value) localStorage.setItem(key, JSON.stringify({ ...value, savedAt: now })); else localStorage.removeItem(key); } catch { /* resuming just won't work */ }
}

export const loadFlashcardSession = (now = Date.now()): SavedFlashcardSession | null => load(KEYS.flashcards, flashcardSchema, now);
export const saveFlashcardSession = (s: SavedFlashcardSession | null, now = Date.now()) => save(KEYS.flashcards, s, now);
export const loadQuizSession = (now = Date.now()): SavedQuizSession | null => load(KEYS.quiz, quizSchema, now);
export const saveQuizSession = (s: SavedQuizSession | null, now = Date.now()) => save(KEYS.quiz, s, now);

/** Which sections have a session waiting, for the navigation bar's "continue" dot. */
export function sessionsInProgress(now = Date.now()) {
  return { flashcards: !!loadFlashcardSession(now), quiz: !!loadQuizSession(now) };
}
