'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReviews } from '@/lib/flashcards/useReviews';
import { milestoneMessage } from '@/lib/flashcards/milestones';
import { useSessions } from '@/lib/sessions/useSessions';
import { usePracticeStreak } from '@/lib/practice/usePracticeStreak';
import { DEFAULT_LANG } from '@/lib/lang';
import { useLearningLanguage } from '@/lib/lang/useLanguage';
import { AppNav } from '../nav/AppNav';
import { LanguageChooser } from '../lang/LanguageChooser';
import { SessionsDashboard } from './SessionsDashboard';
import { SessionView } from './SessionView';
import { PageHeader } from '../ui/PageHeader';

/** Flashcards: the session dashboard, or one session when the URL says ?session=ID. A session always opens in its own language. */
export function FlashcardsApp() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { store, snapshot, account } = useSessions();
  const language = useLearningLanguage();
  // The language in use: a session's own language when one is open (it never changes), otherwise the learner's chosen language.
  const sessionLang = sessionId ? snapshot.sessions.find(s => s.id === sessionId)?.lang : undefined;
  // A missing session shows its "not found" page, which needs no particular language.
  const lang = sessionLang ?? language.lang ?? (sessionId && snapshot.ready ? DEFAULT_LANG : null);
  const reviewsApi = useReviews(lang ?? DEFAULT_LANG);
  const { streak, practisedToday, record } = usePracticeStreak(lang ?? DEFAULT_LANG);
  const [celebration, setCelebration] = useState('');
  const { applyEffects, mergeServer } = reviewsApi;

  // Speaking ratings update the global levels on this device; the account copy is updated by the session action itself.
  useEffect(() => {
    if (!store) return;
    store.onLevelEffects(effects => { const { crossed } = applyEffects(effects); if (crossed) setCelebration(milestoneMessage(crossed)); });
    store.onServerReviews(mergeServer);
    return () => { store.onLevelEffects(null); store.onServerReviews(null); };
  }, [store, applyEffects, mergeServer]);

  if (!language.ready) return <main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted" role="status">Loading your sessions…</p></main>;
  // First launch with nothing to open: choose a language (a session link shows its own language instead).
  if (!lang && !sessionId) return <LanguageChooser onChoose={language.choose} />;

  const ready = !!store && snapshot.ready && reviewsApi.ready && !!lang;
  return <main className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6">
    {!sessionId && <PageHeader eyebrow="Sessions" title="Practise" subtitle="Each session is a fixed set of sentences: study them, say them from memory, then quiz yourself on the same set." />}
    {!ready || !store || !lang ? <p className="text-muted" role="status">Loading your sessions…</p>
      : sessionId
        ? <SessionView sessionId={sessionId} lang={lang} store={store} snapshot={snapshot} reviews={reviewsApi.reviews} reviewsReady={reviewsApi.ready} signedIn={!!account} onPractised={record} celebration={celebration} onDismissCelebration={() => setCelebration('')} />
        : <SessionsDashboard key={searchParams.get('new') ?? ''} lang={lang} store={store} snapshot={snapshot} reviews={reviewsApi.reviews} signedIn={!!account} streak={{ streak, practisedToday }}
          onSwitchLanguage={language.choose} />}
    <AppNav lang={lang ?? undefined} />
  </main>;
}
