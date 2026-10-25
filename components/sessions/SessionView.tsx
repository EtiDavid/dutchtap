'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Reviews } from '@/lib/flashcards/engine';
import { retired } from '@/lib/sessions/engine';
import { DASHBOARD_URL, navigateTo, parseMode, sessionUrl } from '@/lib/sessions/nav';
import type { SessionStore, Snapshot } from '@/lib/sessions/store';
import { MAX_ACTIVE_SESSIONS, type Mode } from '@/lib/sessions/types';
import { LANG_INFO, withLang, type Lang } from '@/lib/lang';
import { button, primary } from '../flashcards/styles';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { CompletionSummary } from './CompletionSummary';
import { QuizMode } from './QuizMode';
import { GrammarTopicLesson } from './GrammarTopicLesson';
import { SpeakingMode } from './SpeakingMode';
import { StudyMode } from './StudyMode';
import { SyncStatus } from './SyncStatus';

/** One session: its name, a Study / Speaking / Quiz switcher, and the active mode. The set of cards never changes while you switch. */
export function SessionView({ sessionId, lang, store, snapshot, reviews, reviewsReady, signedIn, onPractised, celebration, onDismissCelebration }: {
  sessionId: string; lang: Lang; store: SessionStore; snapshot: Snapshot; reviews: Reviews; reviewsReady: boolean; signedIn: boolean;
  onPractised: () => void; celebration: string; onDismissCelebration: () => void;
}) {
  const params = useSearchParams();
  const session = snapshot.sessions.find(s => s.id === sessionId);
  const requested = parseMode(params.get('mode'));
  const mode: Mode = requested ?? (snapshot.lastOpened?.id === sessionId ? snapshot.lastOpened.mode : 'study');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { if (session) store.setLastOpened(session.id, mode); }, [store, session, mode]);

  if (!session) return <section className="flex flex-col gap-4 card p-6 text-center" data-testid="session-missing">
    <h2 className="text-xl font-bold">Session not found</h2>
    <p className="text-sm text-muted">It may have been deleted, possibly on another device. Your card levels are unchanged.</p>
    <Link href={withLang(DASHBOARD_URL, lang)} className={`${primary} block`}>Back to sessions</Link>
  </section>;

  const total = session.cardIds.length;
  const activeCount = snapshot.sessions.filter(s => s.status === 'active').length;
  const tabs: { mode: Mode; label: string; detail: string; done: boolean }[] = [
    { mode: 'study', label: 'Study', detail: `Round ${session.study.round}`, done: false },
    { mode: 'speaking', label: 'Speaking', detail: `${retired(session, 'speaking')}/${total}`, done: session.speaking.done },
    { mode: 'quiz', label: 'Quiz', detail: `${retired(session, 'quiz')}/${total} · ${session.quiz.points} pts`, done: session.quiz.done },
  ];
  const props = { session, store, reviews, reviewsReady, onPractised };

  function again() {
    const result = store.practiseAgain(session!.id);
    if (result.ok) navigateTo(sessionUrl(result.session.id, 'study')); else setNotice(result.message);
  }

  return <div className="flex flex-col gap-5">
    <div className="flex items-center justify-between gap-3">
      <Link href={withLang(DASHBOARD_URL, session.lang)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent" data-testid="back-to-sessions"><Icon name="back" className="h-4 w-4" />Back to sessions</Link>
      <button type="button" className="text-sm text-muted underline" onClick={() => { setName(session.name); setRenaming(true); }}>Rename</button>
    </div>
    <div><h2 className="text-2xl font-bold leading-snug tracking-tight" data-testid="session-name">{session.name}</h2><p className="text-xs text-muted"><span data-testid="session-language" lang={session.lang}>{LANG_INFO[session.lang].flag} {LANG_INFO[session.lang].native}</span> · {total} fixed {total === 1 ? 'sentence' : 'sentences'} · the same set in every mode</p></div>
    <SyncStatus snapshot={snapshot} guest={!signedIn} onRetry={() => void store.sync()} />
    {snapshot.refused[session.id] && <p role="alert" className="rounded-xl bg-accent-soft p-3 text-xs">{snapshot.refused[session.id]} <button type="button" onClick={() => store.retryRefused(session.id)} className="font-semibold underline">Retry</button></p>}
    {notice && <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm">{notice}</p>}
    {celebration && <p role="status" data-testid="milestone" className="flex items-start justify-between gap-3 rounded-2xl bg-success/15 px-4 py-3 text-sm font-semibold"><span>🏆 {celebration}</span><button type="button" aria-label="Dismiss" className="text-muted" onClick={onDismissCelebration}>✕</button></p>}

    <nav aria-label="Session mode" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
      {tabs.map(tab => <button key={tab.mode} type="button" aria-current={mode === tab.mode ? 'page' : undefined} data-mode={tab.mode}
        onClick={() => navigateTo(sessionUrl(session.id, tab.mode), true)}
        className={`${button} flex flex-col items-center !gap-0 px-1 py-2 leading-tight !shadow-none ${mode === tab.mode ? '!border-transparent !bg-surface !text-accent shadow-sm' : '!border-transparent !bg-transparent !text-muted'}`}>
        <span>{tab.label}{tab.done ? ' ✓' : ''}</span><span className="text-[11px] font-normal">{tab.detail}</span>
      </button>)}
    </nav>

    {session.collection === 'grammar' && session.lang === 'nl' && <GrammarTopicLesson topic={session.topic} />}

    {session.status === 'archived' && <CompletionSummary session={session} onAgain={again} againDisabled={activeCount >= MAX_ACTIVE_SESSIONS} againMessage={`You already have ${MAX_ACTIVE_SESSIONS} active sessions, so finish or delete one first.`} />}

    {mode === 'study' && <StudyMode {...props} />}
    {mode === 'speaking' && <SpeakingMode {...props} />}
    {mode === 'quiz' && <QuizMode {...props} />}

    {renaming && <Modal title="Rename session" onClose={() => setRenaming(false)}>
      <form className="mt-4 flex flex-col gap-4" onSubmit={event => { event.preventDefault(); if (name.trim()) { store.rename(session.id, name); setRenaming(false); } }}>
        <label className="text-sm font-semibold">Session name<input data-autofocus value={name} maxLength={80} onChange={event => setName(event.target.value)} className="mt-2 w-full field" /></label>
        <div className="grid grid-cols-2 gap-2"><button type="button" className={button} onClick={() => setRenaming(false)}>Cancel</button><button type="submit" className={primary} disabled={!name.trim()}>Save</button></div>
      </form>
    </Modal>}
  </div>;
}
