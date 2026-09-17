import { describe, expect, it } from "vitest";
import { NOUNS } from "@/data/nouns";
import { ADJECTIVES } from "@/data/adjectives";
import { validateAdjectives, validateNouns } from "@/lib/validation/content";

describe("noun content", () => {
  it("passes validation with no errors", () => {
    const result = validateNouns(NOUNS);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("has at least 250 verified entries", () => {
    expect(NOUNS.length).toBeGreaterThanOrEqual(250);
  });

  it("has unique ids", () => {
    const ids = NOUNS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("catches a missing required field", () => {
    const result = validateNouns([{ ...NOUNS[0], singular: "" }]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "singular")).toBe(true);
  });

  it("catches a duplicate id", () => {
    const result = validateNouns([NOUNS[0], NOUNS[0]]);
    expect(result.errors.some((e) => e.field === "id" && e.message === "Duplicate id")).toBe(true);
  });

  it("catches an invalid article", () => {
    // @ts-expect-error intentionally invalid for the test
    const result = validateNouns([{ ...NOUNS[0], article: "een" }]);
    expect(result.valid).toBe(false);
  });
});

describe("adjective content", () => {
  it("passes validation with no errors", () => {
    const result = validateAdjectives(ADJECTIVES);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("has unique ids", () => {
    const ids = ADJECTIVES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stores an explicit eForm distinct from base for spelling-changing adjectives", () => {
    const rood = ADJECTIVES.find((a) => a.id === "rood");
    expect(rood?.eForm).toBe("rode");
    expect(rood?.eForm).not.toBe(`${rood?.base}e`);
  });

  it("catches a missing eForm", () => {
    const result = validateAdjectives([{ ...ADJECTIVES[0], eForm: "" }]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "eForm")).toBe(true);
  });
});
