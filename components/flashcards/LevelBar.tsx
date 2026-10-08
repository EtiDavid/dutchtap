import { LEVELS, LEVEL_LABELS, type Level } from '@/lib/flashcards/engine';
import { nextMilestone } from '@/lib/flashcards/milestones';

const COLOURS: Record<Level, string> = {
  difficult: 'bg-accent', medium: 'bg-accent/50', easy: 'bg-success/50', mastered: 'bg-success',
};

/** A picture of how well the learner knows the cards, not a score. Difficult shrinks and Mastered grows as they learn. */
export function LevelBar({ counts }: { counts: Record<Level, number> }) {
  const total = LEVELS.reduce((sum, l) => sum + counts[l], 0) || 1;
  const summary = LEVELS.map(l => `${LEVEL_LABELS[l]} ${counts[l]}`).join(' · ');
  const next = nextMilestone(counts.mastered);
  return <section aria-label="Your cards by level" className="rounded-2xl border border-border bg-surface p-4">
    <div className="flex items-baseline justify-between"><h2 className="text-sm font-semibold">Your progress</h2><span className="text-xs text-muted">{counts.mastered} of {total} mastered</span></div>
    <div role="img" aria-label={summary} className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-border">
      {LEVELS.map(l => counts[l] > 0 && <div key={l} data-level={l} className={`${COLOURS[l]} transition-all duration-500`} style={{ width: `${(counts[l] / total) * 100}%` }} />)}
    </div>
    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
      {LEVELS.map(l => <li key={l} className="flex items-center gap-2"><span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${COLOURS[l]}`} />{LEVEL_LABELS[l]} <strong className="ml-auto text-foreground">{counts[l]}</strong></li>)}
    </ul>
    {next && <p className="mt-3 text-xs text-muted">{next - counts.mastered} more mastered {next - counts.mastered === 1 ? 'card' : 'cards'} until {next}.</p>}
  </section>;
}
