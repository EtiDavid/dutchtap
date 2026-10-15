"use client";
import { useEffect } from "react";
import {
  CATEGORIES,
  LEVELS,
  LEVEL_LABELS,
  rateLevel,
  type Level,
} from "@/lib/flashcards/engine";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import {
  deckCard,
  newAttemptId,
  pickSpeakingCard,
  practiceLevel,
  availablePractice,
  progressOf,
  retired,
  wouldRetireSpeaking,
} from "@/lib/sessions/engine";
import { RETIRE_AT } from "@/lib/sessions/types";
import { isVariation, variationFor } from "@/lib/variations/content";
import { VariationControls, ReviewHistory } from "./VariationPractice";
import { AnswerModels, FamilyExamples } from "./AnswerModels";
import { copy } from "@/lib/lang/copy";
import { button, primary } from "../flashcards/styles";
import { GrammarNotes } from "../flashcards/GrammarNotes";
import { AudioControls, CardImage, VocabLinks } from "./CardParts";
import type { ModeProps } from "./modeTypes";

/**
 * Speaking: the learner says the sentence from the picture and situation, checks it, then explicitly rates how well
 * they recalled it BEFORE revealing. Only a Mastered rating counts toward the ten consecutive recalls that retire a card.
 */
export function SpeakingMode({
  session,
  store,
  reviews,
  reviewsReady,
  onPractised,
}: ModeProps) {
  const { sound, listen, stop } = useCardAudio();
  const { current, done } = session.speaking;
  const hasCurrent = !!current;

  // Make sure a card is waiting. The choice is saved with the session, so a refresh never re-rolls it.
  useEffect(() => {
    if (!reviewsReady || hasCurrent) return;
    const live = store.get(session.id);
    if (!live || live.speaking.current) return;
    const cardId = pickSpeakingCard(live, reviews);
    if (cardId)
      store.dispatch(live.id, {
        type: "speaking/open",
        cardId,
        attemptId: newAttemptId(),
        level: practiceLevel(live, cardId, reviews),
      });
  }, [
    reviewsReady,
    session.id,
    session.status,
    hasCurrent,
    session.speaking.done,
    store,
    reviews,
  ]);

  const total = session.cardIds.length;
  const summary = (
    <p className="text-sm text-muted" data-testid="speaking-progress">
      Speaking: {retired(session, "speaking")} of {total} cards retired
    </p>
  );

  if (done && !current && !availablePractice(session, "speaking").length)
    return (
      <section
        aria-label="Speaking"
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 text-center"
        data-testid="speaking-complete"
      >
        <span aria-hidden className="text-4xl">
          🗣️
        </span>
        <h2 className="text-2xl font-bold">Speaking completed</h2>
        <p className="text-muted">
          You recalled all {total} sentences ten times in a row. Study and Quiz
          stay open
          {session.quiz.done
            ? ""
            : ", and the session finishes when the Quiz is completed too"}
          .
        </p>
        {summary}
        <ReviewHistory session={session} mode="speaking" />
      </section>
    );

  const card = current ? deckCard(session.lang, current.cardId) : undefined;
  if (!current || !card)
    return (
      <p className="text-muted" role="status">
        Choosing your next sentence…
      </p>
    );
  const progress = progressOf(session, card.id);
  const lastLevel: Level = practiceLevel(session, card.id, reviews);
  const displayedLevel =
    current.chosen ?? (session.lang === "nl" ? lastLevel : null);

  function reveal() {
    stop();
    store.dispatch(session.id, {
      type: "speaking/reveal",
      attemptId: current!.attemptId,
    });
  }
  function choose(level: Level) {
    store.dispatch(session.id, {
      type: "speaking/choose",
      attemptId: current!.attemptId,
      level,
    });
  }
  function next() {
    if (!current) return;
    stop();
    const level = displayedLevel;
    if (!level) return;
    // The next card is drawn using the level this rating is about to set, and never repeats immediately.
    const nextReviews = {
      ...reviews,
      [current.cardId]: rateLevel(
        current.cardId,
        reviews[current.cardId],
        level,
      ),
    };
    const retiring = wouldRetireSpeaking(session, current.cardId, level)
      ? current.cardId
      : undefined;
    const nextId = pickSpeakingCard(
      session,
      nextReviews,
      Math.random,
      current.cardId,
      retiring,
    );
    store.dispatch(session.id, {
      type: "speaking/submit",
      attemptId: current.attemptId,
      level,
      next: nextId
        ? {
            cardId: nextId,
            attemptId: newAttemptId(),
            level: practiceLevel(session, nextId!, nextReviews),
          }
        : null,
    });
    onPractised();
  }

  return (
    <section aria-label="Speaking" className="flex flex-col gap-5">
      <ReviewHistory session={session} mode="speaking" />
      {session.lang === "nl" && (
        <VariationControls session={session} store={store} id={card.id} />
      )}
      <div className="flex justify-between text-sm text-muted">
        <span>{CATEGORIES[card.category as keyof typeof CATEGORIES]}</span>
        {summary}
      </div>
      <article
        key={current.attemptId}
        className="flashcard-enter overflow-hidden rounded-3xl border border-border bg-white shadow-sm"
      >
        {!isVariation(card.id) && (
          <CardImage
            card={card}
            alt={current.revealed ? card.cue : card.scenario}
          />
        )}
        {isVariation(card.id) && (
          <p className="px-6 pt-5 text-sm font-semibold text-accent">
            Variation · {variationFor(card.id)?.focus}
          </p>
        )}
        <div className="p-6">
          {!current.revealed ? (
            <>
              <p className="text-lg leading-snug">{card.scenario}</p>
              <p className="mt-4 text-xl font-bold text-accent">
                How do you say it?
              </p>
              <p className="mt-1 text-sm text-muted">
                Say it out loud first, then check.
              </p>
            </>
          ) : (
            <>
              <p
                lang={card.lang}
                className="text-2xl font-semibold leading-snug"
              >
                {card.text}
              </p>
              <p className="mt-3 text-base text-muted">{card.english}</p>
              <AudioControls
                card={card}
                sound={sound}
                listen={listen}
                stop={stop}
              />
              <AnswerModels card={card} />
              <FamilyExamples card={card} />
              {!isVariation(card.id) && (
                <GrammarNotes
                  key={card.id}
                  cardId={card.id}
                  lang={card.lang}
                  variation={card.variation}
                />
              )}
              {!isVariation(card.id) && <VocabLinks card={card} />}
            </>
          )}
          <p
            className="mt-5 text-sm font-semibold"
            data-testid="recall-progress"
          >
            {progress.spStreak} / {RETIRE_AT} consecutive recalls
          </p>
          <progress
            aria-label="Consecutive recalls for this sentence"
            max={RETIRE_AT}
            value={progress.spStreak}
            className="flash-progress mt-1 h-1.5 w-full"
          />
        </div>
      </article>

      {!current.revealed ? (
        <button type="button" className={primary} onClick={reveal}>
          {copy(session.lang).checkAnswer}
        </button>
      ) : (
        <section aria-label="Rate your recall" className="flex flex-col gap-3">
          <p className="text-center text-sm font-semibold">
            How well did you recall it before revealing?
          </p>
          <div
            className="grid grid-cols-4 gap-2"
            role="group"
            aria-label="Your rating"
          >
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={displayedLevel === level}
                onClick={() => choose(level)}
                className={`${button} px-1 ${displayedLevel === level ? "border-accent bg-accent text-white" : level === lastLevel ? "ring-2 ring-accent/40" : ""}`}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted">
            Last rating: <strong>{LEVEL_LABELS[lastLevel]}</strong>.{" "}
            {session.lang === "nl"
              ? "Next saves the selected rating. Change it if needed."
              : "Select a rating for this attempt before Next."}{" "}
            <strong>Mastered</strong> means “I recalled this correctly before
            revealing.” Anything else restarts this sentence’s count of
            consecutive recalls.
          </p>
          <button
            type="button"
            className={primary}
            disabled={!displayedLevel}
            onClick={next}
          >
            Next
          </button>
        </section>
      )}
    </section>
  );
}
