import notes from '@/data/grammar-notes.json';

export type GrammarNote = { rule: string; examples: { dutch: string; english: string }[] };

// One explanation (the rule) plus 2-3 similar example sentences for every flashcard sentence.
export const GRAMMAR_NOTES = notes as Record<string, GrammarNote>;
export const notesFor = (cardId: string): GrammarNote | undefined => GRAMMAR_NOTES[cardId];
