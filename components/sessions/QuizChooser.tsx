'use client';
import Link from 'next/link';
import { retired } from '@/lib/sessions/engine';
import { sessionUrl } from '@/lib/sessions/nav';
import { useSessions } from '@/lib/sessions/useSessions';
import { AppNav } from '../nav/AppNav';
import { LanguageGate } from '../lang/LanguageGate';
import { LanguageSwitch } from '../lang/LanguageSwitch';
import { LANG_INFO, withLang, type Lang } from '@/lib/lang';
import { button, primary } from '../flashcards/styles';
import { SyncStatus } from './SyncStatus';
import { PageHeader } from '../ui/PageHeader';

/** The Quiz tab: pick which session to quiz on. The quiz always uses that session's fixed sentences. */
export function QuizChooser() {
  return <LanguageGate>{(lang, choose) => <Chooser key={lang} lang={lang} onSwitchLanguage={choose} />}</LanguageGate>;
}

function Chooser({ lang, onSwitchLanguage }: { lang: Lang; onSwitchLanguage: (lang: Lang) => void }) {
  const { store, snapshot, account } = useSessions();
  const everyActive = snapshot.sessions.filter(s => s.status === 'active');
  const active = everyActive.filter(s => s.lang === lang);
  const elsewhere = everyActive.length - active.length;
  const last = snapshot.lastOpened && active.find(s => s.id === snapshot.lastOpened!.id);
  const ready = !!store && snapshot.ready;
  return <main className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6">
    <PageHeader eyebrow="Practise" title="Quiz" subtitle="Tap the words of a sentence back into order. Choose a session: the quiz only uses that session’s sentences, so it matches what you studied." action={<LanguageSwitch lang={lang} onSwitch={onSwitchLanguage} />} />
    {!ready ? <p className="text-muted" role="status">Loading your sessions…</p> : <>
      {store && <SyncStatus snapshot={snapshot} guest={!account} onRetry={() => void store.sync()} />}
      {last && <Link href={sessionUrl(last.id, 'quiz')} className={`${primary} block text-center`} data-testid="continue-quiz">Continue quiz: {last.name}</Link>}
      {active.length === 0
        ? <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-5 text-center" data-testid="quiz-empty">
          <p className="text-sm text-muted">You need a session first. A session is a fixed set of sentences that you study, say from memory, and quiz yourself on.</p>
          <Link href={withLang('/flashcards', lang)} className={`${primary} block`}>{lang === 'nl' ? 'Create a session' : `Create a ${LANG_INFO[lang].english} session`}</Link>
        </section>
        : <ul className="flex flex-col gap-3">{active.map(session => <li key={session.id} className="card p-4" data-testid="quiz-session">
          <h2 className="font-bold">{session.name}</h2>
          <p className="mt-1 text-xs text-muted">Quiz: {retired(session, 'quiz')} of {session.cardIds.length} cards retired · {session.quiz.points} points{session.quiz.done ? ' · completed' : ''}</p>
          <Link href={sessionUrl(session.id, 'quiz')} className={`${button} mt-3 block text-center`}>{session.quiz.done ? 'Open (quiz completed)' : 'Start or continue quiz'}</Link>
        </li>)}</ul>}
      {elsewhere > 0 && <p className="text-center text-xs text-muted" data-testid="quiz-other-language">You also have {elsewhere} active {elsewhere === 1 ? 'session' : 'sessions'} in another language. The limit of five counts every language.</p>}
      <Link href={withLang('/flashcards', lang)} className="text-center text-sm text-accent underline">All sessions</Link>
    </>}
    <AppNav lang={lang} />
  </main>;
}
