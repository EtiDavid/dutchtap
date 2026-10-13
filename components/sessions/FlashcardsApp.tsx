'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReviews } from '@/lib/flashcards/useReviews';
import { milestoneMessage } from '@/lib/flashcards/milestones';
import { useSessions } from '@/lib/sessions/useSessions';
import { usePracticeStreak } from '@/lib/practice/usePracticeStreak';
import { AppNav } from '../nav/AppNav';
import { SessionsDashboard } from './SessionsDashboard';
import { SessionView } from './SessionView';

/** Flashcards: the session dashboard, or one session when the URL says ?session=ID. */
export function FlashcardsApp() {
  const sessionId = useSearchParams().get('session');
  const { store, snapshot, account } = useSessions();
  const reviewsApi = useReviews();
  const { streak, practisedToday, record } = usePracticeStreak();
  const [celebration, setCelebration] = useState('');
  const { applyEffects, mergeServer } = reviewsApi;

  // Speaking ratings update the global levels on this device; the account copy is updated by the session action itself.
  useEffect(() => {
    if (!store) return;
    store.onLevelEffects(effects => { const { crossed } = applyEffects(effects); if (crossed) setCelebration(milestoneMessage(crossed)); });
    store.onServerReviews(mergeServer);
    return () => { store.onLevelEffects(null); store.onServerReviews(null); };
  }, [store, applyEffects, mergeServer]);

  const ready = !!store && snapshot.ready && reviewsApi.ready;
  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-5 pb-28 pt-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Flashcards</h1><p className="mt-1 text-sm text-muted">Study a fixed set of sentences, say them from memory, then quiz yourself on the same set.</p></div>
    {!ready || !store ? <p className="text-muted" role="status">Loading your sessions…</p>
      : sessionId
        ? <SessionView sessionId={sessionId} store={store} snapshot={snapshot} reviews={reviewsApi.reviews} reviewsReady={reviewsApi.ready} signedIn={!!account} onPractised={record} celebration={celebration} onDismissCelebration={() => setCelebration('')} />
        : <SessionsDashboard store={store} snapshot={snapshot} reviews={reviewsApi.reviews} signedIn={!!account} streak={{ streak, practisedToday }} levelsStatus={reviewsApi.status} guestLevelsAvailable={reviewsApi.guestAvailable} onCopyGuestLevels={reviewsApi.copyGuest} />}
    <AppNav />
  </main>;
}
