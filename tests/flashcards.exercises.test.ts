import { describe, expect, it } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { buildBlank, buildExercise, buildOrder, isBlankCorrect, isOrderCorrect } from '@/lib/flashcards/exercises';

describe('active-recall exercises', () => {
  it('builds a word-order exercise that is a shuffled copy of the sentence', () => {
    const card = CARDS.find(c => c.id === 'shopping-01')!;
    const e = buildOrder(card, 'a')!;
    expect(e.answer).toEqual(['waar', 'kan', 'ik', 'de', 'melk', 'vinden']);
    expect([...e.words].sort()).toEqual([...e.answer].sort());
    expect(e.words).not.toEqual(e.answer);
    expect(isOrderCorrect(e, e.answer)).toBe(true);
    expect(isOrderCorrect(e, e.words)).toBe(false);
  });
  it('is deterministic for the same seed', () => {
    const card = CARDS[0];
    expect(buildOrder(card, 'x')).toEqual(buildOrder(card, 'x'));
    expect(buildBlank(card, 'x')).toEqual(buildBlank(card, 'x'));
  });
  it('blanks one word, keeps the answer among the options, and rebuilds the sentence', () => {
    for (const card of CARDS) {
      const e = buildBlank(card, '');
      if (!e) continue;
      expect(e.options).toContain(e.answer);
      expect(new Set(e.options).size).toBe(e.options.length);
      expect(e.options.length).toBeGreaterThan(1);
      expect(e.before + e.answer + e.after).toBe(card.dutch);
      expect(isBlankCorrect(e, e.answer)).toBe(true);
    }
  });
  it('blanks the verb form that agrees with its subject', () => {
    const card = CARDS.find(c => c.id === 'school-01')!; // Kunt u dat nog eens uitleggen?
    const e = buildBlank(card, '')!;
    expect(e.answer).toBe('Kunt');
    expect(e.options.every(o => o[0] === o[0].toUpperCase())).toBe(true);
    expect(e.options).not.toContain('Kan');
  });
  it('can produce an exercise for every card', () => {
    for (const card of CARDS) expect(buildExercise(card, 'blank')).not.toBeNull();
  });
});
