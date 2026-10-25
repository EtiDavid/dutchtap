'use client';
import Link from 'next/link';
import { LEVEL_LABELS } from '@/lib/flashcards/engine';
import { COLLECTION_LABELS } from '@/lib/content/collections';
import { retired, sessionStats, topicLabel } from '@/lib/sessions/engine';
import { sessionUrl } from '@/lib/sessions/nav';
import type { Session } from '@/lib/sessions/types';
import { LANG_INFO } from '@/lib/lang';
import { button } from '../flashcards/styles';
import { Icon } from '../ui/Icon';

/** One session in the list: its fixed set, separate progress per mode, and the Study / Speaking / Quiz actions. */
export function SessionCard({ session, refused, highlight, onRename, onDelete, onRetry, onAgain, againDisabled }: {
  session: Session; refused?: string; highlight?: boolean; onRename: () => void; onDelete: () => void; onRetry: () => void; onAgain: () => void; againDisabled: boolean;
}) {
  const stats = sessionStats(session);
  const total = session.cardIds.length;
  const done = session.status === 'archived';
  const modeIcon = { study: 'book', speaking: 'mic', quiz: 'puzzle' } as const;
  return <article data-testid="session-card" data-session={session.id} className={`card flex flex-col gap-4 p-5 ${highlight ? '!border-accent ring-2 ring-accent/15' : ''}`}>
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-snug tracking-tight">{session.name}</h3>
        <p className="mt-1 text-xs text-muted"><span data-testid="session-card-language" lang={session.lang}>{LANG_INFO[session.lang].flag} {LANG_INFO[session.lang].native}</span> · {session.collection !== 'everyday' ? `${COLLECTION_LABELS[session.collection]} · ` : ''}{topicLabel(session.topic)} · {total} {total === 1 ? 'card' : 'cards'} · started with {LEVEL_LABELS[session.startingLevel]}{done ? ' · completed' : ''}</p>
      </div>
      {done && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><Icon name="check" className="h-3.5 w-3.5" />Completed</span>}
    </header>
    <div className="grid gap-3 text-sm">
      <div><div className="flex justify-between font-medium"><span>Speaking{session.speaking.done ? ' ✓' : ''}</span><span className="text-muted" data-testid="card-speaking">{retired(session, 'speaking')} / {total}</span></div><progress aria-label="Speaking progress" max={total} value={retired(session, 'speaking')} className="flash-progress mt-1.5 h-2 w-full" /></div>
      <div><div className="flex justify-between font-medium"><span>Quiz{session.quiz.done ? ' ✓' : ''}</span><span className="text-muted" data-testid="card-quiz">{retired(session, 'quiz')} / {total} · {stats.quizPoints} pts</span></div><progress aria-label="Quiz progress" max={total} value={retired(session, 'quiz')} className="flash-progress mt-1.5 h-2 w-full" /></div>
      <p className="text-xs text-muted">Study: round {stats.studyRound}, sentence {stats.studyPosition} of {total}</p>
    </div>
    {refused && <p role="alert" className="rounded-xl bg-accent-soft p-3 text-xs">{refused} <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button></p>}
    <div className="grid grid-cols-3 gap-2">
      {(['study', 'speaking', 'quiz'] as const).map(mode => <Link key={mode} href={sessionUrl(session.id, mode)} className={`${button} flex-col !gap-1 !py-2.5 text-center capitalize`}><Icon name={modeIcon[mode]} className="h-[1.125rem] w-[1.125rem] text-accent" />{mode}</Link>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
      <div className="flex gap-4"><button type="button" className="font-medium text-muted hover:text-foreground" onClick={onRename}>Rename</button><button type="button" className="font-medium text-accent" onClick={onDelete}>Delete</button></div>
      {done && <button type="button" className="font-semibold text-accent disabled:opacity-50" disabled={againDisabled} onClick={onAgain}>Practise this set again</button>}
    </div>
  </article>;
}
