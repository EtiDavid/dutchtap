// A gentle practice streak: consecutive local days with at least one practice action.
// Missing a day never shows a penalty; the streak is simply counted from the last practice day.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KEEP_DAYS = 400;

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const shift = (day: string, by: number) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + by); return localDay(d); };

export function parseDays(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter((d): d is string => typeof d === 'string' && DAY.test(d)))].sort() : [];
}

export function addPracticeDay(days: string[], today: string): string[] {
  return days.includes(today) ? days : [...days, today].sort().slice(-KEEP_DAYS);
}

/** Days in a row ending today, or ending yesterday if the learner has not practised yet today. */
export function currentStreak(days: string[], today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : shift(today, -1);
  let streak = 0;
  while (set.has(cursor)) { streak++; cursor = shift(cursor, -1); }
  return streak;
}

export function streakMessage(streak: number, practisedToday: boolean): string {
  if (streak === 0) return 'Practise today to start a streak.';
  if (practisedToday) return streak === 1 ? 'You practised today. Nice start!' : `${streak} days in a row. Well done!`;
  return `${streak}-day streak. Practise today to keep it going.`;
}
