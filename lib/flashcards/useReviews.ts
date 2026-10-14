'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { mergeReviews, rateLevel, type Reviews, type Review } from './engine';
import { masteredTotal, milestoneCrossed } from './milestones';
import { reviewsSchema } from './validation';
import type { LevelEffect } from '@/lib/sessions/types';
import { DEFAULT_LANG, type Lang } from '@/lib/lang';

// v2 keys: the earlier rating-based flashcard data used a different shape and is ignored.
// Dutch keeps its original keys; every other language has its own, so levels are never shared across languages or people.
const guestKey = (lang: Lang) => (lang === DEFAULT_LANG ? 'dutchtap:flashcards:v2:guest' : `dutchtap:flashcards:v2:${lang}:guest`);
const userKey = (lang: Lang, username: string) => (lang === DEFAULT_LANG ? `dutchtap:flashcards:v2:user:${username.toLowerCase()}` : `dutchtap:flashcards:v2:${lang}:user:${username.toLowerCase()}`);
const api = (lang: Lang) => (lang === DEFAULT_LANG ? '/api/flashcards' : `/api/flashcards?lang=${lang}`);
export const readLocal = (key: string): Reviews => {
  try { const parsed = reviewsSchema.safeParse(JSON.parse(localStorage.getItem(key) || '{}')); return parsed.success ? parsed.data : {}; } catch { return {}; }
};

const EMPTY: Reviews = {};
/** Loads and saves the learner's global card levels for ONE language: on this device, plus the account when signed in. */
export function useReviews(lang: Lang = DEFAULT_LANG) {
  const { account, loading } = useAccount();
  const [reviews, setReviews] = useState<Reviews>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading progress…');
  const [guestAvailable, setGuestAvailable] = useState(false);
  const storageKey = account ? userKey(lang, account.username) : guestKey(lang);
  const latest = useRef<Reviews>({});
  const key = useRef(storageKey);
  useEffect(() => { key.current = storageKey; }, [storageKey]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    async function load() {
      setLoadedKey(null);
      const local = readLocal(storageKey);
      let next = local;
      let message = account ? 'Saved on this device · sync unavailable' : 'Saved on this device';
      if (account) {
        try {
          const response = await fetch(api(lang));
          if (!response.ok) throw new Error();
          const parsed = reviewsSchema.safeParse((await response.json()).reviews);
          if (!parsed.success) throw new Error();
          next = mergeReviews(local, parsed.data); message = 'Account progress loaded';
        } catch { /* local practice stays available */ }
      }
      if (cancelled) return;
      latest.current = next;
      setReviews(next); setStatus(message); setLoadedKey(storageKey);
      setGuestAvailable(!!account && Object.keys(readLocal(guestKey(lang))).length > 0);
    }
    void load(); return () => { cancelled = true; };
  }, [loading, account, storageKey, lang]);

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
          const response = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, records }) });
          if (!response.ok) throw new Error();
        }
        setStatus(stored ? 'Saved & synced' : 'Synced to account');
      } catch { setStatus(stored ? 'Saved locally · sync failed; use Retry sync' : 'Saving failed · keep this page open and retry'); }
    }
  }, [account, store, lang]);

  /**
   * Applies Speaking ratings to the global levels on this device. The account copy is updated by the session
   * action itself, so nothing extra is uploaded. Returns the Mastered milestone reached, if any.
   */
  const applyEffects = useCallback((effects: LevelEffect[]): { crossed: number | null } => {
    const before = latest.current;
    let next = before;
    for (const effect of effects.filter(e => e.lang === lang)) next = { ...next, [effect.cardId]: rateLevel(effect.cardId, next[effect.cardId], effect.level, new Date(effect.at)) };
    store(next);
    return { crossed: milestoneCrossed(masteredTotal(before), masteredTotal(next)) };
  }, [store, lang]);

  /** Merges account records returned by the server (newer wins). Records of another language are not ours to merge. */
  const mergeServer = useCallback((from: Lang, records: Record<string, Review>) => { if (from === lang) store(mergeReviews(latest.current, records)); }, [store, lang]);

  const copyGuest = useCallback(() => {
    const merged = mergeReviews(latest.current, readLocal(guestKey(lang)));
    void persist(merged, Object.keys(readLocal(guestKey(lang)))); setGuestAvailable(false);
  }, [persist, lang]);
  // Levels belong to one language: until this language's levels are loaded, nothing from another language is shown.
  const ready = loadedKey === storageKey;
  return { account, reviews: ready ? reviews : EMPTY, ready, status, persist, applyEffects, mergeServer, guestAvailable, copyGuest, scopeKey: storageKey };
}
