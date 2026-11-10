import { describe, expect, it } from "vitest";
import { COLLECTIONS, topicsFor } from "../lib/content/collections";
import { cardsFor, cardFor } from "../lib/content/cards";
import { createSession, levelCounts } from "../lib/sessions/engine";
import { sessionSchema } from "../lib/sessions/types";
import { variationsFor, variationCard } from "../lib/variations/content";
import cards from "../data/dutchnova-1-cards.json";
import deepNotes from "../data/dutchnova-1-deep-notes.json";
import variations from "../data/dutchnova-1-variations.json";

describe("DutchNova_1 native collection integration", () => {
  it("has detailed authored walkthroughs and two related examples for every parent", () => {
    const deep = deepNotes as Record<string, {
      meaning:string; parts:string[][]; wordOrder:string; englishTrap:string; examples:string[][];
    }>;
    expect(Object.keys(deep)).toHaveLength(cards.cards.length);
    for (const card of cards.cards) {
      const note = deep[card.id];
      expect(note, card.id).toBeDefined();
      expect(note.parts.length, card.id).toBeGreaterThanOrEqual(1);
      expect(note.parts.every(([word, explanation]) => word.length > 0 && explanation.length > 7), card.id).toBe(true);
      expect(note.wordOrder.length, card.id).toBeGreaterThanOrEqual(130);
      expect(note.englishTrap.length, card.id).toBeGreaterThan(60);
      expect(note.examples.length, card.id).toBeGreaterThanOrEqual(2);
      expect(note.examples.every(([nl, en]) => nl.length > 10 && en.length > 10), card.id).toBe(true);
    }
  });
  it("gives all 164 parents separate, explanatory variation practice without duplicated answers", () => {
    const allParents = new Set(cards.cards.map(card => card.id));
    expect(Object.keys(variations)).toHaveLength(allParents.size);
    const allChildren = Object.values(variations).flat();
    expect(allChildren.length).toBeGreaterThanOrEqual(164);
    const existing = new Set(cards.cards.map(c => c.text.toLocaleLowerCase("nl-BE").replace(/[.,!?;:]/g, "").trim()));
    const texts = new Set<string>();
    const ids = new Set<string>();
    for(const child of allChildren) {
      expect(allParents.has(child.parentId), child.id).toBe(true);
      expect(child.id.startsWith(child.parentId + "~v"), child.id).toBe(true);
      expect(child.scenario.length, child.id).toBeGreaterThanOrEqual(25);
      expect(child.explanation.length, child.id).toBeGreaterThanOrEqual(55);
      const text = child.text.toLocaleLowerCase("nl-BE").replace(/[.,!?;:]/g, "").trim();
      expect(existing.has(text), child.id).toBe(false);
      expect(texts.has(text), child.id).toBe(false);
      expect(ids.has(child.id), child.id).toBe(false);
      texts.add(text); ids.add(child.id);
      expect(variationCard(child.id)?.collection, child.id).toBe("dutchnova_1");
    }
  });

  it("is a Dutch-only selectable collection with its own scenario topics", () => {
    expect(COLLECTIONS).toContain("dutchnova_1");
    expect(Object.keys(topicsFor("dutchnova_1"))).toContain("market");
    const list = cardsFor("nl").filter(c => c.collection === "dutchnova_1");
    expect(list.length).toBeGreaterThanOrEqual(150);
    expect(cardsFor("fr").some(c => c.collection === "dutchnova_1")).toBe(false);
    expect(list.every(c => c.id.startsWith("dutchnova1-") && !!c.scenario)).toBe(true);
  });
  it("makes a 10-card fixed session with correct category and saved schema", () => {
    const reviews = {};
    const counts = levelCounts("all", reviews, "nl", "dutchnova_1");
    expect(counts.difficult).toBeGreaterThanOrEqual(150);
    const session = createSession({ collection:"dutchnova_1", topic:"all", count:10, level:"difficult", lang:"nl", reviews });
    expect(session).not.toBeNull();
    expect(session?.cardIds.length).toBe(10);
    expect(session?.cardIds.every(id => cardFor("nl", id)?.collection === "dutchnova_1")).toBe(true);
    expect(sessionSchema.safeParse(session).success).toBe(true);
  });
  it("exposes independently tracked authored children in native variation flow", () => {
    const parent = "dutchnova1-0001";
    const children = variationsFor(parent);
    expect(children.length).toBe(2);
    for (const child of children) {
      expect(child.parentId).toBe(parent);
      expect(child.scenario.length).toBeGreaterThan(20);
      expect(child.explanation.length).toBeGreaterThan(50);
      expect(variationCard(child.id)?.collection).toBe("dutchnova_1");
    }
  });
});
