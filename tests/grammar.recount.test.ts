import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Programmatic recount (P7)', () => {
  it('docs/GRAMMAR-MASTERY-RECOUNT.md is regenerated from the data files and reports no integrity problem', () => {
    // exits non-zero when the committed file is stale or any duplicate / dangling reference exists
    const output = execFileSync('node', ['scripts/grammar-recount.mjs', '--check'], { encoding: 'utf8' });
    expect(output).toMatch(/recount is current/);
  });
});
