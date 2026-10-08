import type { Reviews } from './engine';

export const MILESTONES = [10, 50, 100] as const;

export const masteredTotal = (reviews: Reviews) => Object.values(reviews).filter(r => r.level === 'mastered').length;

/** The highest milestone reached by going from `before` to `after` mastered cards, if any. */
export function milestoneCrossed(before: number, after: number): number | null {
  const crossed = MILESTONES.filter(m => before < m && after >= m);
  return crossed.length ? crossed[crossed.length - 1] : null;
}

export function milestoneMessage(milestone: number): string {
  if (milestone >= 100) return '100 cards mastered! You really know your Dutch sentences.';
  if (milestone >= 50) return '50 cards mastered! That is a big step. Keep going!';
  return '10 cards mastered! Your first ten are in your pocket.';
}

/** The next milestone still to reach, for a gentle progress hint. */
export function nextMilestone(mastered: number): number | null {
  return MILESTONES.find(m => mastered < m) ?? null;
}
