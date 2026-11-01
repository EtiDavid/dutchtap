'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { SpeechLang } from '@/lib/speech/voices';
import { play, playbackMessage, stopAllSpeech, subscribePlayback } from '@/lib/speech/playback';

/** Dutch is recorded-only; other languages retain their device-voice support. */
export type Speakable = { text: string; lang: SpeechLang; audio?: string };

/** Playback for the page. Starting a sound stops the previous one; leaving the page stops everything. */
export function useCardAudio() {
  const sound = useSyncExternalStore(subscribePlayback, playbackMessage, () => '');
  useEffect(() => () => stopAllSpeech(), []);
  const listen = useCallback((item: Speakable, slow = false) => play(item, slow), []);
  const stop = useCallback(() => stopAllSpeech(), []);
  return { sound, listen, stop };
}
