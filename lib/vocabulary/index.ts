import entries from '@/data/vocabulary.json';
import { CARDS } from '@/lib/flashcards/engine';

export const VOCABULARY = entries;
export type VocabularyEntry = typeof entries[number];
const cardById = new Map(CARDS.map(card => [card.id, card]));

export function wordsForCard(cardId: string) {
  return VOCABULARY.filter(entry => entry.occurrences.some(occurrence => occurrence.cardId === cardId));
}

export function vocabularyExamples(entry: VocabularyEntry) {
  return entry.occurrences.flatMap(occurrence => {
    const card = cardById.get(occurrence.cardId);
    return card ? [{ card, form: occurrence.form }] : [];
  });
}

export function filterVocabulary(query: string, category: string, type: string, cardId = '') {
  const term = query.trim().toLocaleLowerCase('nl');
  return VOCABULARY.filter(entry =>
    (!term || [entry.headword, entry.english, entry.explanation].some(text => text.toLocaleLowerCase('nl').includes(term))) &&
    (type === 'all' || entry.type === type) &&
    (!cardId || entry.occurrences.some(occurrence => occurrence.cardId === cardId)) &&
    (category === 'all' || entry.occurrences.some(occurrence => cardById.get(occurrence.cardId)?.category === category))
  );
}
