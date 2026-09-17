import type { GameMode } from "@/lib/grammar/types";

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ProgressRecord = {
  conceptKey: string;
  mode: GameMode;
  wordId: string;
  seen: number;
  correct: number;
  wrong: number;
  currentCorrectStreak: number;
  bestCorrectStreak: number;
  masteryLevel: MasteryLevel;
  lastSeenAt: string | null;
  lastResult: "correct" | "wrong" | null;
  priorityBoost: number;
  scheduledReturnAtQuestion: number | null;
};

/** A concept the game could ask about, whether or not it has been seen yet. */
export type Candidate = {
  conceptKey: string;
  mode: GameMode;
  wordId: string;
  frequencyRank?: number;
};

export function createInitialProgress(candidate: Candidate): ProgressRecord {
  return {
    conceptKey: candidate.conceptKey,
    mode: candidate.mode,
    wordId: candidate.wordId,
    seen: 0,
    correct: 0,
    wrong: 0,
    currentCorrectStreak: 0,
    bestCorrectStreak: 0,
    masteryLevel: 0,
    lastSeenAt: null,
    lastResult: null,
    priorityBoost: 0,
    scheduledReturnAtQuestion: null,
  };
}
