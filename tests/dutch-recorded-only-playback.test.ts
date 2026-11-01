import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { play, playbackMessage, stopAllSpeech } from "../lib/speech/playback";
import { recordingFor } from "../lib/speech/recordings";

vi.mock("../lib/speech/recordings", () => ({
  recordingFor: vi.fn(),
}));

vi.mock("../lib/speech/voices", () => ({
  speechSupported: vi.fn(() => true),
  loadVoices: vi.fn(async () => [{ name: "French voice", lang: "fr-BE" }]),
  pickVoice: vi.fn(() => ({ name: "French voice", lang: "fr-BE" })),
  readVoicePreference: vi.fn(() => null),
  speechInfo: vi.fn(() => ({ english: "French" })),
  voiceInstallHint: vi.fn(() => ""),
  voicesFor: vi.fn(() => []),
}));

describe("Dutch recorded-only audio", () => {
  const speech = { cancel: vi.fn(), speak: vi.fn() };
  const audioInstances: Array<{ src: string; pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> }> = [];
  const audioFactory = vi.fn((src: string) => {
    const element = {
      src, pause: vi.fn(), play: vi.fn(async () => undefined),
      playbackRate: 1, preservesPitch: false,
      onended: null as (() => void) | null,
    };
    audioInstances.push(element);
    return element;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    audioInstances.length = 0;
    vi.stubGlobal("Audio", audioFactory);
    vi.stubGlobal("window", { speechSynthesis: speech });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      voice: unknown;
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      constructor(public text: string) {}
    });
    vi.mocked(recordingFor).mockReturnValue(undefined);
    stopAllSpeech();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopAllSpeech();
    vi.unstubAllGlobals();
  });

  it("plays indexed Dutch from an MP3 rather than calling device speech", async () => {
    vi.mocked(recordingFor).mockReturnValue("https://audio.davideti.dev/utterances/abc.mp3");
    await play({ text: "Ik leer Nederlands.", lang: "nl" });
    expect(audioFactory).toHaveBeenCalledOnce();
    expect(audioInstances[0].src).toContain("audio.davideti.dev");
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it("never silently substitutes device TTS for missing Dutch", async () => {
    await play({ text: "Nonexistent Dutch sentence.", lang: "nl" });
    expect(audioFactory).not.toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
    expect(playbackMessage()).toContain("Recorded Dutch audio is unavailable");
  });

  it("reports an MP3 playback error without synthesizing Dutch", async () => {
    vi.mocked(recordingFor).mockReturnValue("https://audio.davideti.dev/utterances/unreachable.mp3");
    audioFactory.mockImplementationOnce((src: string) => {
      const element = {
        src, pause: vi.fn(), play: vi.fn(async () => { throw new Error("network error"); }),
        playbackRate: 1, preservesPitch: false,
        onended: null as (() => void) | null,
      };
      audioInstances.push(element);
      return element;
    });
    await play({ text: "Ik leer Nederlands.", lang: "nl" });
    expect(speech.speak).not.toHaveBeenCalled();
    expect(playbackMessage()).toContain("Dutch recording failed to play");
  });

  it("preserves device voice support for French (out of Dutch recording scope)", async () => {
    await play({ text: "Bonjour !", lang: "fr" });
    expect(audioFactory).not.toHaveBeenCalled();
    expect(speech.speak).toHaveBeenCalledOnce();
  });
});
