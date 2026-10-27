import { describe, expect, it } from 'vitest';
import { MIXED_CHALLENGES, mergeMixed, changedMixed, cleanMixed, mixedSyncSchema, buildRound, recordAnswer, shuffledOptions, topicAccuracy, weightOf, statOf, type MixedProgress } from '@/lib/grammarMixed';
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
  it('has at least three challenges for every conjunction contrast topic, and uses every option as a distinct sentence across the set', () => {
    for (const t of ['omdat', 'als', 'toen', 'wanneer', 'tot', 'terwijl', 'of', 'dat', 'hoewel', 'voordat', 'nadat', 'zodra', 'relative', 'indirect', 'connectors', 'exceptions']) {
      expect(MIXED_CHALLENGES.filter(c => c.topics.includes(t)).length, t).toBeGreaterThanOrEqual(3);
    }
    const texts = MIXED_CHALLENGES.flatMap(c => c.options.map(o => norm(o.text)));
    expect(new Set(texts).size).toBe(texts.length);
    expect(MIXED_CHALLENGES.length).toBeGreaterThanOrEqual(58);
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

  describe('account sync', () => {
    const a = MIXED_CHALLENGES[0].id, b = MIXED_CHALLENGES[1].id;
    const at = (n: number) => new Date(Date.UTC(2026, 9, 27, 10, n));
    it('records when each answer was given', () => {
      expect(recordAnswer({}, a, true, at(1))[a].at).toBe(at(1).toISOString());
    });
    it('keeps the more recent answer per challenge and unions the rest, in either order', () => {
      const phone = recordAnswer(recordAnswer({}, a, true, at(1)), b, false, at(2));
      const laptop = recordAnswer(recordAnswer({}, a, true, at(5)), a, false, at(6));
      const x = mergeMixed(phone, laptop), y = mergeMixed(laptop, phone);
      expect(x).toEqual(y);
      expect(x[a].lastWrong).toBe(true);
      expect(x[b].seen).toBe(1);
    });
    it('lets a timed answer beat one saved before sync existed, and is idempotent', () => {
      const old: MixedProgress = { [a]: { seen: 4, right: 4, streak: 4, lastWrong: false } };
      const fresh = recordAnswer({}, a, false, at(1));
      expect(mergeMixed(old, fresh)[a]).toEqual(fresh[a]);
      expect(mergeMixed(fresh, old)[a]).toEqual(fresh[a]);
      expect(mergeMixed(fresh, fresh)).toEqual(fresh);
    });
    it('sends only changed entries', () => {
      const before = recordAnswer({}, a, true, at(1));
      const after = recordAnswer(before, b, true, at(2));
      expect(changedMixed(before, after)).toEqual([b]);
      expect(changedMixed(after, after)).toEqual([]);
    });
    it('drops unknown ids and impossible counts from saved or server data', () => {
      const cleaned = cleanMixed({ nope: { seen: 1, right: 1, streak: 1, lastWrong: false }, [a]: { seen: 1, right: 5, streak: 1, lastWrong: false }, [b]: { seen: 2, right: 1, streak: 1, lastWrong: false } });
      expect(Object.keys(cleaned)).toEqual([b]);
      expect(cleanMixed('x')).toEqual({});
    });
    it('only accepts timed records for the sync request', () => {
      const ok = { id: a, stat: { seen: 1, right: 1, streak: 1, lastWrong: false, at: at(1).toISOString() } };
      expect(mixedSyncSchema.safeParse({ records: [ok] }).success).toBe(true);
      expect(mixedSyncSchema.safeParse({ records: [{ id: a, stat: { ...ok.stat, at: undefined } }] }).success).toBe(false);
      expect(mixedSyncSchema.safeParse({ records: [{ ...ok, id: 'unknown' }] }).success).toBe(false);
    });
    it('never touches card levels: the module has no dependency on the flashcard engine', async () => {
      const source = (await import('node:fs')).readFileSync('lib/grammarMixed.ts', 'utf8') + (await import('node:fs')).readFileSync('lib/useMixedProgress.ts', 'utf8');
      expect(source).not.toMatch(/flashcards\/(engine|useReviews)/);
    });
  });
});
