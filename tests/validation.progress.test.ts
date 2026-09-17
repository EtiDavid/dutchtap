import { describe, expect, it } from "vitest";
import { progressRecordSchema, progressSyncSchema } from "@/lib/validation/progress";
import { createInitialProgress } from "@/lib/mastery/types";

const validRecord = { ...createInitialProgress({ conceptKey: "article:kantoor", mode: "article", wordId: "kantoor" }), seen: 3, correct: 2, wrong: 1, currentCorrectStreak: 1, bestCorrectStreak: 1 };

describe("progressRecordSchema", () => {
  it("accepts a well-formed record", () => {
    expect(progressRecordSchema.safeParse(validRecord).success).toBe(true);
  });

  it("rejects an out-of-range masteryLevel", () => {
    expect(progressRecordSchema.safeParse({ ...validRecord, masteryLevel: 6 }).success).toBe(false);
    expect(progressRecordSchema.safeParse({ ...validRecord, masteryLevel: -1 }).success).toBe(false);
  });

  it("rejects seen that doesn't equal correct + wrong (client tampering)", () => {
    expect(progressRecordSchema.safeParse({ ...validRecord, seen: 100 }).success).toBe(false);
  });

  it("rejects a currentCorrectStreak greater than bestCorrectStreak", () => {
    expect(progressRecordSchema.safeParse({ ...validRecord, currentCorrectStreak: 5, bestCorrectStreak: 1 }).success).toBe(false);
  });

  it("rejects an invalid mode", () => {
    expect(progressRecordSchema.safeParse({ ...validRecord, mode: "not-a-mode" }).success).toBe(false);
  });
});

describe("progressSyncSchema", () => {
  it("caps the batch size", () => {
    const records = Array.from({ length: 501 }, (_, i) => ({
      ...validRecord,
      conceptKey: `article:word${i}`,
      wordId: `word${i}`,
    }));
    const result = progressSyncSchema.safeParse({ records, lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 });
    expect(result.success).toBe(false);
  });
});
