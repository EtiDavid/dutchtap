import workplaceBreakdowns from "@/data/workplace-breakdowns.json";
import breakdowns from "@/data/grammar-breakdowns.json";
import frBreakdowns from "@/data/fr/grammar-breakdowns.json";
import type { Lang } from "@/lib/lang";
import { analysisBreakdown } from "@/lib/grammarAnalysis";

/**
 * A detailed, collapsible breakdown for every sentence: what the speaker is doing, the sentence cut into labelled parts (using its
 * actual words), why the word order is what it is, the forms that matter, an English comparison and one common mistake.
 * It sits beside the shorter rule and examples in grammar-notes.json; neither replaces the other.
 */
export type BreakdownPart = { label: string; text: string };
export type Breakdown = {
  meaning: string;
  parts: BreakdownPart[];
  order: string;
  /** Verb forms, endings, separable/reflexive pieces: "-" when nothing special applies. */
  forms: string;
  compare: string;
  mistake: { wrong: string; right: string; why: string; alternative?: boolean };
  /** French only: a one or two line English help for a beginner. The explanation itself is in simple French. */
  help?: string;
  practiceFocus?: string;
  practiceGuide?: string;
  /** Further genuine mistakes for the same sentence (each with its own explanation). */
  extraMistakes?: { wrong: string; right: string; why: string }[];
  /** The same plan expressed another way (for example main clause first), with why it differs. */
  contrast?: { dutch: string; english: string; note: string };
  /** Authored clause spans: which part is the main clause and which the subordinate clause, with each finite verb and why. */
  clauses?: { kind: "hoofdzin" | "bijzin"; text: string; subject: string; finite: string; why: string; afterFinite?: string }[];
  /** Which meaning of "als" this sentence uses, and why. */
  alsSense?: { sense: string; why: string };
};

export const BREAKDOWNS = { ...breakdowns, ...workplaceBreakdowns } as Record<string, Breakdown>;
export const FRENCH_BREAKDOWNS = frBreakdowns as Record<string, Breakdown>;
export const breakdownFor = (
  cardId: string,
  lang: Lang = "nl",
): Breakdown | undefined =>
  (lang === "nl" ? analysisBreakdown(cardId) : undefined) ??
  (lang === "fr" ? FRENCH_BREAKDOWNS : BREAKDOWNS)[cardId] ??
  (lang === "nl" && cardId.startsWith("pat-") && cardId.includes("-reuse-")
    ? BREAKDOWNS[cardId.split("-reuse-").slice(1).join("-reuse-")]
    : undefined);

/** The abstract pattern, e.g. "time phrase + finite verb + subject + direction". Position, not word count, defines the order. */
export const patternOf = (breakdown: Breakdown): string =>
  breakdown.parts.map((part) => part.label).join(" + ");
export const hasForms = (breakdown: Breakdown) =>
  breakdown.forms.trim() !== "" && breakdown.forms.trim() !== "-";
