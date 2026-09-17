import { z } from "zod";
import type { ProgressRecord } from "@/lib/mastery/types";

export const progressRecordSchema = z
  .object({
    conceptKey: z.string().min(1),
    mode: z.enum(["article", "demonstrative", "adjective"]),
    wordId: z.string().min(1),
    seen: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    wrong: z.number().int().nonnegative(),
    currentCorrectStreak: z.number().int().nonnegative(),
    bestCorrectStreak: z.number().int().nonnegative(),
    masteryLevel: z.number().int().min(0).max(5),
    lastSeenAt: z.string().nullable(),
    lastResult: z.enum(["correct", "wrong"]).nullable(),
    priorityBoost: z.number().nonnegative(),
    scheduledReturnAtQuestion: z.number().int().nullable(),
  })
  .refine((r) => r.correct + r.wrong === r.seen, {
    message: "correct + wrong must equal seen",
  })
  .refine((r) => r.currentCorrectStreak <= r.bestCorrectStreak, {
    message: "currentCorrectStreak cannot exceed bestCorrectStreak",
  });

/**
 * Zod narrows masteryLevel to `number`, not the literal 0|1|2|3|4|5 union;
 * the schema's .min(0).max(5).int() already guarantees that range at
 * runtime, so this cast at the validation boundary is safe.
 */
export function toProgressRecord(record: z.infer<typeof progressRecordSchema>): ProgressRecord {
  return record as ProgressRecord;
}

export const progressSyncSchema = z.object({
  records: z.array(progressRecordSchema).max(500),
  lifetimeScore: z.number().int().nonnegative(),
  totalCorrect: z.number().int().nonnegative(),
  totalWrong: z.number().int().nonnegative(),
});

export const guestMergeSchema = z.object({
  progressByKey: z.record(z.string(), progressRecordSchema),
  lifetimeScore: z.number().int().nonnegative(),
  totalCorrect: z.number().int().nonnegative(),
  totalWrong: z.number().int().nonnegative(),
});

export const sessionSummarySchema = z.object({
  mode: z.enum(["article", "demonstrative", "adjective", "weak-review"]),
  startedAt: z.string(),
  endedAt: z.string(),
  questions: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  wrong: z.number().int().nonnegative(),
  scoreEarned: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(100),
});
