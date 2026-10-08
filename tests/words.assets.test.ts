import { describe, expect, it } from 'vitest';
import { ADJECTIVES } from '@/data/adjectives';
import { NOUNS } from '@/data/nouns';
import { adjectiveSpeech, nounSpeech, wordAssetBase, wordAudioUrl } from '@/lib/words/assets';

describe('word picture and sound files', () => {
  it('are found by id, so every id must be a safe file name', () => {
    for (const entry of [...NOUNS, ...ADJECTIVES]) expect(entry.id).toMatch(/^[a-z0-9-]+$/);
  });
  it('maps ids to the folders documented for ChatGPT', () => {
    expect(wordAssetBase('noun', 'tafel')).toBe('/words/nouns/tafel');
    expect(wordAssetBase('adjective', 'mooi')).toBe('/words/adjectives/mooi');
    expect(wordAudioUrl('noun', 'tafel')).toBe('/words/nouns/tafel.mp3');
  });
  it('speaks nouns with their article', () => {
    const huis = NOUNS.find(n => n.id === 'huis')!;
    expect(nounSpeech(huis)).toBe('het huis');
    expect(nounSpeech(huis, true)).toBe('de huizen');
    expect(adjectiveSpeech(ADJECTIVES.find(a => a.id === 'rood')!)).toBe('rood');
  });
});
