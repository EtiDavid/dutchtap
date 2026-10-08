import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARDS, newReview } from '@/lib/flashcards/engine';
import { syncSchema } from '@/lib/flashcards/validation';
import baseline from '@/docs/expansion/baseline.json';

const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

describe('original deck preservation', () => {
  it('preserves all original fields and media bytes while the deck is extended', () => {
    for (const original of baseline.cards) {
      const card = CARDS.find(card => card.id === original.id)!;
      const canonical = JSON.stringify(Object.fromEntries(Object.entries(card).sort(([a], [b]) => a.localeCompare(b))));
      expect(sha(canonical), original.id).toBe(original.contentSha256);
      expect(sha(readFileSync(`public${card.image}`)), original.id).toBe(original.imageSha256);
      expect(sha(readFileSync(`public${card.audio}`)), original.id).toBe(original.audioSha256);
    }
  });
  it('accepts a sync payload for every published card, keeping original IDs valid', () => {
    expect(syncSchema.safeParse({ records: CARDS.map(card => newReview(card.id)) }).success).toBe(true);
    expect(syncSchema.safeParse({ records: [newReview('unpublished-card')] }).success).toBe(false);
  });
});
