import type { AdjectiveEntry, NounEntry } from "@/data/types";
import { getAdjectiveAnswer } from "./adjective";
import { getArticleAnswer } from "./article";
import { getDemonstrativeAnswer } from "./demonstrative";
import { POSSESSIVES } from "./types";
import type {
  AdjectiveQuestion,
  ArticleQuestion,
  DemonstrativeQuestion,
  DeterminerType,
  Distance,
} from "./types";

export function buildArticleQuestion(noun: NounEntry, isPlural: boolean): ArticleQuestion {
  return {
    mode: "article",
    noun,
    isPlural,
    displayWord: isPlural ? noun.plural : noun.singular,
    englishHint: isPlural ? noun.englishPlural : noun.englishSingular,
    correctAnswer: getArticleAnswer(noun, isPlural),
    options: ["de", "het"],
  };
}

export function buildDemonstrativeQuestion(
  noun: NounEntry,
  distance: Distance,
  isPlural: boolean,
): DemonstrativeQuestion {
  return {
    mode: "demonstrative",
    noun,
    isPlural,
    distance,
    displayWord: isPlural ? noun.plural : noun.singular,
    englishHint: isPlural ? noun.englishPlural : noun.englishSingular,
    correctAnswer: getDemonstrativeAnswer(noun, distance, isPlural),
    options: ["deze", "dit", "die", "dat"],
  };
}

function determinerWordFor(
  noun: NounEntry,
  determinerType: DeterminerType,
  isPlural: boolean,
  random: () => number,
): string {
  if (isPlural) return "de";
  if (determinerType === "indefinite") return "een";
  if (determinerType === "definite") return noun.article;
  return POSSESSIVES[Math.floor(random() * POSSESSIVES.length)];
}

export function buildAdjectiveQuestion(
  noun: NounEntry,
  adjective: AdjectiveEntry,
  determinerType: DeterminerType,
  isPlural: boolean,
  random: () => number = Math.random,
): AdjectiveQuestion {
  const effectiveDeterminerType = isPlural ? "definite" : determinerType;
  const determinerWord = determinerWordFor(noun, effectiveDeterminerType, isPlural, random);
  const correctAnswer = getAdjectiveAnswer(noun, adjective, effectiveDeterminerType, isPlural);
  const options: [string, string] =
    random() < 0.5 ? [adjective.base, adjective.eForm] : [adjective.eForm, adjective.base];

  return {
    mode: "adjective",
    noun,
    adjective,
    determinerType: effectiveDeterminerType,
    determinerWord,
    isPlural,
    englishHint: `${adjective.english} ${isPlural ? noun.englishPlural : noun.englishSingular}`,
    correctAnswer,
    options,
  };
}
