import { describe, expect, it } from "vitest";
import { COLLECTIONS, topicsFor } from "../lib/content/collections";
import { cardsFor, cardFor } from "../lib/content/cards";
import { createSession, levelCounts } from "../lib/sessions/engine";
import { sessionSchema } from "../lib/sessions/types";
import { variationsFor, variationCard } from "../lib/variations/content";

describe("DutchNova_1 native collection integration", () => {
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
