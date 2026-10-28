import { describe, expect, it } from 'vitest';
import { BREAKDOWNS, breakdownFor } from '@/lib/grammarBreakdowns';
import { GRAMMAR_ANALYSIS } from '@/lib/grammarAnalysis';

const words = (text: string) => text.split(/\s+/).filter(Boolean);

describe('authored analysis and linked source breakdowns', () => {
  it('keeps the practice guidance of a linked source sentence next to the authored analysis', () => {
    const linked = Object.keys(GRAMMAR_ANALYSIS).filter(id => id.includes('-reuse-') && BREAKDOWNS[id.split('-reuse-').slice(1).join('-reuse-')]?.practiceGuide);
    expect(linked.length).toBeGreaterThan(0);
    for (const id of linked) {
      const merged = breakdownFor(id)!;
      expect(merged.clauses?.length, id).toBeGreaterThan(0);
      expect(merged.practiceGuide, id).toBe(BREAKDOWNS[id.split('-reuse-').slice(1).join('-reuse-')].practiceGuide);
    }
  });
  it('returns the same analysis object for the same card', () => {
    const id = Object.keys(GRAMMAR_ANALYSIS)[0];
    expect(breakdownFor(id)).toBeDefined();
  });
  it('names a finite verb that appears at most once in its clause, so the highlighted word is unambiguous', () => {
    for (const [id, record] of Object.entries(GRAMMAR_ANALYSIS)) {
      for (const clause of record.clauses) {
        const hits = words(clause.text.toLowerCase()).filter(w => w === clause.finite.toLowerCase()).length;
        expect(hits, `${id}: ${clause.finite} in "${clause.text}"`).toBeLessThanOrEqual(1);
      }
    }
  });
});
