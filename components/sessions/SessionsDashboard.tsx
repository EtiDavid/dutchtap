'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GRAMMAR_AREAS, WORK_AREAS, type Collection } from '@/lib/content/collections';
import { MAX_ACTIVE_SESSIONS, type Session } from '@/lib/sessions/types';
import { createSessionFromIds } from '@/lib/sessions/engine';
import { clearLegacy, readLegacy, type LegacyPractice } from '@/lib/sessions/legacy';
import { DASHBOARD_URL, navigateTo, sessionUrl } from '@/lib/sessions/nav';
import type { SessionStore, Snapshot } from '@/lib/sessions/store';
import { useGuestStore } from '@/lib/sessions/useSessions';
import { countByLevel, type Reviews } from '@/lib/flashcards/engine';
import { cardsFor } from '@/lib/content/cards';
import { LANG_INFO, withLang, type Lang } from '@/lib/lang';
import { LanguageSwitch } from '../lang/LanguageSwitch';
import { button, primary } from '../flashcards/styles';
import { Icon } from '../ui/Icon';
import { Section } from '../ui/PageHeader';
import { StreakBadge } from '../practice/StreakBadge';
import { Modal } from '../ui/Modal';
import { CreateSessionDialog } from './CreateSessionDialog';
import { PatternTiles } from './PatternTiles';
import { SessionCard } from './SessionCard';
import { SyncStatus } from './SyncStatus';

type Props = {
  lang: Lang; onSwitchLanguage: (lang: Lang) => void;
  store: SessionStore; snapshot: Snapshot; reviews: Reviews; signedIn: boolean;
  streak: { streak: number; practisedToday: boolean };
};

