import { describe, expect, it } from 'vitest';
import tags from '@/data/grammar-source-tags.json';
import forms from '@/data/grammar-separable-forms.json';
import links from '@/data/grammar-reuse-links.json';
import { CARDS, CORE_CARDS, GRAMMAR_CARDS, newReview, rateLevel } from '@/lib/flashcards/engine';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { grammarTagsFor, grammarTopicsFor, originOf, taggedSourcesFor } from '@/lib/grammarTags';
import { eligibleIds, levelCounts, createSession } from '@/lib/sessions/engine';

const core = new Map(CORE_CARDS.map(c => [c.id, c]));
const toks = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) ?? [];

describe('Grammar source tags: one sentence, several topics, one rating', () => {
  it('points only at real original cards and real grammar topics, with no duplicates', () => {
    const keys = new Set<string>();
    for (const t of tags.tags) {
      expect(core.has(t.id), t.id).toBe(true);
      expect(Object.keys(GRAMMAR_AREAS) as string[], t.topic).toContain(t.topic);
      expect(t.review).toBe('ai-editorial-checked');
      const key = `${t.id}|${t.topic}|${t.evidence}`;
      expect(keys.has(key), key).toBe(false);
      keys.add(key);
    }
  });
  it('does not repeat an explicit grammar alias as a tag', () => {
    const aliased = new Set(links.map(l => `${l.topic}|${l.sourceId}`));
    for (const t of tags.tags) expect(aliased.has(`${t.topic}|${t.id}`), `${t.id} ${t.topic}`).toBe(false);
  });
  it('shows real evidence for every separable-verb tag: the verb is in the sentence, split or joined', () => {
    const table = forms as Record<string, { particle: string; base: string; participle: string; teInfinitive: string; presentIk: string; presentHij: string; pastSingular: string; pastPlural: string }>;
    for (const t of tags.tags.filter(x => x.topic === 'separable')) {
      const f = table[t.evidence];
      expect(f, `${t.id}: ${t.evidence} is in the forms table`).toBeDefined();
      const w = toks(core.get(t.id)!.dutch);
      const p = f.particle.toLowerCase();
      const teForm = core.get(t.id)!.dutch.toLowerCase().includes(f.teInfinitive);
      const joined = teForm || [t.evidence, f.participle, p + f.presentIk, p + f.presentHij, p + f.pastSingular, p + f.pastPlural].some(x => (w as string[]).includes(x));
      const stems = [f.base, f.base + 't', f.presentIk, f.presentHij, f.pastSingular, f.pastPlural];
      const i = w.findIndex(x => stems.includes(x));
      const split = i >= 0 && w.slice(i + 1).includes(p);
      expect(joined || split, `${t.id} "${core.get(t.id)!.dutch}" does not show ${t.evidence}`).toBe(true);
    }
  });
  it('shows the conjunction word for every of / tot tag', () => {
    for (const t of tags.tags.filter(x => x.topic === 'of' || x.topic === 'tot')) {
      const w = toks(core.get(t.id)!.dutch);
      expect((w as string[]).includes(t.topic), t.id).toBe(true);
    }
  });
  it('answers for an original card and for its alias with the same topics', () => {
    const tagged = tags.tags.find(t => t.topic === 'separable')!;
    expect(grammarTagsFor(tagged.id).some(x => x.topic === 'separable' && x.via === 'tag')).toBe(true);
    const link = links[0];
    const alias = GRAMMAR_CARDS.find(c => c.originCardId === link.sourceId)!;
    expect(originOf(alias)).toBe(link.sourceId);
    expect(grammarTopicsFor(originOf(alias)).some(x => x.topic === link.topic)).toBe(true);
    expect(taggedSourcesFor('separable').length).toBeGreaterThan(80);
  });
  it('never puts the same original sentence into one grammar set twice', () => {
    const multi = new Map<string, string[]>();
    for (const c of GRAMMAR_CARDS.filter(x => x.originCardId)) multi.set(c.originCardId!, [...(multi.get(c.originCardId!) ?? []), c.id]);
    const doubled = [...multi].filter(([, ids]) => ids.length > 1);
    expect(doubled.length).toBeGreaterThan(0); // the case really exists: career-support-039 is in two topics
    const reviews = {};
    const ids = eligibleIds('all', 'difficult', reviews, 'nl', 'grammar');
    const origins = ids.map(id => originOf(CARDS.find(c => c.id === id)!));
    expect(new Set(origins).size).toBe(origins.length);
    expect(levelCounts('all', reviews, 'nl', 'grammar').difficult).toBe(ids.length);
    const session = createSession({ topic: 'all', count: 100, level: 'difficult', lang: 'nl', collection: 'grammar', reviews, rand: () => 0.5 })!;
    const sessionOrigins = session.cardIds.map(id => originOf(CARDS.find(c => c.id === id)!));
    expect(new Set(sessionOrigins).size).toBe(sessionOrigins.length);
  });
  it('keeps a separate rating per alias: Everyday mastery does not make the grammar alias mastered', () => {
    const link = links[0];
    const alias = GRAMMAR_CARDS.find(c => c.originCardId === link.sourceId)!;
    const reviews = { [link.sourceId]: rateLevel(link.sourceId, newReview(link.sourceId), 'mastered') };
    expect(eligibleIds(link.topic, 'difficult', reviews, 'nl', 'grammar')).toContain(alias.id);
  });
});
