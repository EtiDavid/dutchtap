'use client';
import { useCallback, useEffect, useState } from 'react';
import { addPracticeDay, currentStreak, localDay, parseDays } from './streak';

const KEY = 'dutchtap:practice-days:v1';
const read = (): string[] => { try { return parseDays(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return []; } };

/** Practice days are kept on this device only. */
export function usePracticeStreak() {
  const [days, setDays] = useState<string[]>([]);
  // localStorage does not exist during SSR; reading it in an effect keeps server and first client render identical.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDays(read()); }, []);
  const record = useCallback(() => {
    const next = addPracticeDay(read(), localDay());
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* streak just won't persist */ }
    setDays(next);
  }, []);
  const today = localDay();
  return { streak: currentStreak(days, today), practisedToday: days.includes(today), record };
}