/** The session dashboard: create a session, continue an active one, or look back at completed ones. */
export function SessionsDashboard({ lang, onSwitchLanguage, store, snapshot, reviews, signedIn, streak }: Props) {
  // A link such as /flashcards?new=grammar:als opens the Create session form already pointed at that pattern.
  const requested = useSearchParams().get('new');
  const [initial] = useState<{ collection: Collection; topic: string } | undefined>(() => {
    const [collection, topic = 'all'] = (requested ?? '').split(':');
    if (collection === 'grammar' && (topic === 'all' || Object.hasOwn(GRAMMAR_AREAS, topic))) return { collection, topic };
    if (collection === 'workplace' && (topic === 'all' || Object.hasOwn(WORK_AREAS, topic))) return { collection, topic };
    return undefined;
  });
  const [creating, setCreating] = useState(() => initial !== undefined && lang === 'nl');
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [showAll, setShowAll] = useState(false);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [renaming, setRenaming] = useState<Session | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<{ practice: LegacyPractice | null; found: boolean }>({ practice: null, found: false });
  const { guestStore, guestSnapshot } = useGuestStore(signedIn);

  // Old transient practice state lives in localStorage, so it is read after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLegacy(readLegacy()); }, []);

  // The five-session limit counts sessions in ALL languages; the list can be narrowed to this language, but the limit is never hidden.
  const allActive = snapshot.sessions.filter(s => s.status === 'active');
  const visible = snapshot.sessions.filter(s => showAll || s.lang === lang);
  const active = visible.filter(s => s.status === 'active');
  const completed = visible.filter(s => s.status === 'archived');
  const elsewhere = snapshot.sessions.length - snapshot.sessions.filter(s => s.lang === lang).length;
  const otherActive = allActive.filter(s => s.lang !== lang);
  const localOnly = active.filter(session => snapshot.refused[session.id]).length; // refused by the account, kept on this device
  const full = allActive.length >= MAX_ACTIVE_SESSIONS;
  const last = snapshot.lastOpened && visible.find(s => s.id === snapshot.lastOpened!.id && s.status === 'active');
  const levelCounts = countByLevel(cardsFor(lang), reviews);

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
    const session = createSessionFromIds({ lang: 'nl', name: `Earlier practice · ${legacy.practice.cardIds.length} cards`, cardIds: legacy.practice.cardIds, topic: legacy.practice.topic, startingLevel: 'difficult' });
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
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted" data-testid="dashboard-language">Learning <strong className="text-foreground" lang={lang}>{LANG_INFO[lang].native}</strong></p><LanguageSwitch lang={lang} onSwitch={onSwitchLanguage} /></div>
    <StreakBadge streak={streak.streak} practisedToday={streak.practisedToday} />
    <SyncStatus snapshot={snapshot} guest={!signedIn} onRetry={() => void store.sync()} />

    {snapshot.notices.map(notice => <p key={notice.id} role="status" className="flex items-start justify-between gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm"><span>{notice.text}</span><button type="button" aria-label="Dismiss notice" className="text-muted" onClick={() => store.dismissNotice(notice.id)}>✕</button></p>)}
    {message && <p role="status" className="flex items-start justify-between gap-3 card-flat px-4 py-3 text-sm"><span>{message}</span><button type="button" aria-label="Dismiss message" className="text-muted" onClick={() => setMessage(null)}>✕</button></p>}

    {lang === 'nl' && legacy.found && <section aria-label="Earlier practice" className="card p-4 text-sm" data-testid="legacy-banner">
      <p className="font-semibold">Practice sessions are now saved.</p>
      <p className="mt-1 text-muted">{legacy.practice ? `We found an earlier flashcard set of ${legacy.practice.cardIds.length} sentences. You can keep it as a saved session.` : 'Your earlier unfinished practice is replaced by saved sessions. Your card levels are unchanged.'}</p>
      <div className="mt-3 flex gap-2">{legacy.practice && <button type="button" className={primary} onClick={importLegacy}>Keep as a session</button>}<button type="button" className={button} onClick={dismissLegacy}>{legacy.practice ? 'No thanks' : 'OK'}</button></div>
    </section>}

    {signedIn && guestSnapshot.sessions.length > 0 && <section aria-label="Guest sessions" className="card p-4 text-sm" data-testid="guest-import">
      <p className="font-semibold">You have {guestSnapshot.sessions.length} guest {guestSnapshot.sessions.length === 1 ? 'session' : 'sessions'} on this device.</p>
      <p className="mt-1 text-muted">Add them to your account? Their progress comes with them. Anything that does not fit in your five active sessions stays here.</p>
      <button type="button" className={`${primary} mt-3`} onClick={importGuest}>Import guest sessions</button>
    </section>}

    {elsewhere > 0 && <p className="flex flex-wrap items-center gap-2 card-flat px-4 py-3 text-xs" data-testid="other-language-sessions"><span>{showAll ? 'Showing sessions in every language.' : `You also have ${elsewhere} ${elsewhere === 1 ? 'session' : 'sessions'} in another language (${otherActive.length} active).`}</span><button type="button" className="font-semibold text-accent underline" onClick={() => setShowAll(value => !value)}>{showAll ? `Show only ${LANG_INFO[lang].english}` : 'Show all sessions'}</button></p>}

    {last && <Link href={sessionUrl(last.id, snapshot.lastOpened!.mode)} className={`${primary} !min-h-14 justify-between text-base`} data-testid="continue"><span className="truncate">Continue: {last.name} · {snapshot.lastOpened!.mode}</span><Icon name="chevron" className="h-4 w-4 shrink-0" /></Link>}

    <section aria-label="Create" className="flex flex-col gap-2">
      <button type="button" className={`${last ? button : primary} gap-2`} onClick={() => setCreating(true)} disabled={full}><Icon name="plus" className="h-4 w-4" />Create session</button>
      {full && <p className="text-xs text-muted" data-testid="limit-hint">You have {MAX_ACTIVE_SESSIONS} active sessions across all languages{otherActive.length ? ` (${allActive.length - otherActive.length} in ${LANG_INFO[lang].english}, ${otherActive.length} in other languages)` : ''}. Finish one (complete Speaking and the Quiz) or delete one to create another.</p>}
    </section>

    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="group" aria-label="Sessions">
      <button type="button" aria-pressed={tab === 'active'} onClick={() => setTab('active')} className={`${button} !min-h-11 !shadow-none ${tab === 'active' ? '!border-transparent !bg-surface shadow-sm !text-accent' : '!border-transparent !bg-transparent !text-muted'}`}>Active ({showAll || !otherActive.length ? `${active.length - localOnly}/${MAX_ACTIVE_SESSIONS}` : `${active.length - localOnly} · ${allActive.length}/${MAX_ACTIVE_SESSIONS} in all languages`}{localOnly ? ` + ${localOnly} on this device only` : ''})</button>
      <button type="button" aria-pressed={tab === 'completed'} onClick={() => setTab('completed')} className={`${button} !min-h-11 !shadow-none ${tab === 'completed' ? '!border-transparent !bg-surface shadow-sm !text-accent' : '!border-transparent !bg-transparent !text-muted'}`}>Completed ({completed.length})</button>
    </div>

    {list.length === 0
      ? <p className="rounded-3xl border border-dashed border-border bg-surface/60 p-8 text-center text-sm leading-relaxed text-muted" data-testid="empty">
        {tab === 'active' ? <>No active sessions yet. A session is a fixed set of sentences you study, say from memory, and quiz yourself on. Create one to begin.</> : 'Completed sessions appear here once both Speaking and the Quiz are finished.'}
      </p>
      : list.map(session => <SessionCard key={session.id} session={session} refused={snapshot.refused[session.id]} highlight={last ? last.id === session.id : false}
        onRename={() => { setRenaming(session); setRenameValue(session.name); }} onDelete={() => setDeleting(session)} onRetry={() => store.retryRefused(session.id)} onAgain={() => again(session.id)} againDisabled={full} />)}

    <Link href={withLang('/stats', lang)} className="card tap tap-hover flex items-center gap-4 p-4" data-testid="progress-link">
      <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success"><Icon name="progress" className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{levelCounts.mastered} of {cardsFor(lang).length} cards mastered</span><span className="block text-sm text-muted">See your levels, streak and stats in Progress.</span></span>
      <Icon name="chevron" className="h-4 w-4 text-muted" />
    </Link>

    {lang === 'nl' && <Section title="Grammar patterns" label="Grammar patterns">
      <p className="-mt-1 text-sm text-muted">Pick a pattern for a set of sentences with explanations, then say them and build them, with levels like any other session.</p>
      <PatternTiles reviews={reviews} />
      <Link href="/learn?topic=mixed" className="card tap tap-hover flex items-center gap-4 p-4"><span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name="mic" className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">Think in Dutch</span><span className="block text-sm text-muted">Mixed situations: speak first, use English help when needed.</span></span><Icon name="chevron" className="h-4 w-4 text-muted" /></Link>
    </Section>}

    {creating && <CreateSessionDialog lang={lang} reviews={reviews} activeCount={allActive.length} initial={initial} onCreate={handleCreate} onClose={() => { setCreating(false); if (requested) navigateTo(withLang(DASHBOARD_URL, lang), true); }} />}
    {deleting && <Modal title="Delete this session?" onClose={() => setDeleting(null)}>
      <p className="mt-3 text-sm"><strong>{deleting.name}</strong> and its session progress (Speaking and Quiz counters, points, Study position) will be removed.</p>
      <p className="mt-2 text-sm text-muted">Your card levels (Difficult, Medium, Easy, Mastered) stay as they are, and your other sessions are not affected.</p>
      <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" data-autofocus className={button} onClick={() => setDeleting(null)}>Keep session</button><button type="button" className={`${button} border-accent text-accent`} onClick={() => { store.remove(deleting.id); setDeleting(null); }}>Delete session</button></div>
    </Modal>}
    {renaming && <Modal title="Rename session" onClose={() => setRenaming(null)}>
      <form className="mt-4 flex flex-col gap-4" onSubmit={event => { event.preventDefault(); if (renameValue.trim()) { store.rename(renaming.id, renameValue); setRenaming(null); } }}>
        <label className="text-sm font-semibold">Session name<input data-autofocus value={renameValue} maxLength={80} onChange={event => setRenameValue(event.target.value)} className="mt-2 w-full field" /></label>
        <div className="grid grid-cols-2 gap-2"><button type="button" className={button} onClick={() => setRenaming(null)}>Cancel</button><button type="submit" className={primary} disabled={!renameValue.trim()}>Save</button></div>
      </form>
    </Modal>}
  </div>;
}

export { DASHBOARD_URL, withLang };
