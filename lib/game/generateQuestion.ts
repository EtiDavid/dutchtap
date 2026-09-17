import type { AdjectiveEntry, NounEntry } from "@/data/types";
import {
  buildAdjectiveQuestion,
  buildArticleQuestion,
  buildDemonstrativeQuestion,
} from "@/lib/grammar/questions";
import type { Distance, GameMode, GrammarQuestion } from "@/lib/grammar/types";
import { selectNextConcept } from "@/lib/mastery/selection";
import type { Candidate, ProgressRecord } from "@/lib/mastery/types";
import { compatibleAdjectives, parseAdjectiveConceptKey } from "./candidates";
import { ADJECTIVE_PLURAL_RATE, DEMONSTRATIVE_PLURAL_RATE, PLURAL_QUESTION_RATE } from "./config";
import { isWeakConcept } from "./weakWords";

export type CandidatesByMode = {
  article: Candidate[];
  demonstrative: Candidate[];
  adjective: Candidate[];
};

export type GenerateQuestionParams = {
  mode: GameMode | "weak-review";
  nounIndex: Map<string, NounEntry>;
  adjectives: AdjectiveEntry[];
  allCandidates: CandidatesByMode;
  progressByKey: Record<string, ProgressRecord>;
  currentQuestionIndex: number;
  recentConceptKeys: string[];
  random?: () => number;
};

export type GeneratedQuestion = {
  conceptKey: string;
  question: GrammarQuestion;
};

function eligiblePlural(noun: NounEntry, rate: number, random: () => number): boolean {
  if (noun.tags?.includes("uncountable")) return false;
  return random() < rate;
}

export function generateQuestion(params: GenerateQuestionParams): GeneratedQuestion {
  const {
    mode,
    nounIndex,
    adjectives,
    allCandidates,
    progressByKey,
    currentQuestionIndex,
    recentConceptKeys,
    random = Math.random,
  } = params;

  let pool: Candidate[];
  if (mode === "weak-review") {
    pool = [...allCandidates.article, ...allCandidates.demonstrative, ...allCandidates.adjective].filter((c) => {
      const record = progressByKey[c.conceptKey];
      return record ? isWeakConcept(record) : false;
    });
    if (pool.length === 0) {
      throw new Error("generateQuestion: no weak concepts available for weak-review mode");
    }
  } else {
    pool = allCandidates[mode];
  }

  const candidate = selectNextConcept({
    candidates: pool,
    progressByKey,
    currentQuestionIndex,
    recentConceptKeys,
    random,
  });

  const noun = nounIndex.get(candidate.wordId);
  if (!noun) {
    throw new Error(`generateQuestion: unknown noun id "${candidate.wordId}"`);
  }

  if (candidate.mode === "article") {
    const isPlural = eligiblePlural(noun, PLURAL_QUESTION_RATE, random);
    return { conceptKey: candidate.conceptKey, question: buildArticleQuestion(noun, isPlural) };
  }

  if (candidate.mode === "demonstrative") {
    const isPlural = eligiblePlural(noun, DEMONSTRATIVE_PLURAL_RATE, random);
    const distance: Distance = random() < 0.5 ? "near" : "far";
    return { conceptKey: candidate.conceptKey, question: buildDemonstrativeQuestion(noun, distance, isPlural) };
  }

  // adjective
  const { determinerType } = parseAdjectiveConceptKey(candidate.conceptKey);
  const isPlural = eligiblePlural(noun, ADJECTIVE_PLURAL_RATE, random);
  const compatible = compatibleAdjectives(noun, adjectives);
  const adjective = compatible[Math.floor(random() * compatible.length)];
  return {
    conceptKey: candidate.conceptKey,
    question: buildAdjectiveQuestion(noun, adjective, determinerType, isPlural, random),
  };
}
