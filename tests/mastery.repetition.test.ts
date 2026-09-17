import { describe, expect, it } from "vitest";
import { createInitialProgress, type ProgressRecord } from "@/lib/mastery/types";
import {
  applyAnswer,
  applyCorrectAnswer,
  applyWrongAnswer,
  MASTERY_MAX,
  WRONG_SCHEDULE_MAX_GAP,
  WRONG_SCHEDULE_MIN_GAP,
} from "@/lib/mastery/repetition";

const candidate = { conceptKey: "article:kantoor", mode: "article" as const, wordId: "kantoor" };

describe("applyWrongAnswer", () => {
  it("schedules the concept to return within the 2-5 question window", () => {
    const record = createInitialProgress(candidate);
    const updated = applyWrongAnswer(record, 10, undefined, () => 0.5);
    expect(updated.scheduledReturnAtQuestion).not.toBeNull();
    const gap = (updated.scheduledReturnAtQuestion ?? 0) - 10;
    expect(gap).toBeGreaterThanOrEqual(WRONG_SCHEDULE_MIN_GAP);
    expect(gap).toBeLessThanOrEqual(WRONG_SCHEDULE_MAX_GAP);
  });

  it("does not schedule a return for the very next question (gap >= 2)", () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
      const record = createInitialProgress(candidate);
      const updated = applyWrongAnswer(record, 0, undefined, () => roll);
      expect(updated.scheduledReturnAtQuestion).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives +0 (does not increment correct)", () => {
    const record = createInitialProgress(candidate);
    const updated = applyWrongAnswer(record, 0);
    expect(updated.correct).toBe(0);
    expect(updated.wrong).toBe(1);
  });

  it("reduces mastery by 1, floored at 0", () => {
    const record = { ...createInitialProgress(candidate), masteryLevel: 0 as const };
    const updated = applyWrongAnswer(record, 0);
    expect(updated.masteryLevel).toBe(0);

    const partiallyMastered = { ...createInitialProgress(candidate), masteryLevel: 2 as const };
    const afterWrong = applyWrongAnswer(partiallyMastered, 0);
    expect(afterWrong.masteryLevel).toBe(1);
  });

  it("resets the correct streak", () => {
    const record = { ...createInitialProgress(candidate), currentCorrectStreak: 4 };
    const updated = applyWrongAnswer(record, 0);
    expect(updated.currentCorrectStreak).toBe(0);
  });
});

describe("applyCorrectAnswer", () => {
  it("gives exactly +1 correct", () => {
    const record = createInitialProgress(candidate);
    const updated = applyCorrectAnswer(record, 0);
    expect(updated.correct).toBe(1);
    expect(updated.wrong).toBe(0);
  });

  it("promotes mastery after a spaced streak of correct answers", () => {
    let record = createInitialProgress(candidate);
    record = applyCorrectAnswer(record, 0);
    record = applyCorrectAnswer(record, 1);
    expect(record.masteryLevel).toBe(0);
    record = applyCorrectAnswer(record, 2);
    expect(record.masteryLevel).toBe(1);
  });

  it("never promotes mastery above the maximum", () => {
    let record: ProgressRecord = { ...createInitialProgress(candidate), masteryLevel: 5, currentCorrectStreak: 2 };
    record = applyCorrectAnswer(record, 0);
    expect(record.masteryLevel).toBe(MASTERY_MAX);
  });

  it("resolves a due return once answered correctly", () => {
    const record = { ...createInitialProgress(candidate), scheduledReturnAtQuestion: 5 };
    const updated = applyCorrectAnswer(record, 6);
    expect(updated.scheduledReturnAtQuestion).toBeNull();
  });
});

describe("applyAnswer", () => {
  it("dispatches to correct/wrong handlers", () => {
    const record = createInitialProgress(candidate);
    expect(applyAnswer(record, true, 0).correct).toBe(1);
    expect(applyAnswer(record, false, 0).wrong).toBe(1);
  });
});
