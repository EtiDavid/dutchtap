import notes from '@/data/grammar-notes.json';
import frNotes from '@/data/fr/grammar-notes.json';
import type { Lang } from '@/lib/lang';

/** The notes as stored for Dutch: examples use `dutch`. */
export type GrammarNote = { rule: string; examples: { dutch: string; english: string }[] };
// One explanation (the rule) plus 2-3 similar example sentences for every flashcard sentence.
export const GRAMMAR_NOTES = notes as Record<string, GrammarNote>;

/** French notes: a rule in simple French, a short English help line, and examples in `text`. */
export type FrenchNote = { rule: string; help: string; examples: { text: string; english: string }[] };
export const FRENCH_NOTES = frNotes as Record<string, FrenchNote>;

/** A note in the shape every screen uses, whatever the language. */
export type LNote = { rule: string; help?: string; examples: { text: string; english: string }[] };

export function notesFor(cardId: string): GrammarNote | undefined;
export function notesFor(cardId: string, lang: Lang): LNote | undefined;
export function notesFor(cardId: string, lang?: Lang): GrammarNote | LNote | undefined {
  if (lang === undefined) return GRAMMAR_NOTES[cardId];
  if (lang === 'fr') return FRENCH_NOTES[cardId];
  const note = GRAMMAR_NOTES[cardId];
  return note && { rule: note.rule, examples: note.examples.map(example => ({ text: example.dutch, english: example.english })) };
}
