import analysis from "@/data/grammar-als-analysis.json";
import omdatAnalysis from "@/data/grammar-omdat-analysis.json";
import datAnalysis from "@/data/grammar-dat-analysis.json";
import type { Breakdown } from "@/lib/grammarBreakdowns";

/**
 * Hand-authored, per-sentence grammar analysis for the Als topic (data/grammar-als-analysis.json).
 * Every clause span, finite verb and correction is written for that sentence; nothing here is derived by pattern matching.
 */
export type AnalysisClause = {
  kind: "hoofdzin" | "bijzin"; text: string; subject: string; finite: string; why: string;
  /** What this clause does in the sentence, for example "relative clause" or "reported content". */
  role?: string;
  /** A phrase that may legitimately stand after the final verb of a dependent clause (for example a place phrase). */
  afterFinite?: string;
};
export type AnalysisRecord = {
  status: "ai-editorial-checked";
  /** Als only: which meaning of als the sentence uses. */
  alsSense?: "if" | "when" | "whenever" | "only-when";
  alsSenseWhy?: string;
  /** Other topics: the meaning or function of the key word in this sentence (for example "omdat = because"). */
  sense?: { label: string; why: string };
  /** Default "subordinate". "coordinate" marks a contrast made of two main clauses (for example want); "demonstrative" a single main clause where the key word is a pointing word; "relative" a relative clause inside or after a main clause. */
  pattern?: "subordinate" | "coordinate" | "demonstrative" | "relative";
  situationNl?: string;
  /** English help for the situation, written where the original English scenario gave the answer away. */
  situationEn?: string;
  clauses: AnalysisClause[];
  parts: { label: string; text: string }[];
  meaning: string;
  order: string;
  forms: string;
  compare: string;
  mistakes: { wrong: string; right: string; why: string }[];
  contrast: { dutch: string; english: string; note: string };
  /** Claims that still need an independent source or a native speaker before they can be stated as fact. */
  openQuestions?: string[];
};

const SENSE: Record<string, string> = { if: "if", when: "when", whenever: "whenever", "only-when": "only when (not until)" };
export const ALS_ANALYSIS = analysis.cards as unknown as Record<string, AnalysisRecord>;
export const OMDAT_ANALYSIS = omdatAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const DAT_ANALYSIS = datAnalysis.cards as unknown as Record<string, AnalysisRecord>;
/** Every authored sentence analysis, whatever its topic. Ids are unique across topics. */
export const GRAMMAR_ANALYSIS: Record<string, AnalysisRecord> = { ...ALS_ANALYSIS, ...OMDAT_ANALYSIS, ...DAT_ANALYSIS };
export const analysisFor = (cardId: string): AnalysisRecord | undefined => GRAMMAR_ANALYSIS[cardId];
/** A Dutch-first situation for cards that were written before Dutch prompts existed (including linked Everyday/Work sentences). */
export const situationEnFor = (cardId: string): string | undefined => GRAMMAR_ANALYSIS[cardId]?.situationEn;
export const situationNlFor = (cardId: string): string | undefined => GRAMMAR_ANALYSIS[cardId]?.situationNl;

/** The analysis in the shape the existing sentence-breakdown view already renders, plus the extra authored fields. */
export function analysisBreakdown(cardId: string): Breakdown | undefined {
  const record = GRAMMAR_ANALYSIS[cardId];
  if (!record) return undefined;
  const [first, ...rest] = record.mistakes;
  return {
    meaning: record.meaning,
    parts: record.parts,
    order: record.order,
    forms: record.forms,
    compare: record.compare,
    mistake: first,
    extraMistakes: rest,
    contrast: record.contrast,
    clauses: record.clauses,
    sense: record.sense ?? (record.alsSense ? { label: `als = ${SENSE[record.alsSense]}`, why: record.alsSenseWhy ?? "" } : undefined),
  };
}
