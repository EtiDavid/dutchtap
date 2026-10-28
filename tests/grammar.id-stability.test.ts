import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import baseline from './fixtures/grammar-baseline.json';

const J = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const fingerprint = (c: { dutch?: string; english?: string; image?: string; audio?: string }) =>
  createHash('sha1').update(JSON.stringify([c.dutch ?? null, c.english ?? null, c.image ?? null, c.audio ?? null])).digest('hex').slice(0, 12);

describe('Protected content and ID stability (P7)', () => {
  it('keeps all 1,200 original Everyday and Dutch at Work cards unchanged: same ids, sentence, translation, picture and audio', () => {
    const now = new Map<string, string>();
    for (const file of ['flashcards', 'flashcard-additions', 'flashcard-additions-2', 'workplace-cards']) {
      const data = J(`data/${file}.json`);
      for (const card of Array.isArray(data) ? data : data.cards ?? data) now.set(card.id, fingerprint(card));
    }
    expect(Object.keys(baseline.core)).toHaveLength(1200);
    const changed = Object.entries(baseline.core).filter(([id, hash]) => now.get(id) !== hash).map(([id]) => id);
    expect(changed).toEqual([]);
  });
  it('keeps the original grammar pattern ids and their sentences, so saved sessions and ratings still resolve', () => {
    const now = new Map<string, string>((J('data/grammar-pattern-cards.json') as { id: string; dutch: string; english: string; image: string; audio: string }[]).map(c => [c.id, fingerprint(c)]));
    expect(Object.keys(baseline.legacyGrammar)).toHaveLength(196);
    const changed = Object.entries(baseline.legacyGrammar).filter(([id, hash]) => now.get(id) !== hash).map(([id]) => id);
    expect(changed).toEqual([]);
  });
  it('never renumbers: new cards only continue after the highest earlier id of their topic', () => {
    const now = J('data/grammar-pattern-cards.json') as { id: string; category: string }[];
    const baseIds = new Set(Object.keys(baseline.legacyGrammar));
    for (const topic of new Set(now.map(c => c.category))) {
      const legacyMax = Math.max(0, ...[...baseIds].filter(id => id.startsWith(`pat-${topic}-`) && /-\d+$/.test(id)).map(id => Number(id.split('-').pop())));
      const fresh = now.filter(c => c.category === topic && !baseIds.has(c.id) && /-\d+$/.test(c.id)).map(c => Number(c.id.split('-').pop()));
      for (const n of fresh) expect(n, `${topic} ${n}`).toBeGreaterThan(legacyMax);
    }
  });
});
