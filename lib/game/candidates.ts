import type { AdjectiveEntry, NounEntry } from "@/data/types";
import { adjectiveConceptKey, articleConceptKey, demonstrativeConceptKey } from "@/lib/mastery/conceptKeys";
import type { Candidate } from "@/lib/mastery/types";
import type { DeterminerType } from "@/lib/grammar/types";

export const ADJECTIVE_DETERMINER_TYPES: DeterminerType[] = ["indefinite", "definite", "possessive"];

export function buildArticleCandidates(nouns: NounEntry[]): Candidate[] {
  return nouns.map((noun) => ({
    conceptKey: articleConceptKey(noun.id),
    mode: "article",
    wordId: noun.id,
    frequencyRank: noun.frequencyRank,
  }));
}

export function buildDemonstrativeCandidates(nouns: NounEntry[]): Candidate[] {
  return nouns.map((noun) => ({
    conceptKey: demonstrativeConceptKey(noun.id),
    mode: "demonstrative",
    wordId: noun.id,
    frequencyRank: noun.frequencyRank,
  }));
}

export function buildAdjectiveCandidates(nouns: NounEntry[]): Candidate[] {
  return nouns.flatMap((noun) =>
    ADJECTIVE_DETERMINER_TYPES.map((determinerType) => ({
      conceptKey: adjectiveConceptKey(noun.id, determinerType),
      mode: "adjective" as const,
      wordId: noun.id,
      frequencyRank: noun.frequencyRank,
    })),
  );
}

export function buildAllCandidates(nouns: NounEntry[]): {
  article: Candidate[];
  demonstrative: Candidate[];
  adjective: Candidate[];
} {
  return {
    article: buildArticleCandidates(nouns),
    demonstrative: buildDemonstrativeCandidates(nouns),
    adjective: buildAdjectiveCandidates(nouns),
  };
}

export function compatibleAdjectives(noun: NounEntry, adjectives: AdjectiveEntry[]): AdjectiveEntry[] {
  const filtered = adjectives.filter(
    (adj) => !adj.allowedCategories || adj.allowedCategories.includes(noun.category),
  );
  return filtered.length > 0 ? filtered : adjectives;
}

/** Parses "adj:<wordId>:<determinerType>" back into its parts. */
export function parseAdjectiveConceptKey(conceptKey: string): { wordId: string; determinerType: DeterminerType } {
  const [, wordId, determinerType] = conceptKey.split(":");
  return { wordId, determinerType: determinerType as DeterminerType };
}
