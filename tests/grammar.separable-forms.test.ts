import { describe, expect, it } from 'vitest';
import verbs from '@/data/editorial/grammar-separable-verbs.json';
import { SEPARABLE_FORMS, separableFormsFor, separableLemmaOf } from '@/lib/separableForms';
import { GRAMMAR_CARDS } from '@/lib/flashcards/engine';

const tokens = (text: string) => text.toLowerCase().replace(/[^\p{L}' -]/gu, ' ').split(/\s+/).filter(Boolean);
const PREFIXED_BASES = new Set(['bereiden']); // an unstressed prefix means no ge- in the participle

describe('separable verb forms', () => {
  it('has a forms record for every verb in the dictionary and no others', () => {
    expect(Object.keys(SEPARABLE_FORMS).sort()).toEqual(verbs.map(v => v.lemma).sort());
    expect(verbs.length).toBeGreaterThanOrEqual(60);
  });
  it('keeps every record consistent with the separable-verb rules', () => {
    for (const f of Object.values(SEPARABLE_FORMS)) {
      expect(f.lemma, f.lemma).toBe(f.particle + f.base);
      expect(f.participle.startsWith(f.particle), f.lemma).toBe(true);
      const rest = f.participle.slice(f.particle.length);
      expect(rest.startsWith('ge'), `${f.lemma}: ge- between particle and stem`).toBe(!PREFIXED_BASES.has(f.base));
      expect(f.teInfinitive, f.lemma).toBe(`${f.particle} te ${f.base}`);
      expect(f.subordinate, f.lemma).toContain(f.particle + f.presentIk);
      expect(f.subordinatePast, f.lemma).toContain(f.particle + f.pastSingular);
      expect(f.mainClause.endsWith(f.particle), f.lemma).toBe(true);
      expect(['hebben', 'zijn']).toContain(f.auxiliary);
      expect(f.perfect, f.lemma).toContain(f.auxiliary === 'hebben' ? ' heb' : ' ben');
      expect(f.pastPlural.endsWith('en'), f.lemma).toBe(true);
    }
  });
  it('agrees with the authored perfect sentence of each dictionary entry', () => {
    for (const v of verbs) {
      const f = SEPARABLE_FORMS[v.lemma];
      const perfect = tokens(v.perfect);
      expect(perfect, v.lemma).toContain(f.participle);
      expect(perfect.includes(f.auxiliary === 'hebben' ? 'heb' : 'is') || perfect.includes('ben'), v.lemma).toBe(true);
      // the present sentence splits the verb: the particle is a separate word
      expect(tokens(v.present), v.lemma).toContain(f.particle);
    }
  });
  it('maps every separable card to a verb whose forms occur in that sentence', () => {
    const cards = GRAMMAR_CARDS.filter(c => c.category === 'separable' && /^pat-separable-\d+$/.test(c.id));
    expect(cards.length).toBeGreaterThanOrEqual(150);
    for (const card of cards) {
      const f = separableFormsFor(card.id)!;
      expect(f, card.id).toBeDefined();
      const words = tokens(card.dutch);
      const text = card.dutch.toLowerCase();
      const joined = [f.particle + f.presentIk, f.particle + f.presentHij, f.particle + f.pastSingular, f.particle + f.pastPlural, f.lemma, f.participle];
      const split = [f.presentIk, f.presentHij, f.pastSingular, f.pastPlural].some(x => words.includes(x)) && words.includes(f.particle);
      const withTe = text.includes(f.teInfinitive);
      expect(joined.some(x => words.includes(x)) || split || withTe, `${card.id} "${card.dutch}" does not show ${f.lemma}`).toBe(true);
    }
  });
  it('has no lemma behind a non-separable card id', () => {
    expect(separableLemmaOf('pat-als-01')).toBeUndefined();
    expect(separableLemmaOf('pat-separable-25')).toBe('terugbellen');
    expect(separableLemmaOf('pat-separable-01')).toBe('opsturen');
  });
});
