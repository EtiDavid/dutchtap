import { describe, expect, it } from "vitest";
import { mergeGuestIntoAccount, mergeProgressMaps, mergeProgressRecords } from "@/lib/sync/mergeProgress";
import { createEmptyLocalProgress } from "@/lib/sync/localProgress";
import { createInitialProgress, type ProgressRecord } from "@/lib/mastery/types";

const candidate = { conceptKey: "article:kantoor", mode: "article" as const, wordId: "kantoor" };

describe("mergeProgressRecords", () => {
  it("combines seen/correct/wrong counts", () => {
    const a: ProgressRecord = { ...createInitialProgress(candidate), seen: 3, correct: 2, wrong: 1 };
    const b: ProgressRecord = { ...createInitialProgress(candidate), seen: 5, correct: 4, wrong: 1 };
    const merged = mergeProgressRecords(a, b);
    expect(merged.seen).toBe(8);
    expect(merged.correct).toBe(6);
    expect(merged.wrong).toBe(2);
  });

  it("keeps the higher mastery level", () => {
    const a: ProgressRecord = { ...createInitialProgress(candidate), masteryLevel: 1 };
    const b: ProgressRecord = { ...createInitialProgress(candidate), masteryLevel: 4 };
    expect(mergeProgressRecords(a, b).masteryLevel).toBe(4);
    expect(mergeProgressRecords(b, a).masteryLevel).toBe(4);
  });

  it("keeps the newest lastSeenAt/lastResult", () => {
    const a: ProgressRecord = { ...createInitialProgress(candidate), lastSeenAt: "2026-01-01T00:00:00.000Z", lastResult: "wrong" };
    const b: ProgressRecord = { ...createInitialProgress(candidate), lastSeenAt: "2026-06-01T00:00:00.000Z", lastResult: "correct" };
    const merged = mergeProgressRecords(a, b);
    expect(merged.lastSeenAt).toBe(b.lastSeenAt);
    expect(merged.lastResult).toBe("correct");
  });

  it("preserves a scheduled (weak) return from either side", () => {
    const a: ProgressRecord = { ...createInitialProgress(candidate), scheduledReturnAtQuestion: null };
    const b: ProgressRecord = { ...createInitialProgress(candidate), scheduledReturnAtQuestion: 12 };
    expect(mergeProgressRecords(a, b).scheduledReturnAtQuestion).toBe(12);
    expect(mergeProgressRecords(b, a).scheduledReturnAtQuestion).toBe(12);
  });
});

describe("mergeProgressMaps", () => {
  it("does not silently discard guest-only concepts", () => {
    const guestOnly: ProgressRecord = { ...createInitialProgress(candidate), seen: 3 };
    const merged = mergeProgressMaps({ [candidate.conceptKey]: guestOnly }, {});
    expect(merged[candidate.conceptKey]).toEqual(guestOnly);
  });

  it("does not discard account-only concepts", () => {
    const accountOnly: ProgressRecord = { ...createInitialProgress(candidate), seen: 3 };
    const merged = mergeProgressMaps({}, { [candidate.conceptKey]: accountOnly });
    expect(merged[candidate.conceptKey]).toEqual(accountOnly);
  });
});

describe("mergeGuestIntoAccount", () => {
  it("preserves earned score from both sides", () => {
    const guest = { ...createEmptyLocalProgress(), lifetimeScore: 10, totalCorrect: 10, totalWrong: 2 };
    const account = { progressByKey: {}, lifetimeScore: 25, totalCorrect: 25, totalWrong: 5 };
    const merged = mergeGuestIntoAccount(guest, account);
    expect(merged.lifetimeScore).toBe(35);
    expect(merged.totalCorrect).toBe(35);
    expect(merged.totalWrong).toBe(7);
  });
});
