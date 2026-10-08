import { describe, expect, it } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { GRAMMAR_NOTES, notesFor } from '@/lib/grammarNotes';

describe('grammar notes', () => {
  it('has exactly one note for every sentence', () => {
    expect(Object.keys(GRAMMAR_NOTES).sort()).toEqual(CARDS.map(c => c.id).sort());
  });
  it('gives each sentence a rule and 2-3 similar examples with English', () => {
    for (const card of CARDS) {
      const note = notesFor(card.id)!;
      expect(note.rule.length, card.id).toBeGreaterThan(30);
      expect(note.examples.length, card.id).toBeGreaterThanOrEqual(2);
      expect(note.examples.length, card.id).toBeLessThanOrEqual(3);
      for (const example of note.examples) {
        expect(example.dutch.length, card.id).toBeGreaterThan(3);
        expect(example.english.length, card.id).toBeGreaterThan(3);
      }
    }
  });
  it('does not repeat the sentence itself or the variation as an example, and has no duplicate examples', () => {
    for (const card of CARDS) {
      const dutch = notesFor(card.id)!.examples.map(e => e.dutch);
      expect(dutch, card.id).not.toContain(card.dutch);
      expect(dutch, card.id).not.toContain(card.variation);
      expect(new Set(dutch).size, card.id).toBe(dutch.length);
    }
  });
  it('contains no leftover drafting markers', () => {
    expect(JSON.stringify(GRAMMAR_NOTES)).not.toMatch(/see note|TODO|\?\?\?/i);
  });
});
