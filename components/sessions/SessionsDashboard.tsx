'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MAX_ACTIVE_SESSIONS, type Session } from '@/lib/sessions/types';
import { createSessionFromIds } from '@/lib/sessions/engine';
import { clearLegacy, readLegacy, type LegacyPractice } from '@/lib/sessions/legacy';
import { DASHBOARD_URL, navigateTo, sessionUrl } from '@/lib/sessions/nav';
import type { SessionStore, Snapshot } from '@/lib/sessions/store';
import { useGuestStore } from '@/lib/sessions/useSessions';
import { countByLevel, CARDS, type Reviews } from '@/lib/flashcards/engine';
import { button, primary } from '../flashcards/styles';
import { LevelBar } from '../flashcards/LevelBar';
import { StreakBadge } from '../practice/StreakBadge';
import { Modal } from '../ui/Modal';
import { CreateSessionDialog } from './CreateSessionDialog';
import { SessionCard } from './SessionCard';
import { SyncStatus } from './SyncStatus';

type Props = {
  store: SessionStore; snapshot: Snapshot; reviews: Reviews; signedIn: boolean;
  streak: { streak: number; practisedToday: boolean }; levelsStatus: string; guestLevelsAvailable: boolean; onCopyGuestLevels: () => void;
};

/** The session dashboard: create a session, continue an active one, or look back at completed ones. */
export function SessionsDashboard({ store, snapshot, reviews, signedIn, streak, levelsStatus, guestLevelsAvailable, onCopyGuestLevels }: Props) {
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [renaming, setRenaming] = useState<Session | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<{ practice: LegacyPractice | null; found: boolean }>({ practice: null, found: false });
  const { guestStore, guestSnapshot } = useGuestStore(signedIn);

  // Old transient practice state lives in localStorage, so it is read after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLegacy(readLegacy()); }, []);

  const active = snapshot.sessions.filter(s => s.status === 'active');
  const completed = snapshot.sessions.filter(s => s.status === 'archived');
  const localOnly = active.filter(session => snapshot.refused[session.id]).length; // refused by the account, kept on this device
  const full = active.length >= MAX_ACTIVE_SESSIONS;
  const last = snapshot.lastOpened && snapshot.sessions.find(s => s.id === snapshot.lastOpened!.id && s.status === 'active');
  const levelCounts = countByLevel(CARDS, reviews);

  function open(id: string, mode: 'study' | 'speaking' | 'quiz' = 'study') { navigateTo(sessionUrl(id, mode)); }
  function handleCreate(session: Session): string | null {
    const result = store.create(session);
    if (!result.ok) return result.message;
    setCreating(false); open(session.id, 'study');
    return null;
  }
  function again(id: string) {
    const result = store.practiseAgain(id);
    if (result.ok) open(result.session.id, 'study'); else setMessage(result.message);
  }
  function importLegacy() {
    if (!legacy.practice) return;
    const session = createSessionFromIds({ name: `Earlier practice · ${legacy.practice.cardIds.length} cards`, cardIds: legacy.practice.cardIds, topic: legacy.practice.topic, startingLevel: 'difficult' });
    const result = store.create(session);
    if (!result.ok) { setMessage(result.message); return; }
    clearLegacy(); setLegacy({ practice: null, found: false }); open(session.id, 'study');
  }
  function dismissLegacy() { clearLegacy(); setLegacy({ practice: null, found: false }); }
  function importGuest() {
    if (!guestStore) return;
    const result = store.importFrom(guestStore);
    const parts = [`${result.imported} ${result.imported === 1 ? 'session' : 'sessions'} imported`];
    if (result.duplicates) parts.push(`${result.duplicates} already on your account`);
    if (result.skipped) parts.push(`${result.skipped} kept on this device because you already have ${MAX_ACTIVE_SESSIONS} active sessions`);
    setMessage(`${parts.join(' · ')}.`);
  }

  const list = tab === 'active' ? active : completed;
  return <div className="flex flex-col gap-5">
    <StreakBadge streak={streak.streak} practisedToday={streak.practisedToday} />
    <SyncStatus snapshot={snapshot} guest={!signedIn} onRetry={() => void store.sync()} />

    {snapshot.notices.map(notice => <p key={notice.id} role="status" className="flex items-start justify-between gap-3 rounded-2xl bg-accent/10 px-4 py-3 text-sm"><span>{notice.text}</span><button type="button" aria-label="Dismiss notice" className="text-muted" onClick={() => store.dismissNotice(notice.id)}>✕</button></p>)}
    {message && <p role="status" className="flex items-start justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-sm"><span>{message}</span><button type="button" aria-label="Dismiss message" className="text-muted" onClick={() => setMessage(null)}>✕</button></p>}

    {legacy.found && <section aria-label="Earlier practice" className="rounded-2xl border border-border bg-surface p-4 text-sm" data-testid="legacy-banner">
      <p className="font-semibold">Practice sessions are now saved.</p>
      <p className="mt-1 text-muted">{legacy.practice ? `We found an earlier flashcard set of ${legacy.practice.cardIds.length} sentences. You can keep it as a saved session.` : 'Your earlier unfinished practice is replaced by saved sessions. Your card levels are unchanged.'}</p>
      <div className="mt-3 flex gap-2">{legacy.practice && <button type="button" className={primary} onClick={importLegacy}>Keep as a session</button>}<button type="button" className={button} onClick={dismissLegacy}>{legacy.practice ? 'No thanks' : 'OK'}</button></div>
    </section>}

    {signedIn && guestSnapshot.sessions.length > 0 && <section aria-label="Guest sessions" className="rounded-2xl border border-border bg-surface p-4 text-sm" data-testid="guest-import">
      <p className="font-semibold">You have {guestSnapshot.sessions.length} guest {guestSnapshot.sessions.length === 1 ? 'session' : 'sessions'} on this device.</p>
      <p className="mt-1 text-muted">Add them to your account? Their progress comes with them. Anything that does not fit in your five active sessions stays here.</p>
      <button type="button" className={`${primary} mt-3`} onClick={importGuest}>Import guest sessions</button>
    </section>}

    {last && <Link href={sessionUrl(last.id, snapshot.lastOpened!.mode)} className={`${primary} block text-center`} data-testid="continue">Continue: {last.name} · {snapshot.lastOpened!.mode}</Link>}

    <section aria-label="Create" className="flex flex-col gap-2">
      <button type="button" className={last ? button : primary} onClick={() => setCreating(true)} disabled={full}>Create session</button>
      {full && <p className="text-xs text-muted" data-testid="limit-hint">You have {MAX_ACTIVE_SESSIONS} active sessions. Finish one (complete Speaking and the Quiz) or delete one to create another.</p>}
    </section>

    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Sessions">
      <button type="button" aria-pressed={tab === 'active'} onClick={() => setTab('active')} className={`${button} ${tab === 'active' ? 'border-accent bg-accent text-white' : ''}`}>Active ({active.length - localOnly}/{MAX_ACTIVE_SESSIONS}{localOnly ? ` + ${localOnly} on this device only` : ''})</button>
      <button type="button" aria-pressed={tab === 'completed'} onClick={() => setTab('completed')} className={`${button} ${tab === 'completed' ? 'border-accent bg-accent text-white' : ''}`}>Completed ({completed.length})</button>
    </div>

    {list.length === 0
      ? <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted" data-testid="empty">
        {tab === 'active' ? <>No active sessions yet. A session is a fixed set of sentences you study, say from memory, and quiz yourself on. Create one to begin.</> : 'Completed sessions appear here once both Speaking and the Quiz are finished.'}
      </p>
      : list.map(session => <SessionCard key={session.id} session={session} refused={snapshot.refused[session.id]} highlight={last ? last.id === session.id : false}
        onRename={() => { setRenaming(session); setRenameValue(session.name); }} onDelete={() => setDeleting(session)} onRetry={() => store.retryRefused(session.id)} onAgain={() => again(session.id)} againDisabled={full} />)}

    <hr className="border-border" />
    <section aria-label="Card levels" className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Your card levels</h2>
      <p className="text-xs text-muted">Levels belong to the sentences, not to a session. They only change when you rate a card in Speaking. {levelsStatus}</p>
      <LevelBar counts={levelCounts} />
      {guestLevelsAvailable && <button type="button" className={button} onClick={onCopyGuestLevels}>Copy my guest card levels to this account</button>}
    </section>

    {creating && <CreateSessionDialog reviews={reviews} activeCount={active.length} onCreate={handleCreate} onClose={() => setCreating(false)} />}
    {deleting && <Modal title="Delete this session?" onClose={() => setDeleting(null)}>
      <p className="mt-3 text-sm"><strong>{deleting.name}</strong> and its session progress (Speaking and Quiz counters, points, Study position) will be removed.</p>
      <p className="mt-2 text-sm text-muted">Your card levels (Difficult, Medium, Easy, Mastered) stay as they are, and your other sessions are not affected.</p>
      <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" data-autofocus className={button} onClick={() => setDeleting(null)}>Keep session</button><button type="button" className={`${button} border-accent text-accent`} onClick={() => { store.remove(deleting.id); setDeleting(null); }}>Delete session</button></div>
    </Modal>}
    {renaming && <Modal title="Rename session" onClose={() => setRenaming(null)}>
      <form className="mt-4 flex flex-col gap-4" onSubmit={event => { event.preventDefault(); if (renameValue.trim()) { store.rename(renaming.id, renameValue); setRenaming(null); } }}>
        <label className="text-sm font-semibold">Session name<input data-autofocus value={renameValue} maxLength={80} onChange={event => setRenameValue(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" /></label>
        <div className="grid grid-cols-2 gap-2"><button type="button" className={button} onClick={() => setRenaming(null)}>Cancel</button><button type="submit" className={primary} disabled={!renameValue.trim()}>Save</button></div>
      </form>
    </Modal>}
  </div>;
}

export { DASHBOARD_URL };
