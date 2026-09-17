import type { ProgressRecord } from "@/lib/mastery/types";
import type { LocalProgressState } from "./localProgress";

/**
 * Merges one concept's progress from two sources (guest device + account).
 * Rules per spec section 9: combine counts, keep the higher mastery, keep
 * the newest last-seen, preserve weak/scheduled status from either side,
 * never silently discard guest progress.
 */
export function mergeProgressRecords(a: ProgressRecord, b: ProgressRecord): ProgressRecord {
  const aIsNewer = (a.lastSeenAt ?? "") >= (b.lastSeenAt ?? "");
  const newer = aIsNewer ? a : b;

  const scheduledReturnAtQuestion =
    a.scheduledReturnAtQuestion !== null && b.scheduledReturnAtQuestion !== null
      ? Math.min(a.scheduledReturnAtQuestion, b.scheduledReturnAtQuestion)
      : (a.scheduledReturnAtQuestion ?? b.scheduledReturnAtQuestion);

  return {
    conceptKey: a.conceptKey,
    mode: a.mode,
    wordId: a.wordId,
    seen: a.seen + b.seen,
    correct: a.correct + b.correct,
    wrong: a.wrong + b.wrong,
    currentCorrectStreak: newer.currentCorrectStreak,
    bestCorrectStreak: Math.max(a.bestCorrectStreak, b.bestCorrectStreak),
    masteryLevel: Math.max(a.masteryLevel, b.masteryLevel) as ProgressRecord["masteryLevel"],
    lastSeenAt: newer.lastSeenAt,
    lastResult: newer.lastResult,
    priorityBoost: Math.max(a.priorityBoost, b.priorityBoost),
    scheduledReturnAtQuestion,
  };
}

export function mergeProgressMaps(
  guest: Record<string, ProgressRecord>,
  account: Record<string, ProgressRecord>,
): Record<string, ProgressRecord> {
  const keys = new Set([...Object.keys(guest), ...Object.keys(account)]);
  const merged: Record<string, ProgressRecord> = {};

  for (const key of keys) {
    const g = guest[key];
    const a = account[key];
    if (g && a) merged[key] = mergeProgressRecords(g, a);
    else merged[key] = g ?? a;
  }

  return merged;
}

export type MergedAccountTotals = {
  progressByKey: Record<string, ProgressRecord>;
  lifetimeScore: number;
  totalCorrect: number;
  totalWrong: number;
};

export function mergeGuestIntoAccount(
  guest: LocalProgressState,
  account: { progressByKey: Record<string, ProgressRecord>; lifetimeScore: number; totalCorrect: number; totalWrong: number },
): MergedAccountTotals {
  return {
    progressByKey: mergeProgressMaps(guest.progressByKey, account.progressByKey),
    lifetimeScore: guest.lifetimeScore + account.lifetimeScore,
    totalCorrect: guest.totalCorrect + account.totalCorrect,
    totalWrong: guest.totalWrong + account.totalWrong,
  };
}
