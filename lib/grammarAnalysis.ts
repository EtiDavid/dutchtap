import analysis from "@/data/grammar-als-analysis.json";
import omdatAnalysis from "@/data/grammar-omdat-analysis.json";
import datAnalysis from "@/data/grammar-dat-analysis.json";
import toenAnalysis from "@/data/grammar-toen-analysis.json";
import wanneerAnalysis from "@/data/grammar-wanneer-analysis.json";
import inversionAnalysis from "@/data/grammar-inversion-analysis.json";
import separableAnalysis from "@/data/grammar-separable-analysis.json";
import tenseAnalysis from "@/data/grammar-tense-analysis.json";
import verbsAnalysis from "@/data/grammar-verbs-analysis.json";
import totAnalysis from "@/data/grammar-tot-analysis.json";
import terwijlAnalysis from "@/data/grammar-terwijl-analysis.json";
import voordatAnalysis from "@/data/grammar-voordat-analysis.json";
import nadatAnalysis from "@/data/grammar-nadat-analysis.json";
import zodraAnalysis from "@/data/grammar-zodra-analysis.json";
import ofAnalysis from "@/data/grammar-of-analysis.json";
import hoewelAnalysis from "@/data/grammar-hoewel-analysis.json";
import connectorsAnalysis from "@/data/grammar-connectors-analysis.json";
import exceptionsAnalysis from "@/data/grammar-exceptions-analysis.json";
import indirectAnalysis from "@/data/grammar-indirect-analysis.json";
import relativeAnalysis from "@/data/grammar-relative-analysis.json";
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
  /** Default "subordinate". "coordinate" marks a contrast made of two main clauses (for example want); "demonstrative" a single main clause where the key word is a pointing word, an adverb (toen = then) or a question word (wanneer = when); "inverted" a single main clause that begins with a fronted element so the finite verb stays second and the subject follows it; "split" a main clause where a separable verb is cut in two (finite verb second, particle later); "joined" a single main clause whose separable verb stays in one piece (participle, infinitive); "tense" a single main clause whose verb form is the point (tense, auxiliary and participle, modal and infinitive, fixed preposition, reflexive pronoun); "relative" a relative clause inside or after a main clause. */
  pattern?: "subordinate" | "coordinate" | "demonstrative" | "relative" | "inverted" | "split" | "joined" | "tense";
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
export const TOEN_ANALYSIS = toenAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const WANNEER_ANALYSIS = wanneerAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const INVERSION_ANALYSIS = inversionAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const SEPARABLE_ANALYSIS = separableAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const TENSE_ANALYSIS = tenseAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const VERBS_ANALYSIS = verbsAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const TOT_ANALYSIS = totAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const TERWIJL_ANALYSIS = terwijlAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const VOORDAT_ANALYSIS = voordatAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const NADAT_ANALYSIS = nadatAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const ZODRA_ANALYSIS = zodraAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const OF_ANALYSIS = ofAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const HOEWEL_ANALYSIS = hoewelAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const CONNECTORS_ANALYSIS = connectorsAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const EXCEPTIONS_ANALYSIS = exceptionsAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const INDIRECT_ANALYSIS = indirectAnalysis.cards as unknown as Record<string, AnalysisRecord>;
export const RELATIVE_ANALYSIS = relativeAnalysis.cards as unknown as Record<string, AnalysisRecord>;
/** Every authored sentence analysis, whatever its topic. Ids are unique across topics. */
export const GRAMMAR_ANALYSIS: Record<string, AnalysisRecord> = { ...ALS_ANALYSIS, ...OMDAT_ANALYSIS, ...DAT_ANALYSIS, ...TOEN_ANALYSIS, ...WANNEER_ANALYSIS, ...INVERSION_ANALYSIS, ...SEPARABLE_ANALYSIS, ...TENSE_ANALYSIS, ...VERBS_ANALYSIS, ...TOT_ANALYSIS, ...TERWIJL_ANALYSIS, ...VOORDAT_ANALYSIS, ...NADAT_ANALYSIS, ...ZODRA_ANALYSIS, ...OF_ANALYSIS, ...HOEWEL_ANALYSIS, ...INDIRECT_ANALYSIS, ...RELATIVE_ANALYSIS, ...CONNECTORS_ANALYSIS, ...EXCEPTIONS_ANALYSIS };
export const analysisFor = (cardId: string): AnalysisRecord | undefined => GRAMMAR_ANALYSIS[cardId];
/** A Dutch-first situation for cards that were written before Dutch prompts existed (including linked Everyday/Work sentences). */
export const situationEnFor = (cardId: string): string | undefined => GRAMMAR_ANALYSIS[cardId]?.situationEn;
export const situationNlFor = (cardId: string): string | undefined => GRAMMAR_ANALYSIS[cardId]?.situationNl;

/** The analysis in the shape the existing sentence-breakdown view already renders, plus the extra authored fields. */
const BREAKDOWN_CACHE = new Map<string, Breakdown | undefined>();
export function analysisBreakdown(cardId: string): Breakdown | undefined {
  if (BREAKDOWN_CACHE.has(cardId)) return BREAKDOWN_CACHE.get(cardId);
  const built = buildBreakdown(cardId);
  BREAKDOWN_CACHE.set(cardId, built);
  return built;
}
function buildBreakdown(cardId: string): Breakdown | undefined {
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
