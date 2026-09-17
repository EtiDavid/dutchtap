import { describe, expect, it } from "vitest";
import { NOUNS } from "@/data/nouns";
import { ADJECTIVES } from "@/data/adjectives";
import { buildAllCandidates } from "@/lib/game/candidates";
import { generateQuestion } from "@/lib/game/generateQuestion";
import { applyWrongAnswer } from "@/lib/mastery/repetition";
import { createInitialProgress, type ProgressRecord } from "@/lib/mastery/types";
import { articleConceptKey } from "@/lib/mastery/conceptKeys";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));
const allCandidates = buildAllCandidates(NOUNS);

describe("generateQuestion", () => {
  it("generates a valid article question", () => {
    const { conceptKey, question } = generateQuestion({
      mode: "article",
      nounIndex,
      adjectives: ADJECTIVES,
      allCandidates,
      progressByKey: {},
      currentQuestionIndex: 0,
      recentConceptKeys: [],
      random: () => 0.9, // avoid the rare plural branch
    });

    expect(question.mode).toBe("article");
    expect(conceptKey.startsWith("article:")).toBe(true);
    if (question.mode === "article") {
      expect(["de", "het"]).toContain(question.correctAnswer);
    }
  });

  it("generates a valid demonstrative question", () => {
    const { question } = generateQuestion({
      mode: "demonstrative",
      nounIndex,
      adjectives: ADJECTIVES,
      allCandidates,
      progressByKey: {},
      currentQuestionIndex: 0,
      recentConceptKeys: [],
      random: () => 0.9,
    });

    expect(question.mode).toBe("demonstrative");
    if (question.mode === "demonstrative") {
      expect(["deze", "dit", "die", "dat"]).toContain(question.correctAnswer);
    }
  });

  it("generates a valid adjective question with exactly two options", () => {
    const { question } = generateQuestion({
      mode: "adjective",
      nounIndex,
      adjectives: ADJECTIVES,
      allCandidates,
      progressByKey: {},
      currentQuestionIndex: 0,
      recentConceptKeys: [],
      random: () => 0.9,
    });

    expect(question.mode).toBe("adjective");
    if (question.mode === "adjective") {
      expect(question.options).toHaveLength(2);
      expect(question.options).toContain(question.correctAnswer);
    }
  });

  it("throws for weak-review when nothing is weak yet", () => {
    expect(() =>
      generateQuestion({
        mode: "weak-review",
        nounIndex,
        adjectives: ADJECTIVES,
        allCandidates,
        progressByKey: {},
        currentQuestionIndex: 0,
        recentConceptKeys: [],
      }),
    ).toThrow();
  });

  it("weak-review draws from a concept that was recently answered wrong", () => {
    const kantoor = NOUNS.find((n) => n.id === "kantoor")!;
    const conceptKey = articleConceptKey(kantoor.id);
    const candidate = allCandidates.article.find((c) => c.conceptKey === conceptKey)!;
    const wrongRecord = applyWrongAnswer(createInitialProgress(candidate), 0, undefined, () => 0.5);
    const progressByKey: Record<string, ProgressRecord> = { [conceptKey]: wrongRecord };

    const { conceptKey: pickedKey } = generateQuestion({
      mode: "weak-review",
      nounIndex,
      adjectives: ADJECTIVES,
      allCandidates,
      progressByKey,
      currentQuestionIndex: 3,
      recentConceptKeys: [],
      random: () => 0.9,
    });

    expect(pickedKey).toBe(conceptKey);
  });

  it("never asks the same concept on two consecutive questions (large pool)", () => {
    let recentConceptKeys: string[] = [];
    const progressByKey: Record<string, ProgressRecord> = {};
    for (let i = 0; i < 30; i++) {
      const { conceptKey } = generateQuestion({
        mode: "article",
        nounIndex,
        adjectives: ADJECTIVES,
        allCandidates,
        progressByKey,
        currentQuestionIndex: i,
        recentConceptKeys,
        random: Math.random,
      });
      if (recentConceptKeys.length > 0) {
        expect(conceptKey).not.toBe(recentConceptKeys[recentConceptKeys.length - 1]);
      }
      recentConceptKeys = [...recentConceptKeys, conceptKey].slice(-2);
    }
  });
});
