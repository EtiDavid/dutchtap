import forms from "@/data/grammar-separable-forms.json";
import cards from "@/data/editorial/grammar-separable-cards.json";

export type SeparableForms = {
  lemma: string; particle: string; base: string; auxiliary: "hebben" | "zijn"; reflexive: boolean; preposition?: string;
  presentIk: string; presentHij: string; pastSingular: string; pastPlural: string; participle: string;
  mainClause: string; simplePast: string; perfect: string; modal: string; teInfinitive: string; subordinate: string; subordinatePast: string; imperative: string;
};
export const SEPARABLE_FORMS = forms as Record<string, SeparableForms>;

/** The first eight lemmas have three cards each (present, past, perfect) from the original card set, pat-separable-01 to 24. */
const ORIGINAL = ["opsturen", "invullen", "aanvragen", "opruimen", "afmaken", "inloggen", "aankomen", "meenemen"];

/** The lemma behind a separable card, by id: the original 24 cards are three per verb, later cards follow the editorial card file. */
export function separableLemmaOf(cardId: string): string | undefined {
  const match = /^pat-separable-(\d+)$/.exec(cardId);
  if (!match) return undefined;
  const n = Number(match[1]);
  if (n >= 1 && n <= 24) return ORIGINAL[Math.floor((n - 1) / 3)];
  return (cards as { lemma: string }[])[n - 25]?.lemma;
}
export const separableFormsFor = (cardId: string): SeparableForms | undefined => {
  const lemma = separableLemmaOf(cardId);
  return lemma ? SEPARABLE_FORMS[lemma] : undefined;
};
