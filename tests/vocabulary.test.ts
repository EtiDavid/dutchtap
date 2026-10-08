import { describe, expect, it } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { filterVocabulary, VOCABULARY, vocabularyExamples, wordsForCard } from '@/lib/vocabulary';

describe('sentence vocabulary', () => {
  it('has unique headwords and traces every example to an actual sentence', () => {
    expect(new Set(VOCABULARY.map(entry => entry.id)).size).toBe(VOCABULARY.length);
    for (const entry of VOCABULARY) {
      expect(entry.occurrences.length).toBeGreaterThan(0);
      expect(vocabularyExamples(entry)).toHaveLength(entry.occurrences.length);
      for (const occurrence of entry.occurrences) {
        const card = CARDS.find(card => card.id === occurrence.cardId)!;
        let from = 0;
        for (const part of occurrence.form.toLowerCase().split(' … ')) {
          const position = card.dutch.toLowerCase().indexOf(part, from);
          expect(position, `${entry.headword} in ${card.id}`).toBeGreaterThanOrEqual(from);
          from = position + part.length;
        }
      }
      expect(entry).not.toHaveProperty('image');
      expect(entry).not.toHaveProperty('audio');
      if (entry.type !== 'noun') { expect(entry.article).toBe(''); expect(entry.plural).toBe(''); }
    }
  });
  it('finds dictionary forms, English meanings and simple Dutch explanations', () => {
    expect(filterVocabulary('OP SLOT', 'all', 'all').map(entry => entry.id)).toContain('op-slot-doen');
    expect(filterVocabulary('tidy', 'all', 'all').map(entry => entry.id)).toContain('opruimen');
    expect(filterVocabulary('netjes', 'all', 'all').map(entry => entry.id)).toContain('opruimen');
    expect(filterVocabulary('  ', 'all', 'all')).toHaveLength(VOCABULARY.length);
  });
  it('combines filters and links card words in both directions', () => {
    expect(filterVocabulary('', 'school', 'verb').every(entry => entry.type === 'verb')).toBe(true);
    expect(filterVocabulary('overstappen', 'home', 'all')).toEqual([]);
    expect(wordsForCard('home-03').map(entry => entry.headword)).toContain('op slot doen');
    expect(filterVocabulary('', 'all', 'all', 'home-03')).toEqual(wordsForCard('home-03'));
  });
});
