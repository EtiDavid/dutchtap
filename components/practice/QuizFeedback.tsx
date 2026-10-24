"use client";
import { useEffect, useState } from "react";

const KEY = "dutchtap:feedback:v1";
type Settings = { sound: boolean; confetti: boolean };
function read(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return { sound: v?.sound !== false, confetti: v?.confetti !== false };
  } catch {
    return { sound: true, confetti: true };
  }
}
export function FeedbackSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    const update = () => setSettings(read());
    update();
    window.addEventListener("dutchtap:feedback-settings", update);
    return () =>
      window.removeEventListener("dutchtap:feedback-settings", update);
  }, []);
  function toggle(key: keyof Settings) {
    const next = { ...read(), [key]: !read()[key] };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* preferences can be unavailable */
    }
    setSettings(next);
    window.dispatchEvent(new Event("dutchtap:feedback-settings"));
  }
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted">
        Quiz sound & celebration
      </summary>
      <div className="mt-2 flex flex-wrap gap-2">
        {(["sound", "confetti"] as const).map((key) => (
          <button
            key={key}
            type="button"
            disabled={!settings}
            aria-pressed={settings?.[key] ?? false}
            onClick={() => toggle(key)}
            className="min-h-10 rounded-xl border border-border px-3"
          >
            {key === "sound" ? "Sound" : "Confetti"}:{" "}
            {settings?.[key] ? "on" : "off"}
          </button>
        ))}
      </div>
    </details>
  );
}

export function QuizFeedback() {
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const contexts = new Set<AudioContext>();
    function onCorrect() {
      const settings = read();
      if (
        settings.confetti &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setBurst((n) => n + 1);
        clearTimeout(timer);
        timer = setTimeout(() => setBurst(0), 950);
      }
      if (!settings.sound || !window.AudioContext) return;
      // A short synthesized chime: no network, audio library or paid voice call.
      try {
        const ctx = new AudioContext();
        contexts.add(ctx);
        const chime = () => {
          [659.25, 830.61, 987.77].forEach((frequency, i) => {
            const oscillator = ctx.createOscillator(),
              gain = ctx.createGain(),
              start = ctx.currentTime + i * 0.075;
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.06, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.17);
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.18);
            if (i === 2)
              oscillator.onended = () => {
                contexts.delete(ctx);
                void ctx.close();
              };
          });
        };
        void ctx
          .resume()
          .then(chime)
          .catch(() => {
            contexts.delete(ctx);
            void ctx.close();
          });
      } catch {
        /* visual feedback still works without audio */
      }
    }
    window.addEventListener("dutchtap:correct", onCorrect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("dutchtap:correct", onCorrect);
      for (const ctx of contexts) void ctx.close();
    };
  }, []);
  return burst ? (
    <div
      key={burst}
      aria-hidden="true"
      className="quiz-confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${5 + i * 3.8}%`,
            background: ["#c2410c", "#15803d", "#eab308", "#2563eb"][i % 4],
            animationDelay: `${(i % 5) * 0.025}s`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  ) : null;
}
