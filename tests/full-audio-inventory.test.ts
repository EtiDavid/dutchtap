import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

describe('Full audio inventory planning', () => {
  it('builds a checked Dutch-only pilot manifest without spending ElevenLabs credits', () => {
    const summary = JSON.parse(execFileSync('node', ['scripts/prepare-dutch-audio-pilot.mjs'], { cwd: process.cwd(), encoding: 'utf8' }));
    const manifest = JSON.parse(readFileSync('audio-export/pilot-001/manifest.json', 'utf8'));
    const items = manifest.batches.flatMap((b: { items: { id: string; text: string; lang: string; approved: boolean }[] }) => b.items);
    expect(manifest.language).toBe('nl');
    expect(manifest.approvedOnly).toBe(true);
    // Regenerating the pilot after installing its clips is an expected success.
    expect(items.length + summary.recordedAlreadySkipped.length).toBe(26);
    expect(items.every((x: { text: string; lang: string; approved: boolean; id: string }) =>
      x.lang === 'nl' && x.approved && x.id === createHash('sha256').update('nl\0' + x.text).digest('hex').slice(0, 24)
    )).toBe(true);
  });
  it('reports zero queued credits once every authored Dutch utterance is indexed', () => {
    execFileSync('node', ['scripts/audit-all-learning-audio.mjs', '--index-only'], {
      cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    const report = JSON.parse(readFileSync('audio-export/full-coverage/audit.json', 'utf8'));
    expect(report.languages.nl.missing.uniqueUtterances).toBe(0);
    expect(report.languages.nl.missing.characters).toBe(0);
    expect(report.languages.nl.total.uniqueUtterances).toBe(report.languages.nl.recorded.uniqueUtterances);
    // This is a source-index completeness check. R2 availability is validated separately.
    expect(report.verificationSource).toContain('INDEX METADATA ONLY');
  });
  it('builds deterministic, no-cost, Dutch-only recording batches', () => {
    const result = execFileSync('node', ['scripts/audit-all-learning-audio.mjs','--index-only'], {
      cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
    });
    console.log('AUDIO INVENTORY AUDIT\n' + result);
    const report = JSON.parse(readFileSync('audio-export/full-coverage/audit.json', 'utf8'));
    expect(report.languages.nl.total.uniqueUtterances).toBeGreaterThan(10000);
    expect(report.languages.nl.missing.uniqueUtterances).toBe(0);
    expect(report.languages.nl.batches).toBe(0);
    expect(Object.keys(report.languages)).toEqual(['nl']);
    expect(report.excludedLanguages).toEqual(['en', 'fr']);
    expect(existsSync('audio-export/full-coverage/missing-en.tsv')).toBe(false);
    expect(existsSync('audio-export/full-coverage/en')).toBe(false);
    for (const lang of ['nl']) {
      const { total, recorded, missing, batches } = report.languages[lang];
      expect(total.uniqueUtterances).toBe(recorded.uniqueUtterances + missing.uniqueUtterances);
      expect(total.characters).toBe(recorded.characters + missing.characters);
      for (let i = 1; i <= batches; i++) {
        const number = String(i).padStart(3, '0');
        const manifest = JSON.parse(readFileSync(`audio-export/full-coverage/${lang}/batch-${number}.json`, 'utf8'));
        const items = manifest.batches[0].items;
        expect(items.length).toBeGreaterThan(0);
        expect(items.length).toBeLessThanOrEqual(1000);
        expect(items.every((row: { lang: string; existingAudio: string }) => row.lang === lang && !row.existingAudio)).toBe(true);
        expect(items.reduce((n: number, row: { text: string }) => n + row.text.length, 0)).toBeLessThanOrEqual(28000);
      }
    }
  });
});
