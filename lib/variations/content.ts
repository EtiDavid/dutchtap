import { scenarioFor } from "@/lib/practice/communication";
import workplaceFamilies from "@/data/workplace-families.json";
import workplaceBank from "@/data/workplace-practice-bank.json";
import references from "@/data/dutch-variations.json";
import practiceBank from "@/data/dutch-practice-bank.json";
import { CARDS } from "@/lib/flashcards/engine";
import type { LCard } from "@/lib/content/cards";

export type Variation = {
  id: string;
  parentId: string;
  text: string;
  english: string;
  scenario: string;
  explanation: string;
  example: { text: string; english: string };
  focus: string;
};
type Pattern = { focus: string; rule: string; hint: string; pairs: string[][] };
const bank = practiceBank as Record<string, Pattern>;
const refs = references as Record<
  string,
  { pattern: string; indices: number[] }
>;
// Store shared authored examples once, while keeping each learner's family IDs and progress separate.
const everydayFamilies: Record<string, Variation[]> = Object.fromEntries(
  Object.entries(refs).map(([parentId, family]) => {
    const pattern = bank[family.pattern];
    return [
      parentId,
      family.indices.map((index, i) => {
        const [text, english] = pattern.pairs[index];
        const [exampleText, exampleEnglish] =
          pattern.pairs[family.indices[(i + 1) % family.indices.length]];
        return {
          id: `${parentId}~v${String(i + 1).padStart(2, "0")}`,
          parentId,
          text,
          english,
          scenario: scenarioFor(text, "Describe the situation in Dutch."),
          focus: pattern.focus,
          explanation: pattern.hint,
          example: { text: exampleText, english: exampleEnglish },
        };
      }),
    ];
  }),
);
const careerBank = workplaceBank as Record<string, { focus: string; examples: { text: string; english: string; scenario: string; explanation: string }[] }>;
const careerRefs = workplaceFamilies as Record<string, { group: string; indices: number[] }>;
const careerFamilies: Record<string, Variation[]> = Object.fromEntries(Object.entries(careerRefs).map(([parentId, family]) => {
  const group = careerBank[family.group];
  return [parentId, family.indices.map((index, i) => {
    const row = group.examples[index], next = group.examples[family.indices[(i + 1) % family.indices.length]];
    return { id: `${parentId}~v${String(i + 1).padStart(2, '0')}`, parentId, ...row,
      example: { text: next.text, english: next.english }, focus: group.focus };
  })];
}));
export const FAMILIES: Record<string, Variation[]> = { ...everydayFamilies, ...careerFamilies };
const byId = new Map(
  Object.values(FAMILIES)
    .flat()
    .map((v) => [v.id, v]),
);
const parents = new Map(CARDS.map((c) => [c.id, c]));
export const variationFor = (id: string) => byId.get(id);
export const variationsFor = (id: string) => FAMILIES[id] ?? [];
export const parentFor = (id: string) => variationFor(id)?.parentId ?? id;
export const isVariation = (id: string) => byId.has(id);
export function variationCard(id: string): LCard | undefined {
  const v = byId.get(id),
    p = v && parents.get(v.parentId);
  return v && p
    ? {
        id: v.id,
        lang: "nl",
        collection: p.collection ?? "everyday",
        category: p.category,
        text: v.text,
        english: v.english,
        scenario: v.scenario,
        cue: v.scenario,
        variation: v.example.text,
        difficulty: "beginner",
        vocabularyIds: [],
        image: "",
        audio: undefined,
      }
    : undefined;
}
