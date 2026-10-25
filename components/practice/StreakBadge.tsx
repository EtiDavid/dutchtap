import { streakMessage } from '@/lib/practice/streak';
import { Icon } from '@/components/ui/Icon';

export function StreakBadge({ streak, practisedToday }: { streak: number; practisedToday: boolean }) {
  return <p data-testid="streak" className="card-flat flex items-center gap-3 px-4 py-3 text-sm">
    <span aria-hidden className={`flex h-9 w-9 items-center justify-center rounded-full ${streak > 0 ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}><Icon name="flame" className="h-[1.125rem] w-[1.125rem]" filled={streak > 0} /></span>
    <span className="font-medium">{streakMessage(streak, practisedToday)}</span>
  </p>;
}
