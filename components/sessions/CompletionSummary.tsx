"use client";
import { sessionStats } from "@/lib/sessions/engine";
import type { Session } from "@/lib/sessions/types";
import { primary } from "../flashcards/styles";

/** Shown once Speaking AND Quiz are both complete. Reopening a finished session never resets it. */
export function CompletionSummary({
  session,
  onAgain,
  againDisabled,
  againMessage,
}: {
  session: Session;
  onAgain: () => void;
  againDisabled: boolean;
  againMessage?: string;
}) {
  const stats = sessionStats(session);
  return (
    <section
      aria-label="Session completed"
      data-testid="completion-summary"
      className="flex flex-col gap-3 rounded-2xl border border-success/40 bg-success/10 p-5"
    >
      <h2 className="text-xl font-bold">🎉 Session completed</h2>
      <p className="text-sm">
        You finished both Speaking and the Quiz for these {stats.total}{" "}
        sentences. It is saved here as history, and Study is still open.
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted">Speaking</dt>
          <dd className="font-semibold">
            {stats.speakingRetired} / {stats.total} cards ·{" "}
            {stats.speakingAttempts} ratings
          </dd>
        </div>
        <div>
          <dt className="text-muted">Quiz</dt>
          <dd className="font-semibold">
            {stats.quizRetired} / {stats.total} cards · {stats.quizPoints}{" "}
            points
          </dd>
        </div>
        <div>
          <dt className="text-muted">{session.lang === "nl" ? "Main Quiz answers" : "Quiz answers"}</dt>
          <dd className="font-semibold">
            {stats.quizCorrect} correct · {stats.quizWrong} wrong
            {stats.quizAccuracy !== null ? ` (${stats.quizAccuracy}%)` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Study</dt>
          <dd className="font-semibold">Round {stats.studyRound}</dd>
        </div>
      </dl>
      {session.lang === "nl" &&
        Object.keys(session.variations ?? {}).length > 0 && (
          <p className="text-xs text-muted">
            The main set is complete. Optional variation practice stays
            available here and does not use an active-session slot. Variation
            effort: {stats.variationSpeakingAttempts} ratings ·{" "}
            {stats.variationQuizCorrect} correct · {stats.variationQuizWrong}{" "}
            wrong. The points above include variations.
          </p>
        )}
      <button
        type="button"
        className={primary}
        disabled={againDisabled}
        onClick={onAgain}
      >
        Practise this set again
      </button>
      <p className="text-xs text-muted">
        Starts a new session with the same sentences and fresh counters. Your
        card levels stay as they are.
        {againDisabled && againMessage ? ` ${againMessage}` : ""}
      </p>
    </section>
  );
}
