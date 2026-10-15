"use client";
import type { LCard } from "@/lib/content/cards";
import { communicationFor, modelFor } from "@/lib/practice/communication";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { deckCard } from "@/lib/sessions/engine";
import { parentFor, variationsFor } from "@/lib/variations/content";

/** Reviewed examples of ways to convey the situation; this is not automatic speech assessment. */
export function AnswerModels({
  card,
  activeId = "model",
}: {
  card: LCard;
  activeId?: string;
}) {
  const { listen } = useCardAudio();
  if (card.lang !== "nl") return null;
  const task = communicationFor(card),
    active = modelFor(card, activeId) ?? task.answers[0];
  const others = task.answers.filter((a) => a.id !== active.id);
  return (
    <section
      className="mt-5 border-t border-border pt-4"
      aria-label="Ways to say it"
    >
      <h3 className="text-sm font-semibold">Why this answer works</h3>
      <p
        className="mt-2 text-sm leading-relaxed"
        data-testid="answer-explanation"
      >
        {active.explanation}
      </p>
      {others.length > 0 && (
        <details className="mt-4" data-testid="other-models">
          <summary className="cursor-pointer text-sm font-semibold">
            Other natural ways ({others.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-4">
            {others.map((answer) => (
              <li
                key={answer.id}
                className="rounded-xl border border-border p-3"
              >
                <p lang="nl" className="font-semibold">
                  {answer.text}
                </p>
                <p className="mt-1 text-sm text-muted">{answer.english}</p>
                <p className="mt-2 text-sm leading-relaxed">
                  {answer.explanation}
                </p>
                <button
                  type="button"
                  aria-label={`Listen to alternative: ${answer.text}`}
                  className="mt-2 min-h-10 rounded-lg border border-border px-3 text-sm"
                  onClick={() =>
                    void listen({
                      text: answer.text,
                      lang: "nl",
                      audio: answer.text === card.text ? card.audio : undefined,
                    })
                  }
                >
                  Listen to this answer
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        These are model answers, not every possible response. In Speaking, judge
        whether your own Dutch conveys this situation. In Quiz, use this round’s
        tiles; reviewed alternative orders using those same words are accepted.
      </p>
    </section>
  );
}

/** A child keeps the family's ten related models, without creating another generation of cards. */
export function FamilyExamples({ card }: { card: LCard }) {
  const { listen } = useCardAudio();
  const parent = parentFor(card.id),
    base = deckCard("nl", parent);
  if (card.lang !== "nl" || parent === card.id || !base) return null;
  const examples = [
    { text: base.text, english: base.english },
    ...variationsFor(parent),
  ]
    .filter((e) => e.text !== card.text)
    .slice(0, 10);
  return (
    <details
      className="mt-5 border-t border-border pt-4"
      data-testid="family-examples"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        10 similar grammar examples
      </summary>
      <ul className="mt-3 flex flex-col gap-3">
        {examples.map((e) => (
          <li key={e.text} className="flex items-start justify-between gap-3">
            <div>
              <p lang="nl" className="font-medium">
                {e.text}
              </p>
              <p className="text-sm text-muted">{e.english}</p>
            </div>
            <button
              type="button"
              aria-label={`Listen to example: ${e.text}`}
              onClick={() => void listen({ text: e.text, lang: "nl" })}
              className="min-h-10 shrink-0 rounded-lg border border-border px-3 text-sm"
            >
              Listen
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
