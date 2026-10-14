'use client';
import { useEffect, useState } from 'react';
import { LANG_INFO, type Lang } from '@/lib/lang';
import { loadVoices, pickVoice, readVoicePreference, saveVoicePreference, speechSupported, voicesFor } from '@/lib/speech/voices';
import { play } from '@/lib/speech/playback';
import { button } from '../flashcards/styles';

const SAMPLE: Record<Lang, string> = { nl: 'Goedendag, hoe gaat het met u?', fr: 'Bonjour, comment allez-vous ?' };

/** Device-voice settings for a language that has no recordings: choose among installed voices of that language and test one. */
export function VoicePicker({ lang }: { lang: Lang }) {
  const [state, setState] = useState<{ supported: boolean; names: string[]; chosen: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const voices = voicesFor(lang, await loadVoices());
      if (cancelled) return;
      setState({ supported: speechSupported(), names: voices.map(voice => voice.name), chosen: pickVoice(lang, voices, readVoicePreference(lang))?.name ?? '' });
    };
    void refresh();
    if (!speechSupported()) return;
    const synth = window.speechSynthesis;
    synth.addEventListener('voiceschanged', refresh); // voices can arrive late or be installed while the page is open
    return () => { cancelled = true; synth.removeEventListener('voiceschanged', refresh); };
  }, [lang]);

  if (!state) return null;
  if (!state.supported) return <p className="mt-2 text-xs text-muted" data-testid="voice-status">This browser cannot speak text aloud, so you can read the sentences only.</p>;
  if (!state.names.length) return <p className="mt-2 text-xs text-muted" data-testid="voice-status">No {LANG_INFO[lang].english} voice was found on this device, so the Listen buttons will say so. You can still read everything.</p>;
  if (state.names.length === 1) return null;
  return <details className="mt-2 text-xs" data-testid="voice-picker">
    <summary className="cursor-pointer text-muted">Voice: {state.chosen}</summary>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2">Voice
        <select data-testid="voice-select" value={state.chosen} onChange={event => { saveVoicePreference(lang, event.target.value); setState({ ...state, chosen: event.target.value }); }} className="rounded-lg border border-border bg-white p-2 text-sm">
          {state.names.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <button type="button" className={`${button} min-h-10`} onClick={() => void play({ text: SAMPLE[lang], lang })}>Test voice</button>
    </div>
  </details>;
}
