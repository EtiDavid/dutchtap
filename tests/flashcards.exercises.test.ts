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
  it('preserves Dutch contractions and supports new long/short sentences without changing legacy limits', () => {
    const clock = CARDS.find(c => c.dutch.includes("'s ochtends"))!;
    expect(buildOrder(clock, '')!.answer).toContain("'s");
    expect(buildOrder(CARDS.find(c => c.dutch === 'Graag gedaan.')!, '')).not.toBeNull();
    expect(buildOrder(CARDS.find(c => c.id === 'school-09')!, '')).not.toBeNull();
  });
  it('accepts polite hebben alternatives and excludes them from distractors', () => {
    const card = CARDS.find(c => c.id === 'shopping-05')!;
    for (let seed = 0; seed < 50; seed++) {
      const e = buildBlank(card, String(seed))!;
      expect(e.answer).toBe('Heeft');
      expect(isBlankCorrect(e, 'Heeft')).toBe(true);
      expect(isBlankCorrect(e, 'Hebt')).toBe(true);
      expect(e.options).not.toContain('Hebt');
      expect(isBlankCorrect(e, 'Hebben')).toBe(false);
    }
  });
  it('accepts reviewed kunnen variants for polite and informal you', () => {
    const polite = buildBlank(CARDS.find(c => c.id === 'school-01')!, '')!;
    expect(isBlankCorrect(polite, 'Kan')).toBe(true);
    expect(isBlankCorrect(polite, 'Kun')).toBe(false);
    const informalCard = CARDS.find(c => c.id === 'conversation-02')!;
    const informal = Array.from({ length: 50 }, (_, seed) => buildBlank(informalCard, String(seed))!).find(e => e.answer === 'Kun')!;
    expect(isBlankCorrect(informal, 'Kan')).toBe(true);
    expect(isBlankCorrect(informal, 'Kunt')).toBe(false);
  });
});
