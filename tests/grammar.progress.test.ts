import { describe, expect, it } from 'vitest';
import { CORE_CARDS, GRAMMAR_CARDS, newReview, rateLevel, type Level, type Reviews } from '@/lib/flashcards/engine';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { progressSummary, topicProgress } from '@/lib/grammarProgress';

const NOW = new Date('2026-10-27T10:00:00Z');
const rated = (levels: Record<string, Level>): Reviews =>
  Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, rateLevel(id, newReview(id, NOW), level, NOW)]));
const ids = (topic: string) => GRAMMAR_CARDS.filter(c => c.category === topic).map(c => c.id);

describe('Topic progress on the grammar hub', () => {
  it('reports every topic as not started for a new learner, with the real number of sentences', () => {
    for (const topic of Object.keys(GRAMMAR_AREAS)) {
      const p = topicProgress(topic, {});
      expect(p.total, topic).toBeGreaterThan(0);
      expect(p.practised, topic).toBe(0);
      expect(p.mastered, topic).toBe(0);
      expect(progressSummary(p)).toMatch(/not started/);
    }
  });
  it('counts only explicit Mastered ratings as mastered, and any rating as practised', () => {
    const [a, b, c, d] = ids('hoewel');
    const p = topicProgress('hoewel', rated({ [a]: 'mastered', [b]: 'mastered', [c]: 'easy', [d]: 'difficult' }));
    expect(p).toMatchObject({ practised: 4, mastered: 2 });
    expect(progressSummary(p)).toBe(`${p.total} sentences, 4 practised, 2 mastered`);
  });
  it('keeps topics apart: rating a sentence of one topic does not move another', () => {
    const [a] = ids('hoewel');
    expect(topicProgress('connectors', rated({ [a]: 'mastered' }))).toMatchObject({ practised: 0, mastered: 0 });
  });
  it('never lets Everyday or Dutch at Work mastery count: a grammar alias has its own rating', () => {
    const alias = GRAMMAR_CARDS.find(c => c.originCardId)!;
    const origin = alias.originCardId!;
    expect(CORE_CARDS.some(c => c.id === origin)).toBe(true);
    const everydayOnly = rated({ [origin]: 'mastered' });
    expect(topicProgress(alias.category, everydayOnly)).toMatchObject({ practised: 0, mastered: 0 });
    expect(topicProgress(alias.category, rated({ [alias.id]: 'mastered' })).mastered).toBe(1);
  });
  it('ignores ratings of ids that are not in the topic, and an unknown topic has nothing', () => {
    expect(topicProgress('hoewel', rated({ 'not-a-card': 'mastered' }))).toMatchObject({ practised: 0, mastered: 0 });
    expect(topicProgress('nope', {})).toEqual({ total: 0, practised: 0, mastered: 0 });
  });
  it('totals match the number of distinct pattern sentences in each topic', () => {
    for (const topic of Object.keys(GRAMMAR_AREAS)) {
      const distinct = new Set(GRAMMAR_CARDS.filter(c => c.category === topic).map(c => c.originCardId ?? c.id));
      expect(topicProgress(topic, {}).total, topic).toBe(distinct.size);
    }
  });
});
