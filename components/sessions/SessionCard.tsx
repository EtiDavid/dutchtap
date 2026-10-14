'use client';
import Link from 'next/link';
import { LEVEL_LABELS } from '@/lib/flashcards/engine';
import { retired, sessionStats, topicLabel } from '@/lib/sessions/engine';
import { sessionUrl } from '@/lib/sessions/nav';
import type { Session } from '@/lib/sessions/types';
import { LANG_INFO } from '@/lib/lang';
import { button } from '../flashcards/styles';

/** One session in the list: its fixed set, separate progress per mode, and the Study / Speaking / Quiz actions. */
export function SessionCard({ session, refused, highlight, onRename, onDelete, onRetry, onAgain, againDisabled }: {
  session: Session; refused?: string; highlight?: boolean; onRename: () => void; onDelete: () => void; onRetry: () => void; onAgain: () => void; againDisabled: boolean;
}) {
  const stats = sessionStats(session);
  const total = session.cardIds.length;
  const done = session.status === 'archived';
  return <article data-testid="session-card" data-session={session.id} className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 ${highlight ? 'border-accent' : 'border-border'}`}>
    <header className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold leading-snug">{session.name}</h3>
        <p className="text-xs text-muted"><span data-testid="session-card-language" lang={session.lang}>{LANG_INFO[session.lang].flag} {LANG_INFO[session.lang].native}</span> · {topicLabel(session.topic)} · {total} {total === 1 ? 'card' : 'cards'} · started with {LEVEL_LABELS[session.startingLevel]}{done ? ' · completed' : ''}</p>
      </div>
      {done && <span className="rounded-full bg-success/20 px-2 py-1 text-xs font-semibold">Completed</span>}
    </header>
    <div className="grid gap-2 text-sm">
      <div><div className="flex justify-between"><span>Speaking{session.speaking.done ? ' ✓' : ''}</span><span data-testid="card-speaking">{retired(session, 'speaking')} / {total}</span></div><progress aria-label="Speaking progress" max={total} value={retired(session, 'speaking')} className="flash-progress mt-1 h-1.5 w-full" /></div>
      <div><div className="flex justify-between"><span>Quiz{session.quiz.done ? ' ✓' : ''}</span><span data-testid="card-quiz">{retired(session, 'quiz')} / {total} · {stats.quizPoints} pts</span></div><progress aria-label="Quiz progress" max={total} value={retired(session, 'quiz')} className="flash-progress mt-1 h-1.5 w-full" /></div>
      <p className="text-xs text-muted">Study: round {stats.studyRound}, sentence {stats.studyPosition} of {total}</p>
    </div>
    {refused && <p role="alert" className="rounded-xl bg-accent/10 p-3 text-xs">{refused} <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button></p>}
    <div className="grid grid-cols-3 gap-2">
      {(['study', 'speaking', 'quiz'] as const).map(mode => <Link key={mode} href={sessionUrl(session.id, mode)} className={`${button} text-center capitalize`}>{mode}</Link>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex gap-4"><button type="button" className="underline" onClick={onRename}>Rename</button><button type="button" className="text-accent underline" onClick={onDelete}>Delete</button></div>
      {done && <button type="button" className="font-semibold text-accent underline disabled:opacity-50" disabled={againDisabled} onClick={onAgain}>Practise this set again</button>}
    </div>
  </article>;
}
