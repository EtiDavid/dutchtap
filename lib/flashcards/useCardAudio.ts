'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Lang } from '@/lib/lang';
import { play, playbackMessage, stopAllSpeech, subscribePlayback } from '@/lib/speech/playback';

/** A sentence to play: Dutch cards have a recording; French (and any card without one) is spoken by a device voice of its language. */
export type Speakable = { text: string; lang: Lang; audio?: string };

/** Playback for the page. Starting a sound stops the previous one; leaving the page stops everything. */
export function useCardAudio() {
  const sound = useSyncExternalStore(subscribePlayback, playbackMessage, () => '');
  useEffect(() => () => stopAllSpeech(), []);
  const listen = useCallback((item: Speakable, slow = false) => play(item, slow), []);
  const stop = useCallback(() => stopAllSpeech(), []);
  return { sound, listen, stop };
}
