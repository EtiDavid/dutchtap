/** Unique identifiers for sessions, actions and attempts. Works in browsers and in Node. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
export const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
