'use client';
import { notesFor } from '@/lib/grammarNotes';
import { breakdownFor, hasForms, patternOf } from '@/lib/grammarBreakdowns';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { CARDS } from '@/lib/flashcards/engine';

const ADAPTED = new Set(CARDS.filter(card => card.adapted).map(card => card.id));

const heading = 'mt-4 text-xs font-semibold uppercase tracking-wide text-muted';

/** The grammar for one sentence: a sentence breakdown, the short rule, and 2-3 similar examples. Collapsible so it never gets in the way. */
export function GrammarNotes({ cardId, variation, defaultOpen = false }: { cardId: string; variation?: string; defaultOpen?: boolean }) {
  const note = notesFor(cardId);
  const breakdown = breakdownFor(cardId);
  const { sound, listen, stop } = useCardAudio();
  if (!note && !breakdown) return null;
  return <details open={defaultOpen} onToggle={e => { if (!e.currentTarget.open) stop(); }} className="mt-5 border-t border-border pt-4" data-testid="grammar-notes">
    <summary className="cursor-pointer text-sm font-semibold">Grammar rule &amp; similar examples</summary>

    {breakdown && <section aria-label="Sentence breakdown" data-testid="breakdown">
      <h3 className={heading}>Sentence breakdown</h3>
      <p className="mt-2 text-sm">{breakdown.meaning}</p>
      {ADAPTED.has(cardId) && <p className="mt-2 text-xs text-muted" data-testid="adapted-note">Adapted: this sentence is reworded from the source video to fit a clear everyday situation. It has not been checked by a native speaker.</p>}
      <p className="mt-2 text-xs text-muted" data-testid="breakdown-pattern">Pattern: {patternOf(breakdown)}</p>
      <ol className="mt-2 flex flex-wrap gap-2" aria-label="This sentence, part by part">
        {breakdown.parts.map((part, index) => <li key={index} className="rounded-xl border border-border bg-surface px-3 py-2">
          <span className="block text-[11px] leading-tight text-muted">{part.label}</span>
          <span lang="nl" className="text-sm font-semibold">{part.text}</span>
        </li>)}
      </ol>
      <h3 className={heading}>Why this word order</h3>
      <p className="mt-2 text-sm leading-relaxed">{breakdown.order}</p>
      {hasForms(breakdown) && <><h3 className={heading}>Forms and endings</h3><p className="mt-2 text-sm leading-relaxed">{breakdown.forms}</p></>}
      <h3 className={heading}>Compared with English</h3>
      <p className="mt-2 text-sm leading-relaxed">{breakdown.compare}</p>
      <h3 className={heading}>A common mistake</h3>
      <p className="mt-2 text-sm"><span className="sr-only">Incorrect: </span><span aria-hidden>✗ </span><span lang="nl" className="line-through decoration-accent">{breakdown.mistake.wrong}</span></p>
      <p className="mt-1 text-sm"><span className="sr-only">Correct: </span><span aria-hidden>✓ </span><span lang="nl" className="font-semibold">{breakdown.mistake.right}</span></p>
      <p className="mt-1 text-sm text-muted">{breakdown.mistake.why}</p>
    </section>}

    {note && <>
      <h3 className={heading}>In short</h3>
      <p className="mt-2 text-sm leading-relaxed">{note.rule}</p>
      <h3 className={heading}>Similar examples</h3>
      <ul className="mt-2 flex flex-col gap-3">
        {variation && <li><p lang="nl" className="font-medium">{variation}</p><p className="text-xs text-muted">Variation of this sentence</p></li>}
        {note.examples.map(example => <li key={example.dutch} className="flex items-start justify-between gap-3">
          <div><p lang="nl" className="font-medium">{example.dutch}</p><p className="text-sm text-muted">{example.english}</p></div>
          <button type="button" aria-label={`Listen to: ${example.dutch}`} onClick={() => void listen({ dutch: example.dutch })} className="min-h-10 shrink-0 rounded-xl border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent">🔊</button>
        </li>)}
      </ul>
      <p className="mt-2 text-xs text-muted">Examples are read with your device’s Dutch voice; there are no recordings for them.</p>
      {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
    </>}
  </details>;
}
