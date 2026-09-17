import { describe, expect, it } from "vitest";
import { getAdjectiveAnswer } from "@/lib/grammar/adjective";
import type { AdjectiveEntry, NounEntry } from "@/data/types";

const tas: NounEntry = {
  id: "tas",
  singular: "tas",
  article: "de",
  plural: "tassen",
  englishSingular: "bag",
  englishPlural: "bags",
  category: "shopping",
  level: "A1",
};

const huis: NounEntry = { ...tas, id: "huis", singular: "huis", article: "het", plural: "huizen" };

const rood: AdjectiveEntry = { id: "rood", base: "rood", eForm: "rode", english: "red" };
const mooi: AdjectiveEntry = { id: "mooi", base: "mooi", eForm: "mooie", english: "beautiful" };

describe("getAdjectiveAnswer", () => {
  it("een rode tas (indefinite de-word -> -e form)", () => {
    expect(getAdjectiveAnswer(tas, rood, "indefinite", false)).toBe("rode");
  });

  it("een mooi huis (indefinite het-word -> base form)", () => {
    expect(getAdjectiveAnswer(huis, mooi, "indefinite", false)).toBe("mooi");
  });

  it("de rode tas (definite de-word -> -e form)", () => {
    expect(getAdjectiveAnswer(tas, rood, "definite", false)).toBe("rode");
  });

  it("het mooie huis (definite het-word -> -e form)", () => {
    expect(getAdjectiveAnswer(huis, mooi, "definite", false)).toBe("mooie");
  });

  it("mijn rode tas (possessive de-word -> -e form)", () => {
    expect(getAdjectiveAnswer(tas, rood, "possessive", false)).toBe("rode");
  });

  it("mijn mooie huis (possessive het-word -> -e form)", () => {
    expect(getAdjectiveAnswer(huis, mooi, "possessive", false)).toBe("mooie");
  });

  it("plural always gets the -e form", () => {
    expect(getAdjectiveAnswer(tas, rood, "indefinite", true)).toBe("rode");
    expect(getAdjectiveAnswer(huis, mooi, "indefinite", true)).toBe("mooie");
  });

  it("uses the explicitly stored eForm rather than a naive base + 'e' rule", () => {
    const goedkoop: AdjectiveEntry = { id: "goedkoop", base: "goedkoop", eForm: "goedkope", english: "cheap" };
    expect(getAdjectiveAnswer(tas, goedkoop, "definite", false)).toBe("goedkope");
    expect(getAdjectiveAnswer(tas, goedkoop, "definite", false)).not.toBe(`${goedkoop.base}e`);
  });
});
