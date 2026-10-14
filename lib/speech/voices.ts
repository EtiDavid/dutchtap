import type { Lang } from '@/lib/lang';
import { LANG_INFO } from '@/lib/lang';

/** Browser speech synthesis helpers. Pure functions are separated from the browser calls so they can be tested. */
export const speechSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

const normaliseTag = (tag: string) => tag.toLowerCase().replace('_', '-');
/** True for voices of the language itself (fr, fr-BE, fr_FR ...). A Dutch, English or other voice never qualifies. */
export const isVoiceFor = (lang: Lang, voice: Pick<SpeechSynthesisVoice, 'lang'>): boolean => {
  const tag = normaliseTag(voice.lang || '');
  return tag === lang || tag.startsWith(`${lang}-`);
};
/** Only the voices that speak this language, best first: fr-BE, then fr-FR, then any other French voice, then by name. */
export function voicesFor<T extends Pick<SpeechSynthesisVoice, 'lang' | 'name'>>(lang: Lang, voices: readonly T[]): T[] {
  const rank = (voice: T) => { const index = LANG_INFO[lang].speech.indexOf(normaliseTag(voice.lang)); return index === -1 ? LANG_INFO[lang].speech.length : index; };
  return voices.filter(voice => isVoiceFor(lang, voice)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
/** The saved voice if it is still installed for this language, otherwise the best available one. Null when there is none. */
export function pickVoice<T extends Pick<SpeechSynthesisVoice, 'lang' | 'name'>>(lang: Lang, voices: readonly T[], preferredName?: string | null): T | null {
  const candidates = voicesFor(lang, voices);
  return candidates.find(voice => voice.name === preferredName) ?? candidates[0] ?? null;
}

const prefKey = (lang: Lang) => `dutchtap:voice:${lang}:v1`;
export function readVoicePreference(lang: Lang): string | null { try { return localStorage.getItem(prefKey(lang)); } catch { return null; } }
export function saveVoicePreference(lang: Lang, name: string) { try { localStorage.setItem(prefKey(lang), name); } catch { /* the choice just will not be remembered */ } }

/** Voices load late in some browsers: resolves as soon as any are listed, when `voiceschanged` fires, or after the timeout. */
export function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise(resolve => {
    const finish = () => { synth.removeEventListener('voiceschanged', onChange); clearTimeout(timer); resolve(synth.getVoices()); };
    const onChange = () => { if (synth.getVoices().length) finish(); };
    const timer = setTimeout(finish, timeoutMs);
    synth.addEventListener('voiceschanged', onChange);
  });
}

/** Guidance for installing a voice, chosen from the actual device. Shown only after no voice was found. */
export function voiceInstallHint(lang: Lang, userAgent: string): string {
  const name = LANG_INFO[lang].english;
  if (/android/i.test(userAgent)) return `On Android: Settings → System → Languages & input → Text-to-speech output → install ${name} voice data.`;
  if (/iphone|ipad|ipod/i.test(userAgent)) return `On iPhone or iPad: Settings → Accessibility → Spoken Content → Voices → ${name}.`;
  if (/windows/i.test(userAgent)) return `On Windows: Settings → Time & language → Speech → Add voices → ${name}.`;
  if (/mac os x|macintosh/i.test(userAgent)) return `On a Mac: System Settings → Accessibility → Spoken Content → System voice → Manage voices → ${name}.`;
  return `Install a ${name} text-to-speech voice in your device's speech settings, then reload this page.`;
}
