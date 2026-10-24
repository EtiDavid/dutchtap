"use client";
import Image from "next/image";
import { recordingFor } from '@/lib/speech/recordings';
import Link from "next/link";
import { wordsForCard } from "@/lib/vocabulary";
import type { LCard } from "@/lib/content/cards";
import { withLang } from "@/lib/lang";
import type { Speakable } from "@/lib/flashcards/useCardAudio";
import { button } from "../flashcards/styles";
import { VoicePicker } from "./VoicePicker";

export function CardImage({
  card,
  alt,
  priority = true,
}: {
  card: Pick<LCard, "image" | "imageStatus">;
  alt: string;
  priority?: boolean;
}) {
  if (!card.image || card.imageStatus === "not-applicable") return null;
  return card.imageStatus === "pending" ? (
    <div className="flex aspect-[3/2] items-center justify-center bg-surface p-6 text-center text-sm text-muted">
      Illustration awaiting generation
    </div>
  ) : (
    <Image
      src={card.image}
      alt={alt}
      width={1536}
      height={1024}
      priority={priority}
      className="aspect-[3/2] w-full object-cover"
    />
  );
}

export const speakable = (card: LCard): Speakable => ({
  text: card.text,
  lang: card.lang,
  audio: card.audio,
});

export function AudioControls({
  card,
  sound,
  listen,
  stop,
}: {
  card: LCard;
  sound: string;
  listen: (item: Speakable, slow?: boolean) => void | Promise<void>;
  stop: () => void;
}) {
  const item = speakable(card);
  const hasRecording = !!(recordingFor(card.text, card.lang) ?? card.audio);
  return (
    <>
      {card.audioStatus === "awaiting-recording" && !hasRecording ? (
        <p className="mt-4 text-sm text-muted">
          Diederik recording awaiting installation.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            onClick={() => void listen(item)}
          >
            Listen
          </button>
          <button
            type="button"
            className={button}
            onClick={() => void listen(item, true)}
          >
            Listen slowly
          </button>
          <button
            type="button"
            aria-label="Stop audio"
            className={button}
            onClick={stop}
          >
            Stop
          </button>
        </div>
      )}
      {card.audioStatus === "device" && card.lang === "nl" && !hasRecording && <p className="mt-2 text-xs text-muted">Spoken by your device’s Dutch voice.</p>}
      {card.lang === "fr" && !hasRecording && (
        <p className="mt-2 text-xs text-muted">
          Spoken by your device’s French voice (synthetic speech, not a
          recording).
        </p>
      )}
      {sound && (
        <p role="status" className="mt-2 text-xs text-muted">
          {sound}
        </p>
      )}
      {!hasRecording && <VoicePicker lang={card.lang} />}
    </>
  );
}

export function VocabLinks({ card }: { card: LCard }) {
  const words = wordsForCard(card.id, card.lang);
  return (
    <>
      {words.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {words.map((word) => (
            <Link
              key={word.id}
              href={withLang(
                `/vocabulary?card=${card.id}#${word.id}`,
                card.lang,
              )}
              lang={card.lang}
              className="text-sm text-accent underline"
            >
              {word.headword}
            </Link>
          ))}
        </div>
      )}
      <Link
        href={withLang(
          words.length ? `/vocabulary?card=${card.id}` : "/vocabulary",
          card.lang,
        )}
        className="mt-3 block text-sm text-accent underline"
      >
        {words.length ? "Vocabulary for this sentence" : "Browse vocabulary"}
      </Link>
    </>
  );
}
