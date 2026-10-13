import type { Mode } from './types';

/** Sessions open inside /flashcards (?session=ID&mode=...) so one cached page serves every session, online or offline. */
export const sessionUrl = (id: string, mode?: Mode) => `/flashcards?session=${encodeURIComponent(id)}${mode ? `&mode=${mode}` : ''}`;
export const DASHBOARD_URL = '/flashcards';

/** Changes the URL without reloading; Next keeps useSearchParams in sync with it. */
export function navigateTo(url: string, replace = false) {
  if (replace) window.history.replaceState(null, '', url); else window.history.pushState(null, '', url);
}
export function parseMode(value: string | null): Mode | null {
  return value === 'study' || value === 'speaking' || value === 'quiz' ? value : null;
}
