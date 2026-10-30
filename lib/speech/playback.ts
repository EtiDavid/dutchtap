import { recordingFor } from "./recordings";
import {
  loadVoices,
  pickVoice,
  readVoicePreference,
  speechInfo,
  speechSupported,
  voiceInstallHint,
  voicesFor,
  type SpeechLang,
} from "./voices";

/**
 * One playback service for the whole app. Starting any sound (a recording, a device voice, a grammar example) stops whatever
 * was playing, and `stopAllSpeech` cancels everything: leaving a card, a mode, a page or the language all call it.
 */
export type PlayItem = { text: string; lang: SpeechLang; audio?: string };
type Listener = () => void;

let generation = 0;
let audio: HTMLAudioElement | null = null;
let message = "";
const listeners = new Set<Listener>();
const emit = () => {
  for (const listener of [...listeners]) listener();
};
const setMessage = (next: string) => {
  message = next;
  emit();
};

export const subscribePlayback = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const playbackMessage = () => message;

export function stopAllSpeech() {
  generation++;
  if (audio) {
    audio.pause();
    audio = null;
  }
  if (speechSupported()) window.speechSynthesis.cancel();
  if (message) setMessage("");
}

const rate = (lang: SpeechLang, slow: boolean) =>
  lang === "fr" ? (slow ? 0.7 : 0.95) : slow ? 0.75 : 0.95;

/** Speaks `text` with a device voice of exactly that language; reports clearly when that is not possible. */
export async function speakWithDevice(
  item: PlayItem,
  slow: boolean,
  mine: number,
  options: { fallbackNote?: string } = {},
) {
  if (!speechSupported()) {
    if (mine === generation)
      setMessage(
        "This browser cannot speak text aloud. You can still read the sentence.",
      );
    return false;
  }
  const voices = await loadVoices();
  if (mine !== generation) return false;
  const voice = pickVoice(item.lang, voices, readVoicePreference(item.lang));
  if (!voice) {
    const guide = voiceInstallHint(
      item.lang,
      typeof navigator === "undefined" ? "" : navigator.userAgent,
    );
    setMessage(
      `No ${speechInfo(item.lang).english} voice is installed on this device, so nothing can be spoken. You can still read the sentence. ${guide}`,
    );
    return false;
  }
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate(item.lang, slow);
  utterance.onend = () => {
    if (mine === generation) setMessage(options.fallbackNote ?? "");
  };
  utterance.onerror = (event) => {
    if (mine !== generation) return;
    const reason = (event as SpeechSynthesisErrorEvent).error;
    setMessage(
      reason === "canceled" || reason === "interrupted"
        ? ""
        : "Playback failed. Please try again.",
    );
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  setMessage(`Playing with ${voice.name} (${voice.lang})…`);
  return true;
}

/** Plays a sentence: a recording when it has one (Dutch), otherwise a device voice for its language. */
export async function play(item: PlayItem, slow = false) {
  stopAllSpeech();
  const mine = generation;
  // Keep an explicitly assigned legacy flashcard recording; otherwise use the exact-text Flemish recording.
  const recording = item.audio || recordingFor(item.text, item.lang);
  if (!recording) {
    await speakWithDevice(item, slow, mine);
    return;
  }
  const element = new Audio(recording);
  audio = element;
  element.playbackRate = slow ? 0.8 : 1;
  element.preservesPitch = true;
  element.onended = () => {
    if (mine === generation) {
      audio = null;
      setMessage("");
    }
  };
  setMessage("Playing…");
  try {
    await element.play();
  } catch {
    if (mine !== generation) return;
    audio = null;
    await speakWithDevice(item, slow, mine, {
      fallbackNote: "Device voice used · recording could not be played",
    });
  }
}

export { voicesFor };
