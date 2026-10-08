import { describe, expect, it } from 'vitest';
import { CARDS, countByLevel, drawCard, flashcardWeight, mergeReviews, newReview, pickCardSet, quizWeight, rateLevel, recordQuiz, type Reviews } from '@/lib/flashcards/engine';
import { reviewsSchema } from '@/lib/flashcards/validation';

const now = new Date('2026-10-08T10:00:00Z');
function seededRand(seed = 1) { let a = seed; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const withLevel = (id: string, level: 'difficult' | 'medium' | 'easy' | 'mastered', masteredCount = 0) => ({ ...newReview(id, now), level, masteredCount });

describe('flashcard deck', () => {
  it('has 50 unique complete cards, ten per place, each with a situation that is not the answer', () => {
    expect(CARDS).toHaveLength(50); expect(new Set(CARDS.map(c => c.id)).size).toBe(50);
    for (const category of new Set(CARDS.map(c => c.category))) expect(CARDS.filter(c => c.category === category)).toHaveLength(10);
    for (const c of CARDS) {
      for (const key of ['dutch', 'english', 'cue', 'scenario', 'grammar', 'variation', 'audio', 'image'] as const) expect(c[key].length).toBeGreaterThan(4);
      expect(c.scenario.toLowerCase()).not.toContain(c.dutch.toLowerCase().replace(/[.?!]/g, ''));
    }
  });
});

describe('levels', () => {
  it('start as difficult and record the learner’s choice', () => {
    expect(newReview('shopping-01', now).level).toBe('difficult');
    const r = rateLevel('shopping-01', undefined, 'easy', now);
    expect(r.level).toBe('easy'); expect(r.seen).toBe(1); expect(r.masteredCount).toBe(0);
    expect(rateLevel('shopping-01', r, 'mastered', now).masteredCount).toBe(1);
  });
  it('counts cards by level, treating unseen cards as difficult', () => {
    const reviews: Reviews = { 'shopping-01': withLevel('shopping-01', 'mastered') };
    const counts = countByLevel(CARDS, reviews);
    expect(counts.mastered).toBe(1); expect(counts.difficult).toBe(49);
  });
  it('shows difficult most, then medium, easy, mastered, and mastered-many-times least', () => {
    const w = (level: 'difficult' | 'medium' | 'easy' | 'mastered', n = 0) => flashcardWeight(withLevel('x', level, n));
    expect(flashcardWeight(undefined)).toBe(w('difficult'));
    expect(w('difficult')).toBeGreaterThan(w('medium')); expect(w('medium')).toBeGreaterThan(w('easy'));
    expect(w('easy')).toBeGreaterThan(w('mastered')); expect(w('mastered')).toBeGreaterThan(w('mastered', 10));
  });
});

describe('drawing cards', () => {
  const ids = ['a', 'b'];
  it('draws difficult cards far more often than mastered ones', () => {
    const reviews: Reviews = { a: withLevel('a', 'difficult'), b: withLevel('b', 'mastered') };
    const rand = seededRand(7); let a = 0;
    for (let i = 0; i < 1000; i++) if (drawCard(ids, reviews, flashcardWeight, rand) === 'a') a++;
    expect(a).toBeGreaterThan(900);
  });
  it('avoids repeating the card just shown, unless it is the only one', () => {
    const rand = seededRand(3);
    for (let i = 0; i < 50; i++) expect(drawCard(ids, {}, flashcardWeight, rand, 'a')).toBe('b');
    expect(drawCard(['a'], {}, flashcardWeight, rand, 'a')).toBe('a');
  });
  it('picks a set of distinct cards that favours difficult ones, or all cards for unlimited', () => {
    const all = CARDS.map(c => c.id);
    const reviews: Reviews = Object.fromEntries(all.slice(0, 25).map(id => [id, withLevel(id, 'mastered', 10)]));
    expect(pickCardSet(all, reviews, null)).toHaveLength(50);
    let masteredPicked = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const set = pickCardSet(all, reviews, 10, seededRand(seed));
      expect(new Set(set).size).toBe(10);
      masteredPicked += set.filter(id => reviews[id]).length;
    }
    expect(masteredPicked / 40).toBeLessThan(1); // 25 of 50 are mastered, yet on average under 1 of 10 is picked
  });
});

describe('quiz progress', () => {
  it('brings missed cards back sooner and slows down after ten right answers in a row', () => {
    let r = recordQuiz('x', undefined, true, now);
    const early = quizWeight(r);
    for (let i = 0; i < 9; i++) r = recordQuiz('x', r, true, now);
    expect(r.quizStreak).toBe(10); expect(quizWeight(r)).toBeLessThan(early);
    const missed = recordQuiz('x', r, false, now);
    expect(missed.quizStreak).toBe(0); expect(missed.quizWrong).toBe(1);
    expect(quizWeight(missed)).toBeGreaterThan(early);
    expect(quizWeight(undefined)).toBeGreaterThan(early);
  });
});

describe('storage and sync', () => {
  it('merges by recency', () => {
    const older = rateLevel('shopping-01', undefined, 'easy', now);
    const newer = rateLevel('shopping-01', older, 'difficult', new Date('2026-10-09T10:00:00Z'));
    expect(mergeReviews({ [older.id]: older }, { [newer.id]: newer })[older.id].level).toBe('difficult');
    expect(mergeReviews({ [newer.id]: newer }, { [older.id]: older })[older.id].level).toBe('difficult');
  });
  it('rejects malformed, mismatched or old-format progress', () => {
    const r = newReview('shopping-01', now);
    expect(reviewsSchema.safeParse({ [r.id]: r }).success).toBe(true);
    expect(reviewsSchema.safeParse({ invalid: r }).success).toBe(false);
    expect(reviewsSchema.safeParse({ [r.id]: { ...r, level: 'expert' } }).success).toBe(false);
    expect(reviewsSchema.safeParse({ [r.id]: { id: r.id, stage: 1, dueAt: now.toISOString(), updatedAt: now.toISOString(), recalls: 1, attempts: 1, lastRewardDate: null, points: 0 } }).success).toBe(false);
  });
});
