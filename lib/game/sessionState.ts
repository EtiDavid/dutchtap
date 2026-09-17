import type { GrammarQuestion } from "@/lib/grammar/types";

// Duplicated (not imported) from useGameSession.ts to avoid a circular
// type-only import between the two modules.
type AnswerFeedback = "idle" | "correct" | "wrong";

/**
 * The in-progress game session (score, streak, current question, etc.) is
 * ephemeral React state by design — it's distinct from the durable
 * progress/mastery data in localStorage or the account API. But losing it
 * on every page refresh reads as data loss to a learner even though
 * nothing was actually lost, so it's mirrored to sessionStorage (tab-
 * scoped, survives refresh, clears when the tab closes) purely so a
 * refresh resumes the same session instead of silently starting a new one.
 */
export type PersistedSessionState = {
  sessionStats: { answered: number; correct: number; wrong: number };
  streak: number;
  questionIndex: number;
  recentConceptKeys: string[];
  improvedConcepts: string[];
  startedAt: string;
  current: { conceptKey: string; question: GrammarQuestion } | null;
  feedback: AnswerFeedback;
  selectedAnswer: string | null;
};

function storageKey(mode: string): string {
  return `dutchtap:session:${mode}`;
}

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.sessionStorage;
  } catch {
    return false;
  }
}

export function loadSessionState(mode: string): PersistedSessionState | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(mode));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSessionState;
  } catch {
    return null;
  }
}

export function saveSessionState(mode: string, state: PersistedSessionState): void {
  if (!isStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(storageKey(mode), JSON.stringify(state));
  } catch {
    // Storage full/disabled — the in-memory session still works for this
    // page load; it just won't survive a refresh.
  }
}

export function clearSessionState(mode: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.sessionStorage.removeItem(storageKey(mode));
  } catch {
    // ignore
  }
}
