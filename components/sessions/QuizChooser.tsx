'use client';
import Link from 'next/link';
import { retired } from '@/lib/sessions/engine';
import { sessionUrl } from '@/lib/sessions/nav';
import { useSessions } from '@/lib/sessions/useSessions';
import { AppNav } from '../nav/AppNav';
import { button, primary } from '../flashcards/styles';
import { SyncStatus } from './SyncStatus';

/** The Quiz tab: pick which session to quiz on. The quiz always uses that session's fixed sentences. */
export function QuizChooser() {
  const { store, snapshot, account } = useSessions();
  const active = snapshot.sessions.filter(s => s.status === 'active');
  const last = snapshot.lastOpened && active.find(s => s.id === snapshot.lastOpened!.id);
  const ready = !!store && snapshot.ready;
  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-5 pb-28 pt-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Quiz</h1><p className="mt-1 text-sm text-muted">Tap the words of a sentence back into order. Choose a session: the quiz only uses that session’s sentences, so it matches what you studied.</p></div>
    {!ready ? <p className="text-muted" role="status">Loading your sessions…</p> : <>
      {store && <SyncStatus snapshot={snapshot} guest={!account} onRetry={() => void store.sync()} />}
      {last && <Link href={sessionUrl(last.id, 'quiz')} className={`${primary} block text-center`} data-testid="continue-quiz">Continue quiz: {last.name}</Link>}
      {active.length === 0
        ? <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-5 text-center" data-testid="quiz-empty">
          <p className="text-sm text-muted">You need a session first. A session is a fixed set of sentences that you study, say from memory, and quiz yourself on.</p>
          <Link href="/flashcards" className={`${primary} block`}>Create a session</Link>
        </section>
        : <ul className="flex flex-col gap-3">{active.map(session => <li key={session.id} className="rounded-2xl border border-border bg-surface p-4" data-testid="quiz-session">
          <h2 className="font-bold">{session.name}</h2>
          <p className="mt-1 text-xs text-muted">Quiz: {retired(session, 'quiz')} of {session.cardIds.length} cards retired · {session.quiz.points} points{session.quiz.done ? ' · completed' : ''}</p>
          <Link href={sessionUrl(session.id, 'quiz')} className={`${button} mt-3 block text-center`}>{session.quiz.done ? 'Open (quiz completed)' : 'Start or continue quiz'}</Link>
        </li>)}</ul>}
      <Link href="/flashcards" className="text-center text-sm text-accent underline">All sessions</Link>
    </>}
    <AppNav />
  </main>;
}
