'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Plays a card's recording; falls back to a Dutch device voice. New playback stops the old one. */
export function useCardAudio() {
  const [sound, setSound] = useState('');
  const player = useRef<HTMLAudioElement | null>(null);
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current++; player.current?.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSound('');
  }, []);
  useEffect(() => () => { token.current++; player.current?.pause(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const listen = useCallback(async (card: { audio?: string; dutch: string }, slow = false) => {
    token.current++; player.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const mine = token.current; setSound('Playing…');
    const speakWithDeviceVoice = () => {
      if (mine !== token.current) return;
      if (!('speechSynthesis' in window)) { setSound('Audio unavailable. Add the recordings to enable playback.'); return; }
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === 'nl-be') || voices.find(v => v.lang.toLowerCase().startsWith('nl'));
      if (!voice) { setSound('No recording or Dutch device voice available yet. You can still read aloud.'); return; }
      const utterance = new SpeechSynthesisUtterance(card.dutch); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = slow ? 0.75 : 0.95;
      utterance.onend = () => { if (mine === token.current) setSound('Device voice used · recording not installed yet'); };
      utterance.onerror = () => { if (mine === token.current) setSound('Playback failed. Please try again.'); };
      window.speechSynthesis.speak(utterance);
    };
    if (!card.audio) { speakWithDeviceVoice(); return; }
    const audio = new Audio(card.audio); player.current = audio; audio.playbackRate = slow ? 0.8 : 1; audio.preservesPitch = true;
    audio.onended = () => { if (mine === token.current) setSound(''); };
    try { await audio.play(); } catch { speakWithDeviceVoice(); }
  }, []);
  return { sound, listen, stop };
}
