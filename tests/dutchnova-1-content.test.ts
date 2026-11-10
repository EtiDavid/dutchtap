import { describe, expect, it } from "vitest";
import pack from "../data/dutchnova-1-cards.json";

describe("DutchNova_1 editorial content structure", () => {
  const cards = pack.cards;
  it("uses a stable, separate collection and unique ids", () => {
    expect(pack.collection).toBe("dutchnova_1");
    expect(cards.length).toBeGreaterThanOrEqual(150);
    expect(cards.length).toBeLessThanOrEqual(200);
    expect(new Set(cards.map(c => c.id)).size).toBe(cards.length);
    expect(cards.every(c => /^dutchnova1-\d{4}$/.test(c.id))).toBe(true);
  });
  it("has real-life settings, meaningful prompts and tailored notes", () => {
    expect(new Set(cards.map(c => c.setting)).size).toBeGreaterThanOrEqual(6);
    for (const card of cards) {
      expect(card.scenarioEn.trim().length).toBeGreaterThan(20);
      expect(card.text.trim().length).toBeGreaterThan(10);
      expect(card.explanation.trim().length).toBeGreaterThan(45);
      expect(card.commonMistake.trim()).not.toBe(card.text.trim());
      expect(card.contrast.trim().length).toBeGreaterThan(10);
      expect(card.reviewStatus).toBe("ai-draft");
      expect(card.audioStatus).toBe("not-generated");
      expect(card.teaching.communicationGoal).toBe(card.scenarioEn);
      expect(card.teaching.meaningAndUsage.length).toBeGreaterThan(45);
      expect(card.teaching.grammarReason.length).toBeGreaterThan(70);
      expect(card.teaching.commonError.incorrect).toBe(card.commonMistake);
      expect(card.teaching.commonError.correction).toBe(card.text);
      expect(card.teaching.meaningfulContrast).toBe(card.contrast);
    }
  });
  it("does not silently copy identical answers into several cards", () => {
    const duplicates = cards.reduce<Record<string, number>>((acc, card) => {
      const key = card.text.toLocaleLowerCase("nl-BE").trim();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.entries(duplicates).filter(([,n]) => n > 1)).toEqual([]);
  });
});
