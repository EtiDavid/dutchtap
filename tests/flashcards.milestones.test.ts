import { describe, expect, it } from 'vitest';
import { milestoneCrossed, milestoneMessage, masteredTotal, nextMilestone } from '@/lib/flashcards/milestones';
import { newReview, rateLevel, type Reviews } from '@/lib/flashcards/engine';

describe('mastered milestones', () => {
  it('celebrates the moment 10, 50 and 100 cards are reached', () => {
    expect(milestoneCrossed(9, 10)).toBe(10);
    expect(milestoneCrossed(49, 50)).toBe(50);
    expect(milestoneCrossed(99, 100)).toBe(100);
  });
  it('does not celebrate before, after, or when nothing changes', () => {
    expect(milestoneCrossed(8, 9)).toBeNull();
    expect(milestoneCrossed(10, 11)).toBeNull();
    expect(milestoneCrossed(10, 10)).toBeNull();
    expect(milestoneCrossed(10, 9)).toBeNull();
  });
  it('mentions the highest milestone when several are crossed at once', () => {
    expect(milestoneCrossed(0, 60)).toBe(50);
  });
  it('has a message for each milestone and points to the next one', () => {
    expect(milestoneMessage(10)).toMatch(/^10 /); expect(milestoneMessage(50)).toMatch(/^50 /); expect(milestoneMessage(100)).toMatch(/^100 /);
    expect(nextMilestone(0)).toBe(10); expect(nextMilestone(10)).toBe(50); expect(nextMilestone(100)).toBeNull();
  });
  it('counts only cards currently marked Mastered', () => {
    const now = new Date('2026-10-09T10:00:00Z');
    const reviews: Reviews = {
      a: rateLevel('a', newReview('a', now), 'mastered', now),
      b: rateLevel('b', newReview('b', now), 'easy', now),
      c: rateLevel('c', rateLevel('c', undefined, 'mastered', now), 'medium', now),
    };
    expect(masteredTotal(reviews)).toBe(1);
  });
});
