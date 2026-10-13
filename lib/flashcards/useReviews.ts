'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { mergeReviews, rateLevel, type Reviews, type Review } from './engine';
import { masteredTotal, milestoneCrossed } from './milestones';
import { reviewsSchema } from './validation';
import type { LevelEffect } from '@/lib/sessions/types';

// v2 keys: the earlier rating-based flashcard data used a different shape and is ignored.
const GUEST_KEY = 'dutchtap:flashcards:v2:guest';
export const readLocal = (key: string): Reviews => {
  try { const parsed = reviewsSchema.safeParse(JSON.parse(localStorage.getItem(key) || '{}')); return parsed.success ? parsed.data : {}; } catch { return {}; }
};

/** Loads and saves the learner's global card levels: on this device, plus the account when signed in. */
export function useReviews() {
  const { account, loading } = useAccount();
  const [reviews, setReviews] = useState<Reviews>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading progress…');
  const [guestAvailable, setGuestAvailable] = useState(false);
  const storageKey = account ? `dutchtap:flashcards:v2:user:${account.username.toLowerCase()}` : GUEST_KEY;
  const latest = useRef<Reviews>({});
  const key = useRef(storageKey);
  useEffect(() => { key.current = storageKey; }, [storageKey]);

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
      latest.current = next;
      setReviews(next); setStatus(message); setReady(true);
      setGuestAvailable(!!account && Object.keys(readLocal(GUEST_KEY)).length > 0);
    }
    void load(); return () => { cancelled = true; };
  }, [loading, account, storageKey]);

  const store = useCallback((next: Reviews) => {
    latest.current = next; setReviews(next);
    try { localStorage.setItem(key.current, JSON.stringify(next)); return true; } catch { return false; }
  }, []);

  /** Saves levels on this device and, for accounts, sends only the changed cards. */
  const persist = useCallback(async (next: Reviews, changed?: string[]) => {
    const stored = store(next);
    setStatus(stored ? 'Saved on this device' : 'Device storage unavailable · keep this page open');
    if (account) {
      try {
        const records = (changed ?? Object.keys(next)).map(id => next[id]).filter(Boolean);
        if (records.length) {
          const response = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) });
          if (!response.ok) throw new Error();
        }
        setStatus(stored ? 'Saved & synced' : 'Synced to account');
      } catch { setStatus(stored ? 'Saved locally · sync failed; use Retry sync' : 'Saving failed · keep this page open and retry'); }
    }
  }, [account, store]);

  /**
   * Applies Speaking ratings to the global levels on this device. The account copy is updated by the session
   * action itself, so nothing extra is uploaded. Returns the Mastered milestone reached, if any.
   */
  const applyEffects = useCallback((effects: LevelEffect[]): { crossed: number | null } => {
    const before = latest.current;
    let next = before;
    for (const effect of effects) next = { ...next, [effect.cardId]: rateLevel(effect.cardId, next[effect.cardId], effect.level, new Date(effect.at)) };
    store(next);
    return { crossed: milestoneCrossed(masteredTotal(before), masteredTotal(next)) };
  }, [store]);

  /** Merges account records returned by the server (newer wins). */
  const mergeServer = useCallback((records: Record<string, Review>) => { store(mergeReviews(latest.current, records)); }, [store]);

  const copyGuest = useCallback(() => {
    const merged = mergeReviews(latest.current, readLocal(GUEST_KEY));
    void persist(merged, Object.keys(readLocal(GUEST_KEY))); setGuestAvailable(false);
  }, [persist]);
  return { account, reviews, ready, status, persist, applyEffects, mergeServer, guestAvailable, copyGuest, scopeKey: storageKey };
}
