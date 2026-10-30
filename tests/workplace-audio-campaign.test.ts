import { describe, expect, it } from 'vitest';
import review from '../data/editorial/audio-workplace-500-review.json';

describe('workplace audio campaign', () => {
  it('contains exactly 500 unique IDs', () => {
    expect(review.rows.length).toBe(500);
    expect(new Set(review.rows.map(row => row.cardId)).size).toBe(500);
  });
});
