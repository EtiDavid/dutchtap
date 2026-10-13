'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { addPracticeDay, currentStreak, localDay, parseDays } from './streak';

// Streaks belong to the person practising: each account (and the guest) has its own days on this device.
const keyFor = (scope: string) => `dutchtap:practice-days:v2:${scope}`;
const LEGACY_KEY = 'dutchtap:practice-days:v1';
const read = (key: string): string[] => { try { return parseDays(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return []; } };

/** Practice days are kept on this device only (not synced to accounts). */
export function usePracticeStreak() {
  const { account, loading } = useAccount();
  const scope = account ? `user:${account.username.toLowerCase()}` : 'guest';
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    if (loading) return;
    // localStorage does not exist during SSR; reading it in an effect keeps server and first client render identical.
    // The old single shared list becomes the guest's streak; it is never copied into an account.
    const own = read(keyFor(scope));
    const legacy = scope === 'guest' ? read(LEGACY_KEY) : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays([...new Set([...own, ...legacy])].sort());
  }, [loading, scope]);
  const record = useCallback(() => {
    if (loading) return;
    const next = addPracticeDay(read(keyFor(scope)), localDay());
    try { localStorage.setItem(keyFor(scope), JSON.stringify(next)); } catch { /* streak just won't persist */ }
    setDays(prev => [...new Set([...prev, ...next])].sort());
  }, [loading, scope]);
  const today = localDay();
  return { streak: currentStreak(days, today), practisedToday: days.includes(today), record };
}
