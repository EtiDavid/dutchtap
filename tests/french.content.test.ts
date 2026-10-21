import { describe, expect, it } from 'vitest';
import { EVERYDAY_CARDS as CARDS } from '@/lib/flashcards/engine';
import { cardFor, cardsFor, hasContent } from '@/lib/content/cards';
import { breakdownFor } from '@/lib/grammarBreakdowns';
import { notesFor } from '@/lib/grammarNotes';
import { FRENCH_VOCABULARY, wordsForCard } from '@/lib/vocabulary';
import { answerText, isOrderAnswerCorrect, sentenceTokens, tokenId } from '@/lib/sessions/wordOrder';

const fr = cardsFor('fr');
const fold = (text: string) => text.normalize('NFC').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

describe('French content: all 600 sentences', () => {
  it('has a French sentence for every shared card, with the shared situation and picture', () => {
    expect(fr).toHaveLength(600);
    for (const card of CARDS) {
      const f = cardFor('fr', card.id)!;
      expect(f, card.id).toBeDefined();
      expect(hasContent('fr', card.id)).toBe(true);
      expect(f.image).toBe(card.image);
      expect(f.audio, `${card.id} has no French recording`).toBeUndefined();
      expect(f.english.length, card.id).toBeGreaterThan(3);
      expect(f.variation.length, card.id).toBeGreaterThan(3);
      expect(f.variationEnglish, card.id).toBeTruthy();
    }
    expect(new Set(fr.map(c => fold(c.text).toLowerCase())).size).toBeGreaterThan(590);
  });
  it('leaves no authoring markers behind', () => {
    for (const c of fr) for (const s of [c.text, c.english, c.variation, c.scenario, c.cue]) expect(s, c.id).not.toMatch(/TODO|FIXME|\?\?\?|\{|\}/);
  });
  it('has no Dutch wording in the situation shown to French learners', () => {
    for (const c of fr) expect(`${c.scenario} ${c.cue}`, c.id).not.toMatch(/\bDutch\b/);
  });
  it('has a French register on every card', () => {
    for (const c of fr) expect(['tu', 'vous', 'neutral'], c.id).toContain(c.review?.register);
  });
});

describe('French grammar notes and breakdowns', () => {
  it('has a note with 2 to 3 distinct, translated examples for every card', () => {
    for (const c of fr) {
      const n = notesFor(c.id, 'fr')!;
      expect(n, c.id).toBeDefined();
      expect(n.rule.length, c.id).toBeGreaterThan(10);
      expect(n.examples.length, c.id).toBeGreaterThanOrEqual(2);
      expect(n.examples.length, c.id).toBeLessThanOrEqual(3);
      expect(new Set(n.examples.map(e => fold(e.text))).size, c.id).toBe(n.examples.length);
      for (const e of n.examples) { expect(e.english, c.id).toBeTruthy(); expect(fold(e.text), c.id).not.toBe(fold(c.text)); }
    }
  });
  it('has a breakdown whose parts rebuild the sentence and whose mistake is a real mistake', () => {
    for (const c of fr) {
      const b = breakdownFor(c.id, 'fr')!;
      expect(b, c.id).toBeDefined();
      expect(b.parts.length, c.id).toBeGreaterThanOrEqual(2);
      expect(b.parts.length, c.id).toBeLessThanOrEqual(12);
      const joined = b.parts.map(p => p.text).join(' ').replace(/([’-]) /g, '$1').replace(/ -/g, '-');
      const plain = (t: string) => fold(t).replace(/[,;:.?!«»]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      expect(plain(joined), c.id).toBe(plain(c.text));
      expect(b.mistake.wrong, c.id).not.toBe(b.mistake.right);
      expect(b.mistake.why.length, c.id).toBeGreaterThan(5);
      expect(b.help, c.id).toBeTruthy();
    }
  });
});

describe('French vocabulary', () => {
  it('is derived from the sentences: every link resolves and the form occurs in a linked sentence', () => {
    const ids = new Set(FRENCH_VOCABULARY.map(v => v.id));
    expect(ids.size).toBe(FRENCH_VOCABULARY.length);
    for (const c of fr) {
      expect(c.vocabularyIds.length, c.id).toBeGreaterThan(0);
      for (const id of c.vocabularyIds) expect(ids.has(id), `${c.id}:${id}`).toBe(true);
      expect(wordsForCard(c.id, 'fr').length).toBe(c.vocabularyIds.length);
    }
    const linked = new Set(fr.flatMap(c => c.vocabularyIds));
    for (const v of FRENCH_VOCABULARY) { expect(linked.has(v.id), v.id).toBe(true); expect(v.headword && v.english, v.id).toBeTruthy(); }
  });
  it('gives nouns a French article and gender', () => {
    for (const v of FRENCH_VOCABULARY.filter(e => e.type === 'noun')) {
      expect(['m', 'f'], v.id).toContain(v.gender);
      expect(["le", "la", "l’", "les"], v.id).toContain(v.article);
    }
  });
});

describe('French word-order tokens', () => {
  it('keeps elisions, hyphens and accents together', () => {
    expect(sentenceTokens('J’habite à Liège.', 'fr')).toEqual(['j’habite', 'à', 'Liège']);
    expect(sentenceTokens('Où puis-je trouver l’école aujourd’hui ?', 'fr')).toEqual(['où', 'puis-je', 'trouver', 'l’école', 'aujourd’hui']);
    expect(sentenceTokens('Est-ce qu’il vient ?', 'fr')).toEqual(['est-ce', 'qu’il', 'vient']);
  });
  it('grades by token identity so repeated words work and the right order passes', () => {
    const text = 'Il a dit que oui, que oui.';
    const t = sentenceTokens(text, 'fr');
    const ids = t.map((_, i) => tokenId(i));
    expect(isOrderAnswerCorrect(text, ids, 'fr')).toBe(true);
    expect(isOrderAnswerCorrect(text, [...ids].reverse(), 'fr')).toBe(false);
    expect(answerText(text, ids, 'fr')).toBe(t.join(' '));
  });
  it('every French sentence can be tokenised and has the same words in the same order', () => {
    for (const c of fr) {
      const t = sentenceTokens(c.text, 'fr');
      expect(t.length, c.id).toBeGreaterThan(0);
      for (const w of t) expect(w, c.id).not.toMatch(/^[.,;:!?«»]|[.,;:!?«»]$/);
    }
  });
});
