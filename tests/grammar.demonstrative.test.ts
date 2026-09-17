import { describe, expect, it } from "vitest";
import { getDemonstrativeAnswer } from "@/lib/grammar/demonstrative";
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

const hetWoord: NounEntry = { ...deWoord, id: "test-het", singular: "kantoor", article: "het", plural: "kantoren" };

describe("getDemonstrativeAnswer", () => {
  it("singular de + near -> deze", () => {
    expect(getDemonstrativeAnswer(deWoord, "near", false)).toBe("deze");
  });

  it("singular de + far -> die", () => {
    expect(getDemonstrativeAnswer(deWoord, "far", false)).toBe("die");
  });

  it("singular het + near -> dit", () => {
    expect(getDemonstrativeAnswer(hetWoord, "near", false)).toBe("dit");
  });

  it("singular het + far -> dat", () => {
    expect(getDemonstrativeAnswer(hetWoord, "far", false)).toBe("dat");
  });

  it("plural + near -> deze, regardless of singular article", () => {
    expect(getDemonstrativeAnswer(deWoord, "near", true)).toBe("deze");
    expect(getDemonstrativeAnswer(hetWoord, "near", true)).toBe("deze");
  });

  it("plural + far -> die, regardless of singular article", () => {
    expect(getDemonstrativeAnswer(deWoord, "far", true)).toBe("die");
    expect(getDemonstrativeAnswer(hetWoord, "far", true)).toBe("die");
  });
});
