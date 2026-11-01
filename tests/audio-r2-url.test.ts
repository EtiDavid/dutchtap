import { describe, expect, it } from 'vitest';
import { resolveRecordingUrl } from '../lib/speech/audio-url';

const file = '/audio/utterances/68562b3c36c0464133b45a08.mp3';

describe('Dutch recorded audio on Cloudflare R2', () => {
  it('keeps existing URLs while migration is disabled', () => {
    expect(resolveRecordingUrl(file, '')).toBe(file);
    expect(resolveRecordingUrl(file, undefined)).toBe(file);
  });

  it('serves indexed Dutch utterances from the R2 public origin', () => {
    expect(resolveRecordingUrl(file, 'https://audio.example.com/')).toBe(
      'https://audio.example.com/utterances/68562b3c36c0464133b45a08.mp3',
    );
    expect(resolveRecordingUrl(file, 'https://pub-test.r2.dev')).toBe(
      'https://pub-test.r2.dev/utterances/68562b3c36c0464133b45a08.mp3',
    );
  });

  it('leaves legacy recordings and other media untouched', () => {
    expect(resolveRecordingUrl('/audio/flashcards/example.mp3', 'https://audio.example.com'))
      .toBe('/audio/flashcards/example.mp3');
    expect(resolveRecordingUrl('/words/nouns/regen.webp', 'https://audio.example.com'))
      .toBe('/words/nouns/regen.webp');
  });

  it('rejects invalid R2 origins rather than making accidental requests', () => {
    expect(() => resolveRecordingUrl(file, 'http://audio.example.com')).toThrow();
    expect(() => resolveRecordingUrl(file, 'https://audio.example.com/utterances')).toThrow();
    expect(() => resolveRecordingUrl(file, 'https://user:secret@audio.example.com')).toThrow();
  });
});
