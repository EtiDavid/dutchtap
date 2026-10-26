import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('Grammar Mastery release gate', () => {
  it('rejects incomplete audits and can only pass a clean 25-item verified matrix', () => {
    const doc = readFileSync('docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md', 'utf8');
    const rows = [...doc.matchAll(/^\|\s*\*\*(A\d{2})\*\*[^|]*\|\s*\*\*(VERIFIED|PARTIAL|BLOCKED)[^*]*\*\*\s*\|/gm)];
    const completed = rows.length === 25 &&
      rows.every(x => x[2] === 'VERIFIED') &&
      !/PARTIALLY COMPLETE|NOT MERGE\/RELEASE APPROVED|P7 — independent audit and release: BLOCKED/i.test(doc);
    const result = spawnSync(process.execPath, ['scripts/check-grammar-acceptance.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 5000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(completed ? 0 : 1);
    if (!completed) {
      expect(result.stderr).toContain('GRAMMAR MASTERY RELEASE BLOCKED');
    }
  });
});
