import { describe, expect, it } from 'vitest';
import { SEPARABLE_ANALYSIS } from '@/lib/grammarAnalysis';
import { separableFormsFor } from '@/lib/separableForms';
import { cardFor } from '@/lib/content/cards';

const words = (text: string) => text.toLowerCase().replace(/[^\p{L}' ]/gu, ' ').split(/\s+/).filter(Boolean);
const AUX_HEBBEN = new Set(['heb', 'hebt', 'heeft', 'hebben']);
const AUX_ZIJN = new Set(['ben', 'bent', 'is', 'zijn']);

// 'Ik ben uitgelogd' states a condition (I am logged out), so it uses zijn although the action 'uitloggen' takes hebben.
const STATE_READINGS = new Set(['pat-separable-35']);

describe('separable verbs across clause types', () => {
  const entries = Object.entries(SEPARABLE_ANALYSIS).map(([id, record]) => ({ id, record, forms: separableFormsFor(id)!, text: cardFor('nl', id)!.text }));

  it('writes the finite verb together inside a dependent clause and never splits it there', () => {
    const subs = entries.filter(e => e.record.clauses.some(c => c.kind === 'bijzin'));
    expect(subs.length).toBeGreaterThanOrEqual(8);
    for (const { id, record, forms } of subs) {
      const dep = record.clauses.find(c => c.kind === 'bijzin')!;
      const spoken = words(dep.text);
      const joined = [forms.particle + forms.presentIk, forms.particle + forms.presentHij, forms.particle + forms.pastSingular, forms.particle + forms.pastPlural];
      expect(joined.some(j => spoken.includes(j)), `${id}: ${dep.text} contains the joined finite verb`).toBe(true);
      expect(spoken[spoken.length - 1], `${id}: the joined verb closes the dependent clause`).toBe(dep.finite.toLowerCase());
    }
  });
  it('splits the finite verb in every main-clause present, past and imperative card and keeps no joined finite form', () => {
    const splits = entries.filter(e => e.record.pattern === 'split');
    expect(splits.length).toBeGreaterThanOrEqual(80);
    for (const { id, forms, text } of splits) {
      const spoken = words(text);
      const joined = [forms.particle + forms.presentIk, forms.particle + forms.presentHij, forms.particle + forms.pastSingular, forms.particle + forms.pastPlural];
      expect(joined.some(j => spoken.includes(j)), `${id}: a main clause does not contain the joined finite form`).toBe(false);
      expect(spoken.includes(forms.particle), `${id}: the particle ${forms.particle} stands apart`).toBe(true);
    }
  });
  it('uses the auxiliary recorded for the verb in every perfect card', () => {
    const perfects = entries.filter(e => e.record.pattern === 'joined' && !STATE_READINGS.has(e.id) && words(e.text).includes(e.forms.participle));
    expect(perfects.length).toBeGreaterThanOrEqual(60);
    for (const { id, forms, text } of perfects) {
      const spoken = words(text);
      const allowed = forms.auxiliary === 'hebben' ? AUX_HEBBEN : AUX_ZIJN;
      const forbidden = forms.auxiliary === 'hebben' ? AUX_ZIJN : AUX_HEBBEN;
      expect(spoken.some(w => allowed.has(w)), `${id}: ${text} uses ${forms.auxiliary}`).toBe(true);
      expect(spoken.slice(0, spoken.indexOf(forms.participle)).some(w => forbidden.has(w)), `${id}: no ${forms.auxiliary === 'hebben' ? 'zijn' : 'hebben'} auxiliary`).toBe(false);
    }
  });
  it('writes te between the particle and the verb in every te-infinitive card', () => {
    const tes = entries.filter(e => e.text.includes(` ${e.forms.teInfinitive}`));
    expect(tes.length).toBeGreaterThanOrEqual(8);
    for (const { id, forms, text } of tes) expect(text, id).toContain(forms.particle + ' te ' + forms.base);
  });
});
