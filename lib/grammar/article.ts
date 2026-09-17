import type { NounEntry } from "@/data/types";
import type { Article } from "./types";

/** All Dutch plural nouns take "de", regardless of the singular's article. */
export function getArticleAnswer(noun: NounEntry, isPlural: boolean): Article {
  if (isPlural) return "de";
  return noun.article;
}
