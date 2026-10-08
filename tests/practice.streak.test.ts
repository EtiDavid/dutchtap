import { describe, expect, it } from 'vitest';
import { addPracticeDay, currentStreak, parseDays, streakMessage } from '@/lib/practice/streak';

describe('practice streak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-07', '2026-10-08', '2026-10-09'], '2026-10-09')).toBe(3);
  });
  it('stays alive until the end of the day after the last practice, without a penalty message', () => {
    const days = ['2026-10-07', '2026-10-08'];
    expect(currentStreak(days, '2026-10-09')).toBe(2);
    expect(streakMessage(2, false)).toMatch(/keep it going/);
    expect(streakMessage(2, false)).not.toMatch(/lost|broke|miss/i);
  });
  it('starts again after a gap of a full day, and ignores older runs', () => {
    expect(currentStreak(['2026-10-01', '2026-10-02', '2026-10-03'], '2026-10-09')).toBe(0);
    expect(currentStreak(['2026-10-01', '2026-10-02', '2026-10-08', '2026-10-09'], '2026-10-09')).toBe(2);
  });
  it('works across month and year ends', () => {
    expect(currentStreak(['2026-12-31', '2027-01-01'], '2027-01-01')).toBe(2);
    expect(currentStreak(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
  });
  it('records each day once and keeps a bounded, sorted history', () => {
    expect(addPracticeDay(['2026-10-08'], '2026-10-08')).toEqual(['2026-10-08']);
    expect(addPracticeDay(['2026-10-08'], '2026-10-07')).toEqual(['2026-10-07', '2026-10-08']);
    const long = Array.from({ length: 500 }, (_, i) => `2025-01-${String((i % 28) + 1).padStart(2, '0')}`);
    expect(addPracticeDay(parseDays(long), '2026-10-09').length).toBeLessThanOrEqual(400);
  });
  it('ignores malformed stored data', () => {
    expect(parseDays('nope')).toEqual([]);
    expect(parseDays(['2026-10-08', 'yesterday', 5, null, '2026-10-08'])).toEqual(['2026-10-08']);
  });
  it('encourages a new learner instead of showing zero', () => {
    expect(streakMessage(0, false)).toMatch(/start a streak/);
    expect(streakMessage(1, true)).toMatch(/practised today/);
  });
});
