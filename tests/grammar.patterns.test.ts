import { describe, expect, it } from 'vitest';
import { CARDS, CORE_CARDS, GRAMMAR_CARDS } from '@/lib/flashcards/engine';
import { GRAMMAR_AREAS, collectionAvailable, topicsFor, validTopic } from '@/lib/content/collections';
import { cardFor, cardsFor } from '@/lib/content/cards';
import { GRAMMAR_NOTES } from '@/lib/grammarNotes';
import { checkCreation, createSession, eligibleIds, levelCounts } from '@/lib/sessions/engine';
import { newSessionSchema } from '@/lib/sessions/types';
import { buildOrder } from '@/lib/flashcards/exercises';

describe('Grammar patterns collection', () => {
  it('adds many sentences to every pattern, each a complete flashcard with a situation, explanation and word-order quiz', () => {
    expect(GRAMMAR_CARDS.length).toBeGreaterThanOrEqual(180);
    expect(CARDS.length).toBe(CORE_CARDS.length + GRAMMAR_CARDS.length);
    expect(new Set(CARDS.map(c => c.id)).size).toBe(CARDS.length);
    for (const topic of Object.keys(GRAMMAR_AREAS)) {
      const minimum = ['wanneer', 'terwijl', 'voordat', 'nadat'].includes(topic) ? 12 : 14;
      expect(GRAMMAR_CARDS.filter(c => c.category === topic).length, topic).toBeGreaterThanOrEqual(minimum);
    }
    for (const topic of ['inversion', 'omdat', 'dat', 'als', 'tot', 'toen']) expect(GRAMMAR_CARDS.filter(c => c.category === topic).length, topic).toBeGreaterThanOrEqual(19);
    // Authored pattern cards have generated notes and no media. Linked Core cards are tested separately.
    for (const card of GRAMMAR_CARDS.filter(c => !c.originCardId)) {
      expect(card.collection).toBe('grammar');
      expect(card.id).toMatch(/^pat-[a-z]+-\d{2,3}$/);
      expect(card.scenario.length, card.id).toBeGreaterThan(20);
      expect(card.scenario.toLowerCase(), card.id).not.toContain(card.dutch.toLowerCase());
      expect(card.image, card.id).toBe('');
      expect(card.imageStatus).toBe('not-applicable');
      expect(card.audioStatus).toBe('device');
      expect(buildOrder(card, 'seed'), card.id).not.toBeNull();
      const note = GRAMMAR_NOTES[card.id];
      expect(note.rule.length, card.id).toBeGreaterThan(30);
      expect(note.examples.length, card.id).toBeGreaterThanOrEqual(10);
      expect(note.examples.map(e => e.dutch), card.id).not.toContain(card.dutch);
      expect(note.examples.map(e => e.dutch), card.id).not.toContain(card.variation);
      expect(new Set(note.examples.map(e => e.dutch)).size).toBe(note.examples.length);
    }
  });
  it('puts each conjunction pattern into the sentence: als, omdat, dat, tot and toen sentences use their word', () => {
    for (const topic of ['als', 'omdat', 'tot', 'toen'] as const) {
      const bad = GRAMMAR_CARDS.filter(c => c.category === topic && !new RegExp(`\\b${topic}\\b`, 'i').test(c.dutch));
      expect(bad.map(c => c.dutch), topic).toEqual([]);
    }
    const dat = GRAMMAR_CARDS.filter(c => c.category === 'dat');
    expect(dat.filter(c => !/\bdat\b/i.test(c.dutch)).map(c => c.dutch)).toEqual([]);
  });
  it('is a Dutch-only collection with its own patterns, and French sessions can never include it', () => {
    expect(collectionAvailable('fr', 'grammar')).toBe(false);
    expect(collectionAvailable('nl', 'grammar')).toBe(true);
    expect(validTopic('grammar', 'als')).toBe(true);
    expect(validTopic('grammar', 'shopping')).toBe(false);
    expect(Object.keys(topicsFor('grammar'))).toEqual(Object.keys(GRAMMAR_AREAS));
    expect(cardFor('fr', GRAMMAR_CARDS[0].id)).toBeUndefined();
    expect(cardsFor('fr').some(c => c.collection === 'grammar')).toBe(false);
    expect(eligibleIds('als', 'difficult', {}, 'fr', 'grammar')).toEqual([]);
  });
  it('creates a session from one pattern with only that pattern’s sentences, and rejects mixed or unknown membership', () => {
    const counts = levelCounts('als', {}, 'nl', 'grammar');
    expect(counts.difficult).toBeGreaterThanOrEqual(19);
    expect(checkCreation({ topic: 'als', count: 10, level: 'difficult', lang: 'nl', collection: 'grammar' }, {}, 0)).toEqual({ ok: true });
    const session = createSession({ topic: 'als', count: 10, level: 'difficult', lang: 'nl', collection: 'grammar', reviews: {} })!;
    expect(session.collection).toBe('grammar');
    expect(session.cardIds).toHaveLength(10);
    expect(session.cardIds.every(id => id.startsWith('pat-als-'))).toBe(true);
    expect(newSessionSchema.safeParse(session).success).toBe(true);
    const mixed = { ...session, cardIds: [...session.cardIds.slice(0, 9), 'pat-omdat-01'], cards: { ...session.cards, 'pat-omdat-01': session.cards[session.cardIds[9]] } };
    delete (mixed.cards as Record<string, unknown>)[session.cardIds[9]];
    expect(newSessionSchema.safeParse(mixed).success).toBe(false);
    expect(createSession({ topic: 'als', count: 10, level: 'difficult', lang: 'fr', collection: 'grammar', reviews: {} })).toBeNull();
    // Everyday sessions are unaffected: places still contain only everyday sentences.
    expect(eligibleIds('all', 'difficult', {}, 'nl', 'everyday').every(id => !id.startsWith('pat-'))).toBe(true);
  });
});
