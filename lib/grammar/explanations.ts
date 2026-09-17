import type { AdjectiveEntry, NounEntry } from "@/data/types";
import { getAdjectiveAnswer } from "./adjective";
import { getArticleAnswer } from "./article";
import { getDemonstrativeAnswer } from "./demonstrative";
import type { DeterminerType, Distance } from "./types";

export function explainArticle(noun: NounEntry, isPlural: boolean): string {
  const answer = getArticleAnswer(noun, isPlural);
  if (isPlural) {
    return `All Dutch plural nouns use **de**: **de ${noun.plural}**.`;
  }
  const kind = noun.article === "de" ? "de-word" : "het-word";
  return `**${answer} ${noun.singular}** — \`${noun.singular}\` is a ${kind}. Learn the noun and article together: **${answer} ${noun.singular}**.`;
}

export function explainDemonstrative(noun: NounEntry, distance: Distance, isPlural: boolean): string {
  const answer = getDemonstrativeAnswer(noun, distance, isPlural);
  const word = isPlural ? noun.plural : noun.singular;
  const distanceLabel = distance === "near" ? "near" : "far";

  if (isPlural) {
    return `**${answer} ${word}** — plural nouns use **deze** (near) or **die** (far), so ${distanceLabel === "near" ? "near" : "far"} gives **${answer} ${word}**.`;
  }

  const kind = noun.article === "de" ? "de-word" : "het-word";
  return `**${answer} ${word}** — \`${word}\` is a ${kind} and the object is ${distanceLabel}, so use **${answer}**.`;
}

export function explainAdjective(
  noun: NounEntry,
  adjective: AdjectiveEntry,
  determinerType: DeterminerType,
  determinerWord: string,
  isPlural: boolean,
): string {
  const answer = getAdjectiveAnswer(noun, adjective, determinerType, isPlural);
  const word = isPlural ? noun.plural : noun.singular;
  const phrase = `${determinerWord} ${answer} ${word}`;

  if (isPlural) {
    return `**${phrase}** — plural nouns always take the **-e** form of the adjective.`;
  }

  if (determinerType === "definite") {
    return `**${phrase}** — with definite ${determinerWord}, the adjective gets **-e**.`;
  }

  if (determinerType === "possessive") {
    return `**${phrase}** — after a possessive determiner, the adjective gets **-e**.`;
  }

  // indefinite
  if (noun.article === "de") {
    return `**${phrase}** — \`${noun.singular}\` is a de-word, so the adjective gets **-e**: **${answer}**.`;
  }
  return `**${phrase}** — \`${noun.singular}\` is a singular het-word with **een**, so the adjective stays **${answer}**.`;
}
