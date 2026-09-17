import type { AdjectiveEntry, NounEntry } from "@/data/types";
import type { DeterminerType } from "./types";

/**
 * - Plural: always the -e form.
 * - Definite (de/het) or possessive determiner: always the -e form.
 * - Indefinite ("een"): -e form for de-words, base form for het-words.
 */
export function getAdjectiveAnswer(
  noun: NounEntry,
  adjective: AdjectiveEntry,
  determinerType: DeterminerType,
  isPlural: boolean,
): string {
  if (isPlural) return adjective.eForm;
  if (determinerType === "definite" || determinerType === "possessive") return adjective.eForm;

  // indefinite
  return noun.article === "de" ? adjective.eForm : adjective.base;
}
