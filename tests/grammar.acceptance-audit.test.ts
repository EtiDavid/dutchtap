import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import authored from '@/data/grammar-pattern-cards.json';
import reused from '@/data/grammar-reuse-links.json';
import variations from '@/data/grammar-variation-families.json';
import verbs from '@/data/editorial/grammar-separable-verbs.json';
import lessons from '@/data/grammar-topic-lessons.json';

const read = (name: string) => readFileSync(name, 'utf8');
const audit = read('docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md');
const guide = read('docs/GRAMMAR-PATTERNS.md');
const readme = read('README.md');
const matrix = [...audit.matchAll(/^\| \*\*(A\d{2})\*\*[^|]*\| \*\*(VERIFIED|PARTIAL|BLOCKED)[^*]*\*\* \|/gm)];

describe('Grammar Mastery release transparency', () => {
  it('maintains an auditable acceptance row for every A01-A25 requirement', () => {
    expect(matrix.length).toBe(25);
    expect(new Set(matrix.map(x => x[1])).size).toBe(25);
    for (let n = 1; n <= 25; n++) expect(matrix.some(x => x[1] === `A${String(n).padStart(2, '0')}`)).toBe(true);
    expect(audit).toContain('PARTIALLY COMPLETE');
    expect(readme).toContain('PARTIALLY COMPLETE');
    expect(guide).toContain('PARTIALLY COMPLETE');
  });
  it('has documented counts matching canonical source rows, not passive examples', () => {
    const base = authored.length + reused.length;
    const children = Object.values(variations).flat();
    const parents = Object.keys(variations);
    expect(new Set(authored.map(x => x.id)).size).toBe(authored.length);
    expect(new Set(children.map(x => x.id)).size).toBe(children.length);
    expect(new Set(verbs.map(x => x.lemma)).size).toBe(verbs.length);
    expect(audit).toContain(`**${authored.length} authored; ${reused.length} source aliases**`);
    expect(guide).toContain(`**${base}**`);
    expect(audit).toContain(`**${children.length}** independent interactive grammar variations`);
    expect(audit).toContain(`**${base - parents.length} of ${base}** grammar parents`);
    expect(audit).toContain(`**${verbs.length}** separable verb lemma records`);
    const withDutchPrompt = authored.filter(x => typeof x.scenarioNl === 'string' && x.scenarioNl.trim());
    expect(audit).toContain(`**${withDutchPrompt.length} of ${authored.length}** authored grammar cards`);
  });
  it('distinguishes detailed and preliminary topic lessons instead of claiming blanket completion', () => {
    const sources = Object.keys(lessons);
    const versions = Object.values(lessons).reduce<Record<string,number>>((acc,lesson) => {
      acc[lesson.revision] = (acc[lesson.revision] ?? 0) + 1;
      return acc;
    }, {});
    expect(sources).toHaveLength(13);
    for(const [version,count] of Object.entries(versions)) {
      expect(audit).toContain(`**${count} v${version}**`);
    }
    expect(readme).toContain('not approved to merge or tag');
  });
});
