import { describe, expect, it } from 'vitest';
import { MIXED_CHALLENGES, buildRound, recordAnswer, shuffledOptions, topicAccuracy, weightOf, statOf, type MixedProgress } from '@/lib/grammarMixed';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { seededRandom } from '@/lib/sessions/wordOrder';

const WORDS = /\b(als|wanneer|toen|omdat|want|daarom|dus|terwijl|voordat|nadat|zodra|zolang|totdat|tot|hoewel|tenzij|maar|of|alsof)\b/gi;
const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim();

describe('Mixed grammar: uncued construction choice', () => {
  it('has unique ids and exactly one correct option among at least three distinct options', () => {
    expect(new Set(MIXED_CHALLENGES.map(c => c.id)).size).toBe(MIXED_CHALLENGES.length);
    for (const c of MIXED_CHALLENGES) {
      expect(c.options.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.options.filter(o => o.correct).length, c.id).toBe(1);
      expect(new Set(c.options.map(o => norm(o.text))).size, c.id).toBe(c.options.length);
      for (const o of c.options) expect(o.why.length, `${c.id}: ${o.text}`).toBeGreaterThan(40);
      expect(c.rule.length, c.id).toBeGreaterThan(15);
      expect(c.hintEn.length, c.id).toBeGreaterThan(20);
    }
  });
  it('never gives the target construction away in the Dutch situation', () => {
    for (const c of MIXED_CHALLENGES) {
      expect(c.situationNl.length, c.id).toBeGreaterThan(40);
      const correct = c.options.find(o => o.correct)!.text;
      const targets = new Set((correct.match(WORDS) ?? []).map(w => w.toLowerCase()));
      const shown = new Set((c.situationNl.match(WORDS) ?? []).map(w => w.toLowerCase()));
      for (const w of targets) expect(shown.has(w), `${c.id}: the situation contains "${w}"`).toBe(false);
    }
  });
  it('covers the required conjunction contrasts and the required mixed combinations', () => {
    const topics = new Set(MIXED_CHALLENGES.flatMap(c => c.topics));
    for (const t of ['omdat', 'als', 'toen', 'wanneer', 'tot', 'terwijl', 'of', 'dat', 'hoewel', 'voordat', 'nadat', 'zodra', 'relative', 'indirect', 'separable', 'inversion']) expect(topics.has(t), t).toBe(true);
    const tagged = new Set(MIXED_CHALLENGES.flatMap(c => c.mix));
    for (const w of ['omdat', 'als', 'toen', 'wanneer', 'tot', 'terwijl', 'of', 'dat', 'hoewel', 'maar', 'tenzij', 'voordat', 'nadat', 'zodra', 'zolang']) expect(tagged.has(w), `mix ${w}`).toBe(true);
    for (const t of topics) expect(Object.keys(GRAMMAR_AREAS).includes(t), t).toBe(true);
    const mixes = MIXED_CHALLENGES.map(c => c.mix.join('+'));
    for (const combo of ['als+separable+inversion', 'omdat+perfect', 'toen+past+inversion', 'dat+modal', 'indirect+perfect']) expect(mixes, combo).toContain(combo);
  });
  it('weights weak and new challenges up and mastered ones down, but never to zero', () => {
    const fresh = weightOf(statOf({}, 'x'));
    const wrong = weightOf({ seen: 2, right: 1, streak: 0, lastWrong: true });
    const mastered = weightOf({ seen: 6, right: 6, streak: 6, lastWrong: false });
    expect(wrong).toBeGreaterThan(fresh);
    expect(fresh).toBeGreaterThan(mastered);
    expect(mastered).toBeGreaterThan(0);
  });
  it('builds a round of distinct challenges, avoiding the same primary topic twice in a row', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const round = buildRound({}, seededRandom(String(seed)), 8);
      expect(new Set(round.map(c => c.id)).size).toBe(round.length);
      expect(round.length).toBe(8);
      round.slice(1).forEach((c, i) => expect(c.topics[0], `seed ${seed}`).not.toBe(round[i].topics[0]));
    }
  });
  it('draws a wrong challenge more often than a mastered one over many rounds', () => {
    const progress: MixedProgress = {};
    let p = progress;
    for (const c of MIXED_CHALLENGES) p = recordAnswer(p, c.id, true);
    for (let i = 0; i < 3; i++) for (const c of MIXED_CHALLENGES) p = recordAnswer(p, c.id, true);
    const weak = MIXED_CHALLENGES[0].id;
    p = recordAnswer(p, weak, false);
    let weakHits = 0, masteredHits = 0;
    const other = MIXED_CHALLENGES[5].id;
    for (let seed = 1; seed <= 1500; seed++) {
      const rand = seededRandom(String(seed)); for (let k = 0; k < 5; k++) rand();
      const ids = buildRound(p, rand, 3).map(c => c.id);
      if (ids.includes(weak)) weakHits++;
      if (ids.includes(other)) masteredHits++;
    }
    expect(weakHits).toBeGreaterThan(masteredHits * 2);
    expect(masteredHits).toBeGreaterThan(0);
  });
  it('shuffles options without losing any, and reports the weakest topic first', () => {
    const c = MIXED_CHALLENGES[0];
    expect(shuffledOptions(c, seededRandom("3")).map(o => o.text).sort()).toEqual(c.options.map(o => o.text).sort());
    let p: MixedProgress = {};
    p = recordAnswer(p, 'mx-omdat-front', false);
    p = recordAnswer(p, 'mx-wanneer-embedded', true);
    const acc = topicAccuracy(p);
    expect(acc[0].topic).toBe('omdat');
  });
});
