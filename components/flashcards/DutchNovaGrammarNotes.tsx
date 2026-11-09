"use client";

import nova from "@/data/dutchnova-1-cards.json";
import { variationsFor } from "@/lib/variations/content";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";

const byId = new Map(nova.cards.map((card) => [card.id, card]));
const btn = "min-h-10 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold";

export function DutchNovaGrammarNotes({ cardId, defaultOpen = false }: {cardId:string; defaultOpen?:boolean}) {
  const card = byId.get(cardId);
  const { listen, stop, sound } = useCardAudio();
  if (!card) return null;

  const authored = variationsFor(cardId);
  const parallel = nova.cards
    .filter((other) => other.id !== cardId && other.focus === card.focus)
    .slice(0, 3)
    .map((other) => ({ id: other.id, text: other.text, scenario: other.scenarioEn, explanation: other.explanation }));
  const examples = authored.length
    ? authored.map((v) => ({ id: v.id, text: v.text, scenario: v.scenario, explanation: v.explanation }))
    : parallel;

  return <details open={defaultOpen} className="mt-5 rounded-2xl border border-border bg-surface-2/70 p-4" data-testid="dutchnova-grammar-notes">
    <summary className="cursor-pointer text-sm font-bold">Full explanation · grammar, mistakes and examples</summary>
    <div className="mt-4 space-y-4 text-sm leading-relaxed">
      <section>
        <h3 className="font-bold text-base">1. What you're trying to say</h3>
        <p className="mt-1">{card.teaching.communicationGoal}</p>
        <p lang="nl-BE" className="mt-2 font-semibold text-base">{card.text}</p>
      </section>
      <section>
        <h3 className="font-bold text-base">2. Why this Dutch sentence works</h3>
        <p className="mt-1">{card.teaching.meaningAndUsage}</p>
        <p className="mt-2">{card.teaching.grammarReason}</p>
      </section>
      <section className="rounded-xl bg-surface p-3">
        <h3 className="font-bold text-base">3. Mistake and correction</h3>
        <p className="mt-2 text-error" lang="nl-BE">✕ {card.teaching.commonError.incorrect}</p>
        <p className="mt-2 text-success" lang="nl-BE">✓ {card.teaching.commonError.correction}</p>
        <p className="mt-2">{card.teaching.commonError.reason}</p>
      </section>
      <section>
        <h3 className="font-bold text-base">4. How the meaning changes</h3>
        <p className="mt-1">{card.teaching.meaningfulContrast}</p>
      </section>
      <section>
        <h3 className="font-bold text-base">5. More real-life examples</h3>
        {examples.length ? <ul className="mt-2 space-y-3">
          {examples.map((example) => <li key={example.id} className="rounded-xl border border-border bg-surface p-3">
            <p lang="nl-BE" className="font-semibold">{example.text}</p>
            <p className="mt-1 text-muted">{example.scenario}</p>
            <p className="mt-2">{example.explanation}</p>
            {authored.length > 0
              ? <p className="mt-2 text-xs text-muted">An independently tracked variation. Enable variations in the session to practise this sentence.</p>
              : <p className="mt-2 text-xs text-muted">Related reading example. Not yet an independently tracked variation.</p>}
            <button type="button" disabled className={`${btn} mt-3 opacity-50`} title="Audio not recorded yet" aria-label={`Audio for example awaiting recording: ${example.text}`}>🔊 Listen (audio pending)</button>
          </li>)}
        </ul> : <p className="mt-2 text-muted">Additional examples are still being authored for this pattern.</p>}
      </section>
      <p className="text-xs text-muted">These notes are AI-drafted and require a final Dutch language review. Recorded Dutch audio and independent variation examples are being added separately.</p>
      {sound && <p className="text-xs text-muted" role="status">{sound}</p>}
    </div>
  </details>;
}
