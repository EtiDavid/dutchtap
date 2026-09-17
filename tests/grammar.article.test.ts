import { describe, expect, it } from "vitest";
import { getArticleAnswer } from "@/lib/grammar/article";
import type { NounEntry } from "@/data/types";

const deWoord: NounEntry = {
  id: "test-de",
  singular: "tas",
  article: "de",
  plural: "tassen",
  englishSingular: "bag",
  englishPlural: "bags",
  category: "shopping",
  level: "A1",
};

const hetWoord: NounEntry = { ...deWoord, id: "test-het", singular: "huis", article: "het", plural: "huizen" };

describe("getArticleAnswer", () => {
  it("returns the noun's own article when singular", () => {
    expect(getArticleAnswer(deWoord, false)).toBe("de");
    expect(getArticleAnswer(hetWoord, false)).toBe("het");
  });

  it("always returns de for plural nouns, regardless of singular article", () => {
    expect(getArticleAnswer(deWoord, true)).toBe("de");
    expect(getArticleAnswer(hetWoord, true)).toBe("de");
  });
});
