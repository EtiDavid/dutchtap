import type { AdjectiveEntry, NounEntry } from "@/data/types";

export type Distance = "near" | "far";
export type Article = "de" | "het";
export type Demonstrative = "deze" | "dit" | "die" | "dat";
export type DeterminerType = "indefinite" | "definite" | "possessive";

export const POSSESSIVES = ["mijn", "jouw", "zijn", "haar", "onze", "hun"] as const;
export type Possessive = (typeof POSSESSIVES)[number];

export type ArticleQuestion = {
  mode: "article";
  noun: NounEntry;
  isPlural: boolean;
  displayWord: string;
  englishHint: string;
  correctAnswer: Article;
  options: readonly [Article, Article];
};

export type DemonstrativeQuestion = {
  mode: "demonstrative";
  noun: NounEntry;
  isPlural: boolean;
  distance: Distance;
  displayWord: string;
  englishHint: string;
  correctAnswer: Demonstrative;
  options: readonly [Demonstrative, Demonstrative, Demonstrative, Demonstrative];
};

export type AdjectiveQuestion = {
  mode: "adjective";
  noun: NounEntry;
  adjective: AdjectiveEntry;
  determinerType: DeterminerType;
  determinerWord: string;
  isPlural: boolean;
  englishHint: string;
  correctAnswer: string;
  options: readonly [string, string];
};

export type GrammarQuestion = ArticleQuestion | DemonstrativeQuestion | AdjectiveQuestion;

export type GameMode = "article" | "demonstrative" | "adjective";
