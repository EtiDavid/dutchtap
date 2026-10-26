import analysis from "@/data/grammar-als-analysis.json";
import type { Breakdown } from "@/lib/grammarBreakdowns";

/**
 * Hand-authored, per-sentence grammar analysis for the Als topic (data/grammar-als-analysis.json).
 * Every clause span, finite verb and correction is written for that sentence; nothing here is derived by pattern matching.
 */
export type AnalysisClause = {
  kind: "hoofdzin" | "bijzin"; text: string; subject: string; finite: string; why: string;
  /** A phrase that may legitimately stand after the final verb of a dependent clause (for example a place phrase). */
  afterFinite?: string;
};
export type AnalysisRecord = {
  status: "ai-editorial-checked";
  alsSense: "if" | "when" | "whenever" | "only-when";
  alsSenseWhy: string;
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

export const ALS_ANALYSIS = analysis.cards as Record<string, AnalysisRecord>;
export const analysisFor = (cardId: string): AnalysisRecord | undefined => ALS_ANALYSIS[cardId];
/** A Dutch-first situation for cards that were written before Dutch prompts existed (including linked Everyday/Work sentences). */
export const situationEnFor = (cardId: string): string | undefined => ALS_ANALYSIS[cardId]?.situationEn;
export const situationNlFor = (cardId: string): string | undefined => ALS_ANALYSIS[cardId]?.situationNl;

/** The analysis in the shape the existing sentence-breakdown view already renders, plus the extra authored fields. */
export function analysisBreakdown(cardId: string): Breakdown | undefined {
  const record = ALS_ANALYSIS[cardId];
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
    alsSense: { sense: record.alsSense, why: record.alsSenseWhy },
  };
}
