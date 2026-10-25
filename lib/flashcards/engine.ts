import rawCards from '@/data/flashcards.json';
import additions from '@/data/flashcard-additions.json';
import moreAdditions from '@/data/flashcard-additions-2.json';
import workplace from '@/data/workplace-cards.json';
import grammarPatterns from '@/data/grammar-pattern-cards.json';
export type Card = typeof rawCards[number] & {
  collection?: "everyday" | "workplace" | "grammar";
  difficulty?: string;
  source?: { videoId: string; timestampSeconds: number };
  vocabularyIds?: string[];
  imageStatus?: string;
  audioStatus?: string;
  adapted?: boolean;
  quizMode?: string;
  quizBlank?: { index: number; acceptedAnswers: string[]; distractors: string[] };
};
export const EVERYDAY_CARDS: Card[] = [...rawCards, ...additions, ...moreAdditions];
/** Everyday plus Dutch at Work: the 1,200 sentences that have breakdowns, families and model answers. */
export const CORE_CARDS: Card[] = [...EVERYDAY_CARDS, ...workplace] as Card[];
export const GRAMMAR_CARDS: Card[] = grammarPatterns as Card[];
export const CARDS: Card[] = [...CORE_CARDS, ...GRAMMAR_CARDS];
export const CATEGORIES = { shopping: 'Shopping', school: 'School', transport: 'Train & transport', home: 'Home', conversation: 'Conversation', administration: 'Administration', weather: 'Weather', food: 'Food & cafés', work: 'Work', health: 'Health', leisure: 'Leisure' };

// How well the learner knows a card. New cards start as "difficult".
export const LEVELS = ['difficult', 'medium', 'easy', 'mastered'] as const;
export type Level = typeof LEVELS[number];
export const LEVEL_LABELS: Record<Level, string> = { difficult: 'Difficult', medium: 'Medium', easy: 'Easy', mastered: 'Mastered' };
export const DEFAULT_LEVEL: Level = 'difficult';

// One record per card, shared by flashcards (level) and the quiz (correct/wrong/streak).
export type Review = {
  id: string; level: Level; masteredCount: number; seen: number;
  quizCorrect: number; quizWrong: number; quizStreak: number; updatedAt: string;
};
export type Reviews = Record<string, Review>;

export const MASTERED_SLOWDOWN_AT = 10;
export const QUIZ_SLOWDOWN_AT = 10;

export function newReview(id: string, now = new Date()): Review {
  return { id, level: DEFAULT_LEVEL, masteredCount: 0, seen: 0, quizCorrect: 0, quizWrong: 0, quizStreak: 0, updatedAt: now.toISOString() };
}

// ---- Flashcards: how often a card is drawn --------------------------------
const LEVEL_WEIGHT: Record<Level, number> = { difficult: 8, medium: 4, easy: 2, mastered: 0.5 };
export function flashcardWeight(review?: Review): number {
  const level = review?.level ?? DEFAULT_LEVEL;
  // After being marked Mastered ~10 times, a card shows up even less.
  if (level === 'mastered' && (review?.masteredCount ?? 0) >= MASTERED_SLOWDOWN_AT) return 0.15;
  return LEVEL_WEIGHT[level];
}

export function rateLevel(id: string, previous: Review | undefined, level: Level, now = new Date()): Review {
  const base = previous ?? newReview(id, now);
  return { ...base, level, seen: base.seen + 1, masteredCount: base.masteredCount + (level === 'mastered' ? 1 : 0), updatedAt: now.toISOString() };
}

// ---- Quiz: how often a card is drawn --------------------------------------
export function quizWeight(review?: Review): number {
  if (!review || review.quizCorrect + review.quizWrong === 0) return 6;
  if (review.quizStreak === 0) return 8; // last answer was wrong: bring it back soon
  if (review.quizStreak >= QUIZ_SLOWDOWN_AT) return 0.5;
  if (review.quizStreak >= 5) return 2;
  return 4;
}

export function recordQuiz(id: string, previous: Review | undefined, correct: boolean, now = new Date()): Review {
  const base = previous ?? newReview(id, now);
  return { ...base, quizCorrect: base.quizCorrect + (correct ? 1 : 0), quizWrong: base.quizWrong + (correct ? 0 : 1), quizStreak: correct ? base.quizStreak + 1 : 0, updatedAt: now.toISOString() };
}

// ---- Weighted random selection --------------------------------------------
type Weigh = (review?: Review) => number;

/** Draw one id by weight. Avoids repeating `avoid` when there is any other choice. */
export function drawCard(ids: string[], reviews: Reviews, weigh: Weigh, rand: () => number = Math.random, avoid?: string): string | undefined {
  const pool = ids.length > 1 && avoid ? ids.filter(id => id !== avoid) : ids;
  const total = pool.reduce((sum, id) => sum + weigh(reviews[id]), 0);
  if (!pool.length || total <= 0) return pool[0];
  let target = rand() * total;
  for (const id of pool) { target -= weigh(reviews[id]); if (target < 0) return id; }
  return pool[pool.length - 1];
}

/** Pick `size` distinct cards at random, favouring difficult ones. `null` means every card. */
export function pickCardSet(ids: string[], reviews: Reviews, size: number | null, rand: () => number = Math.random): string[] {
  if (size === null || size >= ids.length) return [...ids];
  const left = [...ids];
  const picked: string[] = [];
  while (picked.length < size && left.length) {
    const id = drawCard(left, reviews, flashcardWeight, rand)!;
    picked.push(id); left.splice(left.indexOf(id), 1);
  }
  return picked;
}

export function mergeReviews(a: Reviews, b: Reviews): Reviews {
  const merged = { ...a };
  for (const [id, record] of Object.entries(b)) if (!merged[id] || record.updatedAt > merged[id].updatedAt) merged[id] = record;
  return merged;
}

export function countByLevel(cards: readonly { id: string }[], reviews: Reviews): Record<Level, number> {
  const counts: Record<Level, number> = { difficult: 0, medium: 0, easy: 0, mastered: 0 };
  for (const c of cards) counts[reviews[c.id]?.level ?? DEFAULT_LEVEL]++;
  return counts;
}
