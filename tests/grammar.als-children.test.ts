import { describe, expect, it } from 'vitest';
import families from '@/data/grammar-variation-families.json';
import { CARDS } from '@/lib/flashcards/engine';
import { cardFor } from '@/lib/content/cards';
import { variationCard } from '@/lib/variations/content';

type Child = { id: string; parentId: string; text: string; english: string; scenario: string; scenarioNl: string; explanation: string; example: { text: string; english: string } };
const entries = Object.entries(families as Record<string, Child[]>);
const key = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

describe('ALS interactive children', () => {
  it('belong to ALS grammar cards, ten each, with stable ids', () => {
    expect(entries.length).toBeGreaterThanOrEqual(10);
    for (const [parent, kids] of entries) {
      expect(cardFor('nl', parent)?.category, parent).toBe('als');
      expect(kids, parent).toHaveLength(10);
      kids.forEach((kid, i) => { expect(kid.id).toBe(`${parent}~v${String(i + 1).padStart(2, '0')}`); expect(kid.parentId).toBe(parent); });
    }
  });
  it('are distinct sentences: not repeated within the family, across families, or as another playable card', () => {
    const seen = new Map<string, string>();
    const cards = new Set(CARDS.map(c => key(c.dutch)));
    for (const [, kids] of entries) for (const kid of kids) {
      const k = key(kid.text);
      expect(seen.get(k), `${kid.id} repeats ${seen.get(k)}`).toBeUndefined();
      seen.set(k, kid.id);
      expect(cards.has(k), `${kid.id} duplicates a playable card`).toBe(false);
    }
  });
  it('each use als, have their own Dutch-first situation without a conjunction cue, and a specific explanation', () => {
    const explanations = new Set<string>();
    for (const [parent, kids] of entries) for (const kid of kids) {
      expect(kid.text.toLowerCase(), kid.id).toMatch(/\bals\b/);
      expect(kid.scenarioNl, kid.id).toBeTruthy();
      expect(kid.scenarioNl, kid.id).not.toMatch(/\b(als|wanneer|zodra|toen)\b/i);
      expect(kid.scenario.length, kid.id).toBeGreaterThan(20);
      expect(kid.explanation.length, kid.id).toBeGreaterThan(90);
      expect(explanations.has(kid.explanation), `${kid.id} repeats an explanation`).toBe(false);
      explanations.add(kid.explanation);
      expect(kid.english.length).toBeGreaterThan(10);
      expect(kid.example.text).not.toBe(kid.text);
      expect(variationCard(kid.id)?.scenarioNl, kid.id).toBe(kid.scenarioNl);
      expect(parent).toBe(kid.parentId);
    }
  });
  it('vary the construction inside a family (fronted and main-first, negation, plural, past, modal, imperative where natural)', () => {
    for (const [parent, kids] of entries) {
      const fronted = kids.filter(k => /^(vroeger )?als\b/i.test(k.text) || /^(als|pas als)\b/i.test(k.text)).length;
      expect(fronted, parent).toBeGreaterThanOrEqual(2);
      expect(kids.length - fronted, parent).toBeGreaterThanOrEqual(2);
      expect(new Set(kids.map(k => k.text.split(/\s+/)[0].toLowerCase())).size, parent).toBeGreaterThanOrEqual(2);
    }
  });
});
