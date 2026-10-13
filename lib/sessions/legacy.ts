import { CARDS } from '@/lib/flashcards/engine';
import { MAX_SESSION_CARDS, TOPICS } from './types';

/**
 * Before saved sessions, a transient flashcard set and quiz question were kept for 24 hours. When one is still valid it can be
 * offered as a fixed-deck session; otherwise it is discarded once, with an explanation. Global card levels are never touched.
 */
export const LEGACY_KEYS = ['dutchtap:session:flashcards:v1', 'dutchtap:session:quiz:v1'] as const;
const ids = new Set(CARDS.map(card => card.id));

export type LegacyPractice = { cardIds: string[]; topic: string };

export function parseLegacyPractice(raw: string | null): LegacyPractice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { set?: unknown; category?: unknown };
    if (!Array.isArray(value.set)) return null;
    const cardIds = [...new Set(value.set.filter((id): id is string => typeof id === 'string' && ids.has(id)))].slice(0, MAX_SESSION_CARDS);
    if (!cardIds.length) return null;
    const topic = typeof value.category === 'string' && TOPICS.includes(value.category) ? value.category : 'all';
    return { cardIds, topic };
  } catch { return null; }
}
export function readLegacy(storage: Pick<Storage, 'getItem'> = localStorage): { practice: LegacyPractice | null; found: boolean } {
  try {
    const flashcards = storage.getItem(LEGACY_KEYS[0]);
    const quiz = storage.getItem(LEGACY_KEYS[1]);
    return { practice: parseLegacyPractice(flashcards), found: !!(flashcards || quiz) };
  } catch { return { practice: null, found: false }; }
}
export function clearLegacy(storage: Pick<Storage, 'removeItem'> = localStorage) {
  try { for (const key of LEGACY_KEYS) storage.removeItem(key); } catch { /* nothing to clear */ }
}
