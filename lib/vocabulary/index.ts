import workplaceEntries from '@/data/workplace-vocabulary.json';
import workplaceLinks from '@/data/workplace-vocabulary-links.json';
import entries from '@/data/vocabulary.json';
import frEntries from '@/data/fr/vocabulary.json';
import { cardFor, type LCard } from '@/lib/content/cards';
import type { Lang } from '@/lib/lang';

const addedLinks = new Map((workplaceLinks as { id: string; occurrencesToAppend: { cardId: string; form: string }[] }[]).map(x => [x.id, x.occurrencesToAppend]));
export const VOCABULARY: (typeof entries[number])[] = [...entries.map(entry => ({ ...entry,
  occurrences: [...entry.occurrences, ...(addedLinks.get(entry.id) ?? [])] })), ...workplaceEntries];
export type DutchVocabularyEntry = typeof entries[number];
/** A French entry: `gender` (m/f) is kept even when the article is elided (l'école), `article` is le/la/les/'' . */
export type FrenchVocabularyEntry = DutchVocabularyEntry & { gender?: 'm' | 'f' | '' };
export type VocabularyEntry = DutchVocabularyEntry | FrenchVocabularyEntry;
export const FRENCH_VOCABULARY = frEntries as FrenchVocabularyEntry[];

/** The text-only word list for a language. */
export const vocabularyFor = (lang: Lang): VocabularyEntry[] => (lang === 'fr' ? FRENCH_VOCABULARY : VOCABULARY);

export function wordsForCard(cardId: string, lang: Lang = 'nl') {
  return vocabularyFor(lang).filter(entry => entry.occurrences.some(occurrence => occurrence.cardId === cardId));
}

export function vocabularyExamples(entry: VocabularyEntry, lang: Lang = 'nl'): { card: LCard; form: string }[] {
  return entry.occurrences.flatMap(occurrence => {
    const card = cardFor(lang, occurrence.cardId);
    return card ? [{ card, form: occurrence.form }] : [];
  });
}

// French search ignores accents (ecole finds école) and typographic apostrophes; Dutch search is unchanged.
const fold = (text: string, lang: Lang) => {
  const lower = text.toLocaleLowerCase(lang);
  return lang === 'fr' ? lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/œ/g, 'oe') : lower;
};

export function filterVocabulary(query: string, category: string, type: string, cardId = '', lang: Lang = 'nl') {
  const term = fold(query.trim(), lang);
  return vocabularyFor(lang).filter(entry =>
    (!term || [entry.headword, entry.english, entry.explanation].some(text => fold(text, lang).includes(term))) &&
    (type === 'all' || entry.type === type) &&
    (!cardId || entry.occurrences.some(occurrence => occurrence.cardId === cardId)) &&
    (category === 'all' || entry.occurrences.some(occurrence => cardFor(lang, occurrence.cardId)?.category === category))
  );
}
