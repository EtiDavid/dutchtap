'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEFAULT_LANG, parseLang, withLang, type Lang } from './index';
import { stopAllSpeech } from '@/lib/speech/playback';

export const LANGUAGE_KEY = 'dutchtap:language:v1';
const CHANGED = 'dutchtap:language-changed';

function stored(): Lang | null { try { return parseLang(localStorage.getItem(LANGUAGE_KEY)); } catch { return null; } }
/** Someone who already practised in Dutch before French existed is a Dutch learner and goes straight in; they are not asked again. */
function hasDutchHistory(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';
      if (/^dutchtap:(sessions:v1:|flashcards:v2:|guest-progress|practice-days:)/.test(key) && !key.includes(':fr:')) return true;
    }
  } catch { /* unreadable storage: treated as a first launch */ }
  return false;
}
/** The learning language this device is using, or null when the learner has never chosen and has no Dutch history. */
export function currentLanguage(): Lang | null { return stored() ?? (hasDutchHistory() ? DEFAULT_LANG : null); }

/** Saves the choice. Everything playing stops so one language is never spoken over the other. */
export function chooseLanguage(lang: Lang) {
  stopAllSpeech();
  try { localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* the choice lasts for this visit only */ }
  window.dispatchEvent(new Event(CHANGED));
}
function subscribe(listener: () => void) {
  window.addEventListener(CHANGED, listener); window.addEventListener('storage', listener);
  return () => { window.removeEventListener(CHANGED, listener); window.removeEventListener('storage', listener); };
}
const noopSubscribe = () => () => undefined;

/** False while rendering on the server and during hydration, so a wrong language is never drawn first. */
export function useClientReady(): boolean { return useSyncExternalStore(noopSubscribe, () => true, () => false); }

export type LanguageState = { lang: Lang | null; ready: boolean; choose: (lang: Lang) => void };

/**
 * The learner's language for a page. An explicit, valid `?lang=` in the URL wins (and is remembered), then the saved choice,
 * then Dutch for existing Dutch learners. Pages that call this need a Suspense boundary (it reads the URL).
 */
export function useLearningLanguage(): LanguageState {
  const ready = useClientReady();
  const explicit = parseLang(useSearchParams().get('lang'));
  const saved = useSyncExternalStore(subscribe, () => currentLanguage() ?? '', () => '') || null;
  const lang = explicit ?? parseLang(saved);
  useEffect(() => { if (explicit && stored() !== explicit) chooseLanguage(explicit); }, [explicit]);
  const choose = useCallback((next: Lang) => {
    chooseLanguage(next);
    // Keep the address bar truthful: the same page, in the chosen language.
    const url = new URL(window.location.href);
    url.searchParams.delete('lang');
    window.history.replaceState(null, '', withLang(`${url.pathname}${url.search}`, next) + url.hash);
  }, []);
  return { lang: ready ? lang : null, ready, choose };
}

/** The saved choice only, for components that live on pages without URL parameters (the tab bar, the home screen). */
export function useSavedLanguage(): { lang: Lang | null; ready: boolean } {
  const ready = useClientReady();
  const saved = useSyncExternalStore(subscribe, () => currentLanguage() ?? '', () => '') || null;
  return { lang: ready ? parseLang(saved) : null, ready };
}
