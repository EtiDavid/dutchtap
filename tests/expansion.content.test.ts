import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import additions from '@/data/flashcard-additions.json';
import review from '@/docs/expansion/content-review.json';
import prompts from '@/docs/expansion/illustration-prompts.json';
import batches from '@/docs/expansion/audio/manifest.json';
import { CARDS, CATEGORIES } from '@/lib/flashcards/engine';
import { VOCABULARY } from '@/lib/vocabulary';

const normalise = (text: string) => text.toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

describe('250 reviewed additions', () => {
  it('adds exactly 250 distinct sentences to the protected originals', () => {
    expect(additions).toHaveLength(250);
    expect(CARDS).toHaveLength(300);
    expect(new Set(CARDS.map(card => card.id)).size).toBe(300);
    expect(new Set(CARDS.map(card => normalise(card.dutch))).size).toBe(300);
    expect(additions.filter(card => card.source.videoId === 'local-video-1')).toHaveLength(100);
    expect(additions.filter(card => card.source.videoId === 'LZwfl7gBat8')).toHaveLength(150);
    for (const card of additions) {
      expect(CATEGORIES).toHaveProperty(card.category);
      expect(card.difficulty).toMatch(/^(beginner|intermediate)$/);
      expect(card.source.timestampSeconds).toBeGreaterThanOrEqual(0);
      const reviewed = review.find(row => row.cardId === card.id)!;
      expect(reviewed.approvedDutch).toBe(card.dutch);
      expect(reviewed.approvedEnglish).toBe(card.english);
      expect(reviewed.status).toBe('language-reviewed');
      for (const id of card.vocabularyIds) {
        const entry = VOCABULARY.find(entry => entry.id === id)!;
        expect(entry, `${card.id}: ${id}`).toBeDefined();
        expect(entry.occurrences.some(occurrence => occurrence.cardId === card.id)).toBe(true);
      }
    }
  });
  it('keeps one unique prompt and asset filename per sentence, with honest readiness', () => {
    expect(prompts).toHaveLength(250);
    expect(new Set(CARDS.map(card => card.image)).size).toBe(300);
    expect(new Set(CARDS.map(card => card.audio)).size).toBe(300);
    for (const card of additions) {
      expect(card.image).toBe(`/illustrations/cards/${card.id}.webp`);
      expect(card.audio).toBe(`/audio/flashcards/${card.id}.mp3`);
      const prompt = prompts.find(prompt => prompt.cardId === card.id)!;
      expect(prompt.prompt).toContain(card.dutch);
      expect(prompt.outputPath).toBe(`public${card.image}`);
      if (card.imageStatus === 'ready') {
        expect(existsSync(`public${card.image}`)).toBe(true);
        expect(prompt.status).toBe('installed');
      } else expect(card.imageStatus).toBe('pending');
      if (card.audioStatus === 'ready') expect(existsSync(`public${card.audio}`)).toBe(true);
      else expect(card.audioStatus).toBe('awaiting-recording');
    }
  });
  it('provides ten Dutch-only recording batches in exactly the documented ID order', () => {
    expect(batches).toHaveLength(10);
    const ordered = batches.flatMap(batch => batch.clips);
    expect(ordered.map(clip => clip.cardId)).toEqual(additions.map(card => card.id));
    for (const batch of batches) {
      expect(batch.clips).toHaveLength(25);
      const text = readFileSync(batch.textFile, 'utf8');
      expect(text).toBe(batch.clips.map(clip => clip.dutch).join('\n\n') + '\n');
      for (const [index, clip] of batch.clips.entries()) {
        expect(clip.position).toBe(index + 1);
        expect(clip.outputPath).toBe(`public/audio/flashcards/${clip.cardId}.mp3`);
      }
    }
  });
});
