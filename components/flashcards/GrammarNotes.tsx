'use client';
import { notesFor } from '@/lib/grammarNotes';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';

/** The grammar rule for one sentence, with 2-3 similar examples. Collapsible so it never gets in the way. */
export function GrammarNotes({ cardId, variation, defaultOpen = false }: { cardId: string; variation?: string; defaultOpen?: boolean }) {
  const note = notesFor(cardId);
  const { sound, listen, stop } = useCardAudio();
  if (!note) return null;
  return <details open={defaultOpen} onToggle={e => { if (!e.currentTarget.open) stop(); }} className="mt-5 border-t border-border pt-4" data-testid="grammar-notes">
    <summary className="cursor-pointer text-sm font-semibold">Grammar rule &amp; similar examples</summary>
    <p className="mt-3 text-sm leading-relaxed">{note.rule}</p>
    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Similar examples</h3>
    <ul className="mt-2 flex flex-col gap-3">
      {variation && <li><p lang="nl" className="font-medium">{variation}</p><p className="text-xs text-muted">Variation of this sentence</p></li>}
      {note.examples.map(example => <li key={example.dutch} className="flex items-start justify-between gap-3">
        <div><p lang="nl" className="font-medium">{example.dutch}</p><p className="text-sm text-muted">{example.english}</p></div>
        <button type="button" aria-label={`Listen to: ${example.dutch}`} onClick={() => void listen({ dutch: example.dutch })} className="min-h-10 shrink-0 rounded-xl border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent">🔊</button>
      </li>)}
    </ul>
    {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
  </details>;
}
