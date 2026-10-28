"use client";

import { useMemo, useState } from "react";
import type { LCard } from "@/lib/content/cards";
import { communicationFor, principalAnswers } from "@/lib/practice/communication";
import { button } from "../flashcards/styles";

const normal = (value: string) =>
  value
    .normalize("NFC")
    .toLocaleLowerCase("nl")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Optional production check for grammar Speaking. The learner writes before the
 * model is revealed; afterwards we can only say whether it matches one of the
 * stored reviewed models. A different answer is never labelled "wrong Dutch".
 */
export function TypedGrammarDraft({
  card,
  revealed,
}: {
  card: LCard;
  revealed: boolean;
}) {
  const [draft, setDraft] = useState("");
  const models = useMemo(
    () => principalAnswers(communicationFor(card)),
    [card],
  );
  const matched =
    revealed && draft.trim()
      ? models.find((answer) => normal(answer.text) === normal(draft))
      : undefined;

  return (
    <section
      className="mt-5 rounded-xl border border-border bg-surface-2 p-4"
      aria-label="Optional typed answer"
      data-testid="typed-grammar-draft"
    >
      <label className="block text-sm font-semibold" htmlFor={`typed-${card.id}`}>
        Optional: build the sentence yourself
      </label>
      <p className="mt-1 text-xs text-muted">
        Type before revealing if writing helps you think directly in Dutch. This
        does not change your rating or streak.
      </p>
      <textarea
        id={`typed-${card.id}`}
        lang="nl"
        rows={2}
        className="field mt-3 min-h-24 w-full p-3"
        value={draft}
        readOnly={revealed}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Schrijf je Nederlandse antwoord..."
      />
      {!revealed && draft && (
        <button
          type="button"
          className={`${button} mt-2`}
          onClick={() => setDraft("")}
        >
          Clear draft
        </button>
      )}
      {revealed && draft.trim() && (
        <p className="mt-3 text-sm" role="status">
          {matched
            ? "✅ Your typed answer matches one of the reviewed model answers."
            : "Your answer is different from the stored models. Compare the meaning and grammar yourself; different does not automatically mean incorrect Dutch."}
        </p>
      )}
    </section>
  );
}
