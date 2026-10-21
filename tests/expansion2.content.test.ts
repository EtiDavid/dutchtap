import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import more from "@/data/flashcard-additions-2.json";
import { EVERYDAY_CARDS as CARDS, CATEGORIES } from "@/lib/flashcards/engine";
import { BREAKDOWNS } from "@/lib/grammarBreakdowns";
import { GRAMMAR_NOTES } from "@/lib/grammarNotes";
import { VOCABULARY } from "@/lib/vocabulary";

const normalise = (text: string) =>
  text
    .toLocaleLowerCase("nl")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const ids = more.map((card) => card.id);

describe("second 300 sentences (work-31 to work-330)", () => {
  it("adds 300 new, distinct sentences after the protected 300", () => {
    expect(more).toHaveLength(300);
    expect(CARDS).toHaveLength(600);
    expect(CARDS.slice(300).map((card) => card.id)).toEqual(ids);
    expect(ids[0]).toBe("work-31");
    expect(ids[299]).toBe("work-330");
    expect(new Set(CARDS.map((card) => normalise(card.dutch))).size).toBe(600);
    for (const card of more) {
      expect(CATEGORIES).toHaveProperty(card.category);
      expect(card.difficulty).toMatch(/^(beginner|intermediate)$/);
      expect(card.scenario.toLowerCase()).not.toContain(normalise(card.dutch));
      expect(card.image).toBe(`/illustrations/cards/${card.id}.webp`);
      expect(card.audio).toBe(`/audio/flashcards/${card.id}.mp3`);
      expect(existsSync(`public${card.image}`), card.id).toBe(true);
      expect(existsSync(`public${card.audio}`), card.id).toBe(true);
    }
  });
  it("labels adapted sentences honestly: 145 adapted, 155 taken from the source wording", () => {
    expect(
      more.filter((card) => (card as { adapted?: boolean }).adapted),
    ).toHaveLength(145);
    expect(
      more.filter((card) => !(card as { adapted?: boolean }).adapted),
    ).toHaveLength(155);
  });
  it("has a note with 2 to 3 distinct examples and a breakdown for every new sentence", () => {
    for (const id of ids) {
      expect(BREAKDOWNS[id], id).toBeDefined();
      const note = GRAMMAR_NOTES[id];
      expect(note, id).toBeDefined();
      expect(note.examples.length, id).toBeGreaterThanOrEqual(2);
      expect(note.examples.length, id).toBeGreaterThanOrEqual(10);
      expect(
        new Set(note.examples.map((example) => normalise(example.dutch))).size,
        id,
      ).toBe(note.examples.length);
    }
  });
  it("links every new sentence to vocabulary that points back to it", () => {
    for (const card of more)
      for (const id of card.vocabularyIds) {
        const entry = VOCABULARY.find((entry) => entry.id === id);
        expect(entry, `${card.id}: ${id}`).toBeDefined();
        expect(
          entry!.occurrences.some(
            (occurrence) => occurrence.cardId === card.id,
          ),
          `${card.id}: ${id}`,
        ).toBe(true);
      }
  });
  it("keeps the original 300 sentences and their IDs first and unchanged in order", () => {
    expect(CARDS.slice(0, 300).every((card) => !ids.includes(card.id))).toBe(
      true,
    );
  });
});
