import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import bank from '../data/dutch-practice-bank.json';
import index from '../data/audio-index.json';

describe('Dutch variation audio source coverage', () => {
  it('reports every unindexed everyday practice sentence rather than silently claiming full coverage', () => {
    const output = execFileSync('node', ['scripts/prepare-unindexed-dutch-audio.mjs'], { encoding: 'utf8' });
    const report = JSON.parse(output.slice(0, output.indexOf('\nNo credits spent.')));
    console.log('DUTCH_AUDIO_COVERAGE ' + JSON.stringify(report));
    const manifest = JSON.parse(readFileSync('audio-export/unindexed-dutch/manifest.json','utf8'));
    const rows = manifest.batches.flatMap((batch: {items: Array<{text:string;id:string;lang:string}>}) => batch.items);
    const present = new Set(Object.values(index.items).map(row=>row.text));
    const authored = new Set(Object.values(bank).flatMap(group=>group.pairs.map(pair=>pair[0])));
    const absent = [...authored].filter(text=>!present.has(text));
    const manifestTexts = new Set(rows.map((row: {text:string})=>row.text));
    expect(report.missingUnique).toBe(rows.length);
    for (const text of absent) expect(manifestTexts.has(text), text).toBe(true);
    for (const row of rows) {
      expect(present.has(row.text)).toBe(false);
      expect(row.lang).toBe('nl');
      expect(row.id).toBe(createHash('sha256').update('nl\0'+row.text).digest('hex').slice(0,24));
    }
    // The screenshot's sentence must either have a recording in the index
    // or be explicitly listed for generation, never silently overlooked.
    expect(present.has('Mijn telefoon is leeg.') || manifestTexts.has('Mijn telefoon is leeg.')).toBe(true);
  });
});
