'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { mergeReviews, type Reviews } from './engine';
import { reviewsSchema } from './validation';

// v2 keys: the earlier rating-based flashcard data used a different shape and is ignored.
const GUEST_KEY = 'dutchtap:flashcards:v2:guest';
export const readLocal = (key: string): Reviews => {
  try { const parsed = reviewsSchema.safeParse(JSON.parse(localStorage.getItem(key) || '{}')); return parsed.success ? parsed.data : {}; } catch { return {}; }
};

/** Loads and saves per-card progress: on this device, plus the account when signed in. */
export function useReviews() {
  const { account, loading } = useAccount();
  const [reviews, setReviews] = useState<Reviews>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading progress…');
  const [guestAvailable, setGuestAvailable] = useState(false);
  const storageKey = account ? `dutchtap:flashcards:v2:user:${account.username}` : GUEST_KEY;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    async function load() {
      setReady(false);
      const local = readLocal(storageKey);
      let next = local;
      let message = account ? 'Saved on this device · sync unavailable' : 'Saved on this device';
      if (account) {
        try {
          const response = await fetch('/api/flashcards');
          if (!response.ok) throw new Error();
          const parsed = reviewsSchema.safeParse((await response.json()).reviews);
          if (!parsed.success) throw new Error();
          next = mergeReviews(local, parsed.data); message = 'Account progress loaded';
        } catch { /* local practice stays available */ }
      }
      if (cancelled) return;
      setReviews(next); setStatus(message); setReady(true);
      setGuestAvailable(!!account && Object.keys(readLocal(GUEST_KEY)).length > 0);
    }
    void load(); return () => { cancelled = true; };
  }, [loading, account, storageKey]);

  const persist = useCallback(async (next: Reviews) => {
    setReviews(next);
    let stored = true;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { stored = false; }
    setStatus(stored ? 'Saved on this device' : 'Device storage unavailable · keep this page open');
    if (account) {
      try {
        const response = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: Object.values(next) }) });
        if (!response.ok) throw new Error();
        setStatus(stored ? 'Saved & synced' : 'Synced to account');
      } catch { setStatus(stored ? 'Saved locally · sync failed; use Retry sync' : 'Saving failed · keep this page open and retry'); }
    }
  }, [account, storageKey]);

  const copyGuest = useCallback(() => { void persist(mergeReviews(reviews, readLocal(GUEST_KEY))); setGuestAvailable(false); }, [persist, reviews]);
  return { account, reviews, ready, status, persist, guestAvailable, copyGuest };
}
