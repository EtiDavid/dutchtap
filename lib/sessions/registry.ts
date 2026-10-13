import { SessionStore, SUMMARY_KEY, scopeKey, type Scope } from './store';

// One store per signed-in identity (or the guest) per page load, so account A's sessions are never mixed with account B's.
const registry = new Map<string, SessionStore>();

export function getStore(scope: Scope): SessionStore {
  const key = scopeKey(scope);
  let store = registry.get(key);
  if (!store) { store = new SessionStore({ scope }); registry.set(key, store); }
  return store;
}

/**
 * Forgets every signed-in learner's in-memory sessions (used on logout). Their saved copy and unsent actions stay on the device
 * under their own key, ready for their next login; nothing is shown to the next person. The guest's sessions are untouched.
 */
export function disposeUserStores() {
  for (const [key, store] of registry) if (key !== 'guest') { store.dispose(); registry.delete(key); }
  try { localStorage.removeItem(SUMMARY_KEY); } catch { /* nothing to clear */ }
}
