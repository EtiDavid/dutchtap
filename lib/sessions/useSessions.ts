'use client';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAccount } from '@/lib/auth/useAccount';
import { type SessionStore, type Snapshot } from './store';
import { getStore } from './registry';

const EMPTY: Snapshot = { ready: false, sessions: [], status: 'local', pending: 0, error: null, notices: [], refused: {}, lastOpened: null, storageOk: true, online: true };
const noop = () => () => undefined;
const startedStores = new WeakSet<SessionStore>();

/** The learner's sessions: the guest's on this device, or the signed-in account's with sync. */
export function useSessions() {
  const { account, loading } = useAccount();
  const username = account?.username;
  const store = useMemo(() => (loading ? null : getStore(username ? { kind: 'user', username } : { kind: 'guest' })), [loading, username]);
  const snapshot = useSyncExternalStore(store ? store.subscribe : noop, store ? store.getSnapshot : () => EMPTY, () => EMPTY);

  useEffect(() => {
    if (!store) return;
    if (!startedStores.has(store)) { startedStores.add(store); void store.start(); } else void store.sync();
    const online = () => store.setOnline(true);
    const offline = () => store.setOnline(false);
    const visible = () => { if (document.visibilityState === 'visible') void store.sync(); else if (store.getSnapshot().pending) void store.sync(); };
    window.addEventListener('online', online); window.addEventListener('offline', offline); document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', visible); };
  }, [store]);

  return { store, snapshot, account, accountLoading: loading };
}

/** The guest's on-device sessions, so a signed-in learner can choose to import them. Read-only until they do. */
export function useGuestStore(enabled: boolean) {
  const store = useMemo(() => (enabled ? getStore({ kind: 'guest' }) : null), [enabled]);
  const snapshot = useSyncExternalStore(store ? store.subscribe : noop, store ? store.getSnapshot : () => EMPTY, () => EMPTY);
  useEffect(() => {
    if (store && !startedStores.has(store)) { startedStores.add(store); void store.start(); }
  }, [store]);
  return { guestStore: store, guestSnapshot: snapshot };
}
