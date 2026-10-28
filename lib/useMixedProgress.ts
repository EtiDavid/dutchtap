'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { MIXED_STORAGE_KEY, changedMixed, cleanMixed, mergeMixed, type MixedProgress } from '@/lib/grammarMixed';

/** Guests keep the original key, so answers saved before account sync are still there. */
const guestKey = MIXED_STORAGE_KEY;
const userKey = (username: string) => `${MIXED_STORAGE_KEY}:user:${username.toLowerCase()}`;
const readLocal = (key: string): MixedProgress => { try { return cleanMixed(JSON.parse(localStorage.getItem(key) || '{}')); } catch { return {}; } };
const writeLocal = (key: string, progress: MixedProgress) => { try { localStorage.setItem(key, JSON.stringify(progress)); return true; } catch { return false; } };

/** Mixed-grammar answers: always on this device, and in the account when signed in (newer answer wins per challenge). Never touches card levels. */
export function useMixedProgress() {
  const { account, loading } = useAccount();
  const storageKey = account ? userKey(account.username) : guestKey;
  const [progress, setProgress] = useState<MixedProgress>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [status, setStatus] = useState('Saved on this device');
  const [guestAvailable, setGuestAvailable] = useState(false);
  const latest = useRef<MixedProgress>({});

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      let next = readLocal(storageKey);
      let message = account ? 'Saved on this device · sync unavailable' : 'Saved on this device';
      if (account) {
        try {
          const response = await fetch('/api/grammar-mixed');
          if (!response.ok) throw new Error();
          const server = cleanMixed((await response.json()).progress);
          const merged = mergeMixed(next, server);
          // Answers only on this device go up now, so a second device sees them.
          const missing = changedMixed(server, merged);
          next = merged; message = 'Account progress loaded';
          if (missing.length) await fetch('/api/grammar-mixed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: missing.map(id => ({ id, stat: merged[id] })) }) }).catch(() => undefined);
        } catch { /* practice stays available on this device */ }
        writeLocal(storageKey, next);
      }
      if (cancelled) return;
      latest.current = next; setProgress(next); setStatus(message); setLoadedKey(storageKey);
      setGuestAvailable(!!account && Object.keys(readLocal(guestKey)).length > 0);
    })();
    return () => { cancelled = true; };
  }, [loading, account, storageKey]);

  const save = useCallback(async (next: MixedProgress) => {
    const before = latest.current;
    latest.current = next; setProgress(next);
    const stored = writeLocal(storageKey, next);
    setStatus(stored ? 'Saved on this device' : 'Device storage unavailable · keep this page open');
    if (!account) return;
    try {
      const records = changedMixed(before, next).map(id => ({ id, stat: next[id] }));
      if (records.length) {
        const response = await fetch('/api/grammar-mixed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) });
        if (!response.ok) throw new Error();
      }
      setStatus('Saved & synced');
    } catch { setStatus('Saved locally · sync failed; it is sent again next time you open this page'); }
  }, [account, storageKey]);

  /** Adds this device's guest answers to the signed-in account (guest data is kept, never deleted). */
  const copyGuest = useCallback(() => {
    const merged = mergeMixed(latest.current, readLocal(guestKey));
    void save(merged); setGuestAvailable(false);
  }, [save]);

  const ready = loadedKey === storageKey;
  return { progress, ready, status, save, account, guestAvailable, copyGuest };
}
