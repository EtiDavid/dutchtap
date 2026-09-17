import type { MasteryLevel, ProgressRecord } from "./types";

export const MASTERY_MAX = 5;
export const MASTERY_MIN = 0;
/** N correct answers in an unbroken (spaced) streak promotes mastery by one level. */
export const MASTERY_STREAK_INTERVAL = 3;
export const WRONG_SCHEDULE_MIN_GAP = 2;
export const WRONG_SCHEDULE_MAX_GAP = 5;
export const WRONG_PRIORITY_BOOST = 3;
export const CORRECT_PRIORITY_DECAY = 1;

function clampMastery(level: number): MasteryLevel {
  return Math.max(MASTERY_MIN, Math.min(MASTERY_MAX, level)) as MasteryLevel;
}

/**
 * Applies a correct answer. Spaced correct streaks (never two answers to the
 * exact same question instance in a row — enforced upstream by the
 * selection cooldown) promote mastery every MASTERY_STREAK_INTERVAL correct
 * answers in a row.
 */
export function applyCorrectAnswer(
  record: ProgressRecord,
  questionIndex: number,
  now: string = new Date().toISOString(),
): ProgressRecord {
  const currentCorrectStreak = record.currentCorrectStreak + 1;
  const promote = currentCorrectStreak % MASTERY_STREAK_INTERVAL === 0;

  return {
    ...record,
    seen: record.seen + 1,
    correct: record.correct + 1,
    currentCorrectStreak,
    bestCorrectStreak: Math.max(record.bestCorrectStreak, currentCorrectStreak),
    masteryLevel: promote ? clampMastery(record.masteryLevel + 1) : record.masteryLevel,
    lastSeenAt: now,
    lastResult: "correct",
    priorityBoost: Math.max(0, record.priorityBoost - CORRECT_PRIORITY_DECAY),
    // A due return that gets answered correctly is resolved.
    scheduledReturnAtQuestion:
      record.scheduledReturnAtQuestion !== null && record.scheduledReturnAtQuestion <= questionIndex
        ? null
        : record.scheduledReturnAtQuestion,
  };
}

export function applyWrongAnswer(
  record: ProgressRecord,
  questionIndex: number,
  now: string = new Date().toISOString(),
  random: () => number = Math.random,
): ProgressRecord {
  const gap =
    WRONG_SCHEDULE_MIN_GAP + Math.floor(random() * (WRONG_SCHEDULE_MAX_GAP - WRONG_SCHEDULE_MIN_GAP + 1));

  return {
    ...record,
    seen: record.seen + 1,
    wrong: record.wrong + 1,
    currentCorrectStreak: 0,
    masteryLevel: clampMastery(record.masteryLevel - 1),
    lastSeenAt: now,
    lastResult: "wrong",
    priorityBoost: record.priorityBoost + WRONG_PRIORITY_BOOST,
    scheduledReturnAtQuestion: questionIndex + gap,
  };
}

export function applyAnswer(
  record: ProgressRecord,
  correct: boolean,
  questionIndex: number,
  now?: string,
  random?: () => number,
): ProgressRecord {
  return correct
    ? applyCorrectAnswer(record, questionIndex, now)
    : applyWrongAnswer(record, questionIndex, now, random);
}
