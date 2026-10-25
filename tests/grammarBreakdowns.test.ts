import { describe, expect, it } from 'vitest';
import { CORE_CARDS } from '@/lib/flashcards/engine';
import { BREAKDOWNS, breakdownFor, hasForms, patternOf } from '@/lib/grammarBreakdowns';

const words = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, ' ').replace(/’/g, "'").split(/\s+/).filter(Boolean);

describe('sentence breakdowns', () => {
  it('has exactly one breakdown for every sentence', () => {
    expect(Object.keys(BREAKDOWNS).sort()).toEqual(CORE_CARDS.map(c => c.id).sort());
  });
  it('cuts each sentence into labelled parts that rebuild exactly that sentence, in order', () => {
    for (const card of CORE_CARDS) {
      const breakdown = breakdownFor(card.id)!;
      expect(breakdown.parts.length, card.id).toBeGreaterThanOrEqual(2);
      expect(words(breakdown.parts.map(p => p.text).join(' ')), card.id).toEqual(words(card.dutch));
      for (const part of breakdown.parts) { expect(part.label.length, card.id).toBeGreaterThan(2); expect(part.text.length, card.id).toBeGreaterThan(0); }
    }
  });
  it('explains meaning, order, English comparison and a common mistake for every sentence', () => {
    for (const card of CORE_CARDS) {
      const b = breakdownFor(card.id)!;
      expect(b.meaning.length, card.id).toBeGreaterThan(10);
      expect(b.order.length, card.id).toBeGreaterThan(60);
      expect(b.compare.length, card.id).toBeGreaterThan(40);
      expect(b.forms.length, card.id).toBeGreaterThan(0);
      expect(b.mistake.wrong.length, card.id).toBeGreaterThan(3);
      expect(b.mistake.right.length, card.id).toBeGreaterThan(3);
      expect(b.mistake.why.length, card.id).toBeGreaterThan(10);
      expect(b.mistake.wrong, card.id).not.toBe(b.mistake.right);
    }
  });
  it('uses a consistent, small set of part labels', () => {
    const labels = new Set(Object.values(BREAKDOWNS).flatMap(b => b.parts.map(p => p.label)));
    expect(labels.size).toBeLessThanOrEqual(60);
    for (const label of ['subject', 'finite verb', 'object']) expect(labels.has(label)).toBe(true);
  });
  it('describes the actual pattern, such as a fronted time phrase followed by the verb and then the subject', () => {
    const home07 = breakdownFor('home-07')!;
    expect(patternOf(home07)).toBe('time phrase + finite verb + subject + direction');
    expect(home07.parts.map(p => p.text)).toEqual(['Na het werk', 'fiets', 'ik', 'naar huis']);
    expect(home07.order).toMatch(/verb/);
  });
  it('treats "-" as nothing special to show for forms', () => {
    expect(hasForms({ ...breakdownFor('home-07')!, forms: '-' })).toBe(false);
    expect(hasForms(breakdownFor('home-07')!)).toBe(true);
  });
  it('keeps the shorter rule and examples alongside it (nothing was removed)', async () => {
    const { GRAMMAR_NOTES } = await import('@/lib/grammarNotes');
    for (const card of CORE_CARDS) expect(GRAMMAR_NOTES[card.id], card.id).toBeDefined();
  });
  it('contains no leftover drafting markers', () => {
    expect(JSON.stringify(BREAKDOWNS)).not.toMatch(/TODO|\?\?\?|see note/i);
  });
});

describe('why the word order is what it is', () => {
  const orderOf = (id: string) => breakdownFor(id)!.order;
  it('names the principle that applies, using the sentence’s own words', () => {
    expect(orderOf('shopping-01')).toMatch(/question/i);
    expect(orderOf('shopping-03')).toMatch(/yes\/no question/);
    expect(orderOf('school-08')).toMatch(/inversion/);
    expect(orderOf('school-09')).toMatch(/omdat/);
    expect(orderOf('home-09')).toMatch(/particle \(op\)|particle op/);
    expect(orderOf('conversation-48')).toMatch(/imperative/);
    expect(orderOf('shopping-05')).toMatch(/Heeft/);
  });
  it('explains second position as the second constituent, not the second word, where a phrase comes first', () => {
    expect(orderOf('home-07')).toMatch(/constituent|first position|verb is always second/);
    expect(orderOf('transport-05')).toMatch(/Hoe laat/); // a two-word question phrase is still ONE first constituent
  });
  it('gives every sentence a real reason rather than only a list of positions', () => {
    for (const card of CORE_CARDS) expect(orderOf(card.id), card.id).toMatch(/verb|question|imperative|phrase|subject|noun|comes first|clause|auxiliary|participle|infinitive|particle/i);
  });
});
