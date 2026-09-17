import { explainAdjective, explainArticle, explainDemonstrative } from "./explanations";
import type { GrammarQuestion } from "./types";

export function explainQuestion(question: GrammarQuestion): string {
  if (question.mode === "article") {
    return explainArticle(question.noun, question.isPlural);
  }
  if (question.mode === "demonstrative") {
    return explainDemonstrative(question.noun, question.distance, question.isPlural);
  }
  return explainAdjective(
    question.noun,
    question.adjective,
    question.determinerType,
    question.determinerWord,
    question.isPlural,
  );
}
