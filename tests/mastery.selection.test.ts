import { describe, expect, it } from "vitest";
import { selectNextConcept } from "@/lib/mastery/selection";
import { createInitialProgress, type Candidate, type ProgressRecord } from "@/lib/mastery/types";

function makeCandidates(n: number): Candidate[] {
  return Array.from({ length: n }, (_, i) => ({
    conceptKey: `article:word${i}`,
    mode: "article" as const,
    wordId: `word${i}`,
  }));
}

describe("selectNextConcept", () => {
  it("prefers a due concept over the field (weighted heavily toward due pool)", () => {
    const candidates = makeCandidates(20);
    const progressByKey: Record<string, ProgressRecord> = {
      [candidates[0].conceptKey]: {
        ...createInitialProgress(candidates[0]),
        scheduledReturnAtQuestion: 5,
      },
    };

    let dueSelectedCount = 0;
    const trials = 200;
    for (let i = 0; i < trials; i++) {
      const random = mulberry32(i + 1);
      const picked = selectNextConcept({
        candidates,
        progressByKey,
        currentQuestionIndex: 5,
        recentConceptKeys: [],
        random,
      });
      if (picked.conceptKey === candidates[0].conceptKey) dueSelectedCount++;
    }

    // Due pool is weighted 50% vs 19 other single-candidate learning-pool items
    // sharing the remaining ~50% learning weight, so the due item should win
    // far more often than any individual non-due item.
    expect(dueSelectedCount).toBeGreaterThan(trials * 0.2);
  });

  it("does not select a concept asked in the last 2 questions, when the pool is large enough", () => {
    const candidates = makeCandidates(10);
    const recentConceptKeys = [candidates[0].conceptKey, candidates[1].conceptKey];

    for (let i = 0; i < 50; i++) {
      const picked = selectNextConcept({
        candidates,
        progressByKey: {},
        currentQuestionIndex: 10,
        recentConceptKeys,
        random: mulberry32(i + 1),
      });
      expect(recentConceptKeys).not.toContain(picked.conceptKey);
    }
  });

  it("falls back to allowing a recent repeat when the candidate pool is very small", () => {
    const candidates = makeCandidates(2);
    const recentConceptKeys = [candidates[0].conceptKey, candidates[1].conceptKey];

    // With only 2 candidates total and both "recent", cooldown must not empty the pool.
    const picked = selectNextConcept({
      candidates,
      progressByKey: {},
      currentQuestionIndex: 10,
      recentConceptKeys,
      random: mulberry32(1),
    });
    expect(candidates.map((c) => c.conceptKey)).toContain(picked.conceptKey);
  });

  it("mastered concepts remain selectable (never disappear forever)", () => {
    const candidates = makeCandidates(5);
    const progressByKey: Record<string, ProgressRecord> = Object.fromEntries(
      candidates.map((c) => [c.conceptKey, { ...createInitialProgress(c), masteryLevel: 5 as const, seen: 10, correct: 10 }]),
    );

    const picks = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const picked = selectNextConcept({
        candidates,
        progressByKey,
        currentQuestionIndex: 100,
        recentConceptKeys: [],
        random: mulberry32(i + 1),
      });
      picks.add(picked.conceptKey);
    }

    expect(picks.size).toBeGreaterThan(1);
  });

  it("weak (low-mastery, recently-wrong) concepts are picked more often than mastered ones over many trials", () => {
    const weak: Candidate = { conceptKey: "article:weak", mode: "article", wordId: "weak" };
    const mastered: Candidate = { conceptKey: "article:mastered", mode: "article", wordId: "mastered" };
    const candidates = [weak, mastered];
    const progressByKey: Record<string, ProgressRecord> = {
      [weak.conceptKey]: { ...createInitialProgress(weak), masteryLevel: 0, seen: 4, correct: 1, wrong: 3, lastResult: "wrong" },
      [mastered.conceptKey]: { ...createInitialProgress(mastered), masteryLevel: 5, seen: 10, correct: 10 },
    };

    let weakCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const picked = selectNextConcept({
        candidates,
        progressByKey,
        currentQuestionIndex: 100,
        recentConceptKeys: [],
        random: mulberry32(i + 1),
      });
      if (picked.conceptKey === weak.conceptKey) weakCount++;
    }

    expect(weakCount).toBeGreaterThan(trials / 2);
  });
});

// Deterministic PRNG so weighted-selection tests are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
