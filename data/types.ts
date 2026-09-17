export type NounCategory =
  | "home"
  | "work"
  | "school"
  | "food"
  | "people"
  | "family"
  | "city"
  | "transport"
  | "nature"
  | "time"
  | "technology"
  | "shopping"
  | "travel"
  | "health"
  | "leisure";

export type NounLevel = "A1" | "A2";

export type NounEntry = {
  id: string;
  singular: string;
  article: "de" | "het";
  plural: string;
  englishSingular: string;
  englishPlural: string;
  category: NounCategory;
  level: NounLevel;
  frequencyRank?: number;
  tags?: string[];
};

export type AdjectiveEntry = {
  id: string;
  base: string;
  eForm: string;
  english: string;
  allowedCategories?: NounCategory[];
};

export const NOUN_CATEGORIES: NounCategory[] = [
  "home",
  "work",
  "school",
  "food",
  "people",
  "family",
  "city",
  "transport",
  "nature",
  "time",
  "technology",
  "shopping",
  "travel",
  "health",
  "leisure",
];
