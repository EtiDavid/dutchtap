'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { addPracticeDay, currentStreak, localDay, parseDays } from './streak';
import { DEFAULT_LANG, type Lang } from '@/lib/lang';

// Streaks belong to the person practising: each account (and the guest) has its own days on this device.
// Dutch keeps its original keys; each other language counts its own practice days.
const keyFor = (scope: string, lang: Lang) => (lang === DEFAULT_LANG ? `dutchtap:practice-days:v2:${scope}` : `dutchtap:practice-days:v2:${lang}:${scope}`);
const LEGACY_KEY = 'dutchtap:practice-days:v1';
const read = (key: string): string[] => { try { return parseDays(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return []; } };

/** Practice days are kept on this device only (not synced to accounts). */
export function usePracticeStreak(lang: Lang = DEFAULT_LANG) {
  const { account, loading } = useAccount();
  const scope = account ? `user:${account.username.toLowerCase()}` : 'guest';
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    if (loading) return;
    // localStorage does not exist during SSR; reading it in an effect keeps server and first client render identical.
    // The old single shared list becomes the guest's streak; it is never copied into an account.
    const own = read(keyFor(scope, lang));
    const legacy = scope === 'guest' && lang === DEFAULT_LANG ? read(LEGACY_KEY) : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays([...new Set([...own, ...legacy])].sort());
  }, [loading, scope, lang]);
  const record = useCallback(() => {
    if (loading) return;
    const next = addPracticeDay(read(keyFor(scope, lang)), localDay());
    try { localStorage.setItem(keyFor(scope, lang), JSON.stringify(next)); } catch { /* streak just won't persist */ }
    setDays(prev => [...new Set([...prev, ...next])].sort());
  }, [loading, scope, lang]);
  const today = localDay();
  return { streak: currentStreak(days, today), practisedToday: days.includes(today), record };
}
