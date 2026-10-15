"use client";
import { modelFor } from "@/lib/practice/communication";
import { AnswerModels, FamilyExamples } from "./AnswerModels";
import { useState } from "react";
import {
  parentFor,
  variationFor,
  variationsFor,
} from "@/lib/variations/content";
import { deckCard, progressOf } from "@/lib/sessions/engine";
import type { Session, Mode } from "@/lib/sessions/types";
import type { SessionStore } from "@/lib/sessions/store";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { Modal } from "../ui/Modal";
import { GrammarNotes } from "../flashcards/GrammarNotes";
import { button } from "../flashcards/styles";

export function VariationControls({
  session,
  store,
  id,
}: {
  session: Session;
  store: SessionStore;
  id: string;
}) {
  const parent = parentFor(id),
    family = session.variations?.[parent],
    children = variationsFor(parent);
  if (session.lang !== "nl" || children.length !== 10) return null;
  const learned = children.filter(
    (v) =>
      ["easy", "mastered"].includes(
        progressOf(session, v.id).level ?? "difficult",
      ) || progressOf(session, v.id).qStreak >= 3,
  ).length;
  const released = children.slice(0, family?.unlocked ?? 2);
  const speakingRetired = released.filter(
    (v) => progressOf(session, v.id).spDone,
  ).length;
  const quizRetired = released.filter(
    (v) => progressOf(session, v.id).qDone,
  ).length;
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-4"
      aria-label="Variation practice"
    >
      <label className="flex min-h-10 items-center gap-3 font-semibold text-sm">
        <input
          type="checkbox"
          checked={family?.enabled ?? false}
          onChange={(e) =>
            store.dispatch(session.id, {
              type: "variations/toggle",
              parentId: parent,
              enabled: e.target.checked,
            })
          }
          className="h-5 w-5 accent-orange-700"
        />
        Practise variations of this sentence
      </label>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {family?.enabled
          ? `${family.unlocked} of 10 variations released · ${learned} ready for the next step. More release after an Easy/Mastered rating or 3 Quiz successes in a row. Their progress is separate from the main card.`
          : "Two variations join Speaking and Quiz when enabled. A Mastered main card enables them automatically. Turning this off preserves child progress."}
      </p>
      {family?.enabled && (
        <p className="mt-2 text-xs font-medium text-muted">
          Variation progress: Speaking {speakingRetired}/{released.length} ·
          Quiz {quizRetired}/{released.length} retired
        </p>
      )}
      <p className="mt-1 text-xs text-muted">
        New variations start Difficult. They use situations and device audio,
        without pictures.
      </p>
    </section>
  );
}

export function VariationExplanation({ id }: { id: string }) {
  const v = variationFor(id);
  if (!v) return null;
  return (
    <section
      className="mt-4 border-t border-border pt-4"
      aria-label="Variation explanation"
    >
      <p className="text-sm leading-relaxed">{v.explanation}</p>
      <p className="mt-3 font-medium" lang="nl">
        {v.example.text}
      </p>
      <p className="text-sm text-muted">{v.example.english}</p>
    </section>
  );
}

/** History is a read-only view: opening/reloading an old card never replays a scored action. */
export function ReviewHistory({
  session,
  mode,
}: {
  session: Session;
  mode: Mode;
}) {
  const [position, setPosition] = useState<number | null>(null);
  const { sound, listen, stop } = useCardAudio();
  const fullHistory = session.history?.[mode] ?? [];
  const history =
    mode === "quiz" && session.quiz.current?.outcome
      ? fullHistory.slice(0, -1)
      : fullHistory;
  const original =
    position === null ? undefined : deckCard(session.lang, history[position]);
  const saved =
    mode === "quiz" && position !== null
      ? session.quizReview?.[
          position - (fullHistory.length - (session.quizReview?.length ?? 0))
        ]
      : undefined;
  const answer =
    original && saved?.cardId === original.id
      ? modelFor(original, saved.answerId)
      : undefined;
  const card =
    original && answer
      ? {
          ...original,
          text: answer.text,
          english: answer.english,
          audio: answer.id === "model" ? original.audio : undefined,
        }
      : original;
  if (!history.length) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Previous cards">
      <div className="flex gap-2">
        <button
          className={button}
          disabled={position === 0}
          onClick={() => {
            stop();
            setPosition(
              position === null
                ? history.length - 1
                : Math.max(0, position - 1),
            );
          }}
        >
          ← Previous card
        </button>
      </div>
      {card && (
        <Modal
          title="Previous card"
          onClose={() => {
            stop();
            setPosition(null);
          }}
        >
          <div className="mt-3">
            <p className="text-xs font-semibold text-accent">
              Reviewing a previous card · no rating or points
            </p>
            <p lang={card.lang} className="mt-3 text-xl font-semibold">
              {card.text}
            </p>
            <p className="mt-2 text-sm text-muted">{card.english}</p>
            <button
              className={`${button} mt-3`}
              onClick={() =>
                void listen({
                  text: card.text,
                  lang: card.lang,
                  audio: card.audio,
                })
              }
            >
              Listen
            </button>
            <button className={`${button} ml-2`} onClick={stop}>
              Stop
            </button>
            {sound && (
              <p className="text-xs" role="status">
                {sound}
              </p>
            )}
            {original && <AnswerModels card={original} activeId={answer?.id} />}
            {original && <FamilyExamples card={original} />}
            {!variationFor(card.id) &&
              answer &&
              answer.id !== "model" &&
              original && (
                <p className="mt-5 text-xs text-muted">
                  Full breakdown below refers to the original card:{" "}
                  <span lang="nl">{original.text}</span>
                </p>
              )}
            {!variationFor(card.id) && (
              <GrammarNotes
                cardId={card.id}
                lang={card.lang}
                variation={card.variation}
              />
            )}
            <div className="mt-4 flex gap-2">
              <button
                className={button}
                disabled={position === 0}
                onClick={() => {
                  stop();
                  setPosition(Math.max(0, position! - 1));
                }}
              >
                Earlier
              </button>
              <button
                className={button}
                onClick={() => {
                  stop();
                  setPosition(null);
                }}
              >
                Return to current card
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
