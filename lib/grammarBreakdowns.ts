import breakdowns from '@/data/grammar-breakdowns.json';
import frBreakdowns from '@/data/fr/grammar-breakdowns.json';
import type { Lang } from '@/lib/lang';

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
  mistake: { wrong: string; right: string; why: string };
  /** French only: a one or two line English help for a beginner. The explanation itself is in simple French. */
  help?: string;
};

export const BREAKDOWNS = breakdowns as Record<string, Breakdown>;
export const FRENCH_BREAKDOWNS = frBreakdowns as Record<string, Breakdown>;
export const breakdownFor = (cardId: string, lang: Lang = 'nl'): Breakdown | undefined => (lang === 'fr' ? FRENCH_BREAKDOWNS : BREAKDOWNS)[cardId];

/** The abstract pattern, e.g. "time phrase + finite verb + subject + direction". Position, not word count, defines the order. */
export const patternOf = (breakdown: Breakdown): string => breakdown.parts.map(part => part.label).join(' + ');
export const hasForms = (breakdown: Breakdown) => breakdown.forms.trim() !== '' && breakdown.forms.trim() !== '-';
