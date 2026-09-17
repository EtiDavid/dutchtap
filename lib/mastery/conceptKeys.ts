import type { DeterminerType } from "@/lib/grammar/types";

export function articleConceptKey(wordId: string): string {
  return `article:${wordId}`;
}

export function demonstrativeConceptKey(wordId: string): string {
  return `demo:${wordId}`;
}

export function adjectiveConceptKey(wordId: string, determinerType: DeterminerType): string {
  return `adj:${wordId}:${determinerType}`;
}
