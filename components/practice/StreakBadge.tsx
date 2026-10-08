import { streakMessage } from '@/lib/practice/streak';

export function StreakBadge({ streak, practisedToday }: { streak: number; practisedToday: boolean }) {
  return <p data-testid="streak" className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
    <span aria-hidden className="text-xl">{streak > 0 ? '🔥' : '🌱'}</span>
    <span>{streakMessage(streak, practisedToday)}</span>
  </p>;
}
