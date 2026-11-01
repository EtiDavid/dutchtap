import { describe, expect, it } from 'vitest';
import { resolveRecordingUrl } from '../lib/speech/audio-url';

const utterance = '/audio/utterances/68562b3c36c0464133b45a08.mp3';
const legacy = '/audio/flashcards/shopping-01.mp3';

describe('Dutch recorded audio on Cloudflare R2', () => {
  it('keeps existing URLs while migration is disabled', () => {
    expect(resolveRecordingUrl(utterance, '')).toBe(utterance);
    expect(resolveRecordingUrl(legacy, '', true)).toBe(legacy);
  });

  it('routes indexed Dutch utterances to R2 regardless of legacy migration state', () => {
    expect(resolveRecordingUrl(utterance, 'https://audio.example.com/', false)).toBe(
      'https://audio.example.com/utterances/68562b3c36c0464133b45a08.mp3',
    );
    expect(resolveRecordingUrl(utterance, 'https://pub-test.r2.dev', true)).toBe(
      'https://pub-test.r2.dev/utterances/68562b3c36c0464133b45a08.mp3',
    );
  });

  it('keeps original 600 flashcard MP3s local until a separate explicit cutover', () => {
    expect(resolveRecordingUrl(legacy, 'https://audio.example.com', false)).toBe(legacy);
  });

  it('routes original 600 flashcards to R2 only after legacy cutover is enabled', () => {
    expect(resolveRecordingUrl(legacy, 'https://audio.example.com/', true)).toBe(
      'https://audio.example.com/flashcards/shopping-01.mp3',
    );
    expect(resolveRecordingUrl('/audio/flashcards/work-31.mp3', 'https://pub-test.r2.dev', true)).toBe(
      'https://pub-test.r2.dev/flashcards/work-31.mp3',
    );
  });

  it('leaves unrelated assets and invalid recording paths untouched', () => {
    expect(resolveRecordingUrl('/words/nouns/regen.webp', 'https://audio.example.com', true))
      .toBe('/words/nouns/regen.webp');
    expect(resolveRecordingUrl('/audio/flashcards/../secret.mp3', 'https://audio.example.com', true))
      .toBe('/audio/flashcards/../secret.mp3');
    expect(resolveRecordingUrl('/audio/flashcards/WORD.mp3', 'https://audio.example.com', true))
      .toBe('/audio/flashcards/WORD.mp3');
  });

  it('rejects invalid public origins rather than making accidental requests', () => {
    expect(() => resolveRecordingUrl(utterance, 'http://audio.example.com')).toThrow();
    expect(() => resolveRecordingUrl(legacy, 'https://audio.example.com/flashcards', true)).toThrow();
    expect(() => resolveRecordingUrl(utterance, 'https://user:secret@audio.example.com')).toThrow();
  });
});
