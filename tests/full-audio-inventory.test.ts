import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('Full audio inventory planning', () => {
  it('builds deterministic no-cost, bounded Dutch and English recording batches', () => {
    const result = execFileSync('node', ['scripts/audit-all-learning-audio.mjs'], {
      cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
    });
    console.log('AUDIO INVENTORY AUDIT\n' + result);
    const report = JSON.parse(readFileSync('audio-export/full-coverage/audit.json', 'utf8'));
    expect(report.languages.nl.total.uniqueUtterances).toBeGreaterThan(1334);
    expect(report.languages.nl.missing.uniqueUtterances).toBeGreaterThan(0);
    for (const lang of ['nl', 'en']) {
      const { total, recorded, missing, batches } = report.languages[lang];
      expect(total.uniqueUtterances).toBe(recorded.uniqueUtterances + missing.uniqueUtterances);
      expect(total.characters).toBe(recorded.characters + missing.characters);
      for (let i = 1; i <= batches; i++) {
        const number = String(i).padStart(3, '0');
        const manifest = JSON.parse(readFileSync(`audio-export/full-coverage/${lang}/batch-${number}.json`, 'utf8'));
        const items = manifest.batches[0].items;
        expect(items.length).toBeGreaterThan(0);
        expect(items.length).toBeLessThanOrEqual(1000);
        expect(items.every(row => row.lang === lang && !row.existingAudio)).toBe(true);
        expect(items.reduce((n, row) => n + row.text.length, 0)).toBeLessThanOrEqual(28000);
      }
    }
  });
});
