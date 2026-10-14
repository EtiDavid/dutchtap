'use client';
import { notesFor } from '@/lib/grammarNotes';
import type { Lang } from '@/lib/lang';
import { breakdownFor, hasForms, patternOf } from '@/lib/grammarBreakdowns';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { CARDS } from '@/lib/flashcards/engine';
import { cardFor } from '@/lib/content/cards';

const ADAPTED = new Set(CARDS.filter(card => card.adapted).map(card => card.id));

const heading = 'mt-4 text-xs font-semibold uppercase tracking-wide text-muted';
const HEADINGS: Record<Lang, { order: string; forms: string; deviceVoice: string }> = {
  nl: { order: 'Why this word order', forms: 'Forms and endings', deviceVoice: 'Examples are read with your device’s Dutch voice; there are no recordings for them.' },
  fr: { order: 'Why this construction', forms: 'Forms, agreement and endings', deviceVoice: 'Examples are read with your device’s French voice (synthetic speech).' },
};

/** The grammar for one sentence: a sentence breakdown, the short rule, and 2-3 similar examples. Collapsible so it never gets in the way. */
export function GrammarNotes({ cardId, lang = 'nl', variation, defaultOpen = false }: { cardId: string; lang?: Lang; variation?: string; defaultOpen?: boolean }) {
  const note = notesFor(cardId, lang);
  const breakdown = breakdownFor(cardId, lang);
  const variationEnglish = lang === 'fr' ? cardFor(lang, cardId)?.variationEnglish : undefined;
  const { sound, listen, stop } = useCardAudio();
  if (!note && !breakdown) return null;
  const words = HEADINGS[lang];
  return <details open={defaultOpen} onToggle={e => { if (!e.currentTarget.open) stop(); }} className="mt-5 border-t border-border pt-4" data-testid="grammar-notes" data-lang={lang}>
    <summary className="cursor-pointer text-sm font-semibold">Grammar rule &amp; similar examples</summary>

    {breakdown && <section aria-label="Sentence breakdown" data-testid="breakdown">
      <h3 className={heading}>Sentence breakdown</h3>
      <p className="mt-2 text-sm" lang={lang}>{breakdown.meaning}</p>
      {lang === 'nl' && ADAPTED.has(cardId) && <p className="mt-2 text-xs text-muted" data-testid="adapted-note">Adapted: this sentence is reworded from the source video to fit a clear everyday situation. It has not been checked by a native speaker.</p>}
      {breakdown.help && <p className="mt-1 text-xs text-muted" data-testid="breakdown-help">In English: {breakdown.help}</p>}
      <p className="mt-2 text-xs text-muted" data-testid="breakdown-pattern">Pattern: {patternOf(breakdown)}</p>
      <ol className="mt-2 flex flex-wrap gap-2" aria-label="This sentence, part by part">
        {breakdown.parts.map((part, index) => <li key={index} className="rounded-xl border border-border bg-surface px-3 py-2">
          <span className="block text-[11px] leading-tight text-muted">{part.label}</span>
          <span lang={lang} className="text-sm font-semibold">{part.text}</span>
        </li>)}
      </ol>
      <h3 className={heading}>{words.order}</h3>
      <p className="mt-2 text-sm leading-relaxed" lang={lang}>{breakdown.order}</p>
      {hasForms(breakdown) && <><h3 className={heading}>{words.forms}</h3><p className="mt-2 text-sm leading-relaxed" lang={lang}>{breakdown.forms}</p></>}
      <h3 className={heading}>Compared with English</h3>
      <p className="mt-2 text-sm leading-relaxed">{breakdown.compare}</p>
      <h3 className={heading}>A common mistake</h3>
      <p className="mt-2 text-sm"><span className="sr-only">Incorrect: </span><span aria-hidden>✗ </span><span lang={lang} className="line-through decoration-accent">{breakdown.mistake.wrong}</span></p>
      <p className="mt-1 text-sm"><span className="sr-only">Correct: </span><span aria-hidden>✓ </span><span lang={lang} className="font-semibold">{breakdown.mistake.right}</span></p>
      <p className="mt-1 text-sm text-muted" lang={lang}>{breakdown.mistake.why}</p>
    </section>}

    {note && <>
      <h3 className={heading}>In short</h3>
      <p className="mt-2 text-sm leading-relaxed" lang={lang}>{note.rule}</p>
      {note.help && <p className="mt-1 text-xs text-muted">In English: {note.help}</p>}
      <h3 className={heading}>Similar examples</h3>
      <ul className="mt-2 flex flex-col gap-3">
        {variation && <li><p lang={lang} className="font-medium">{variation}</p>{variationEnglish && <p className="text-sm text-muted">{variationEnglish}</p>}<p className="text-xs text-muted">Variation of this sentence</p></li>}
        {note.examples.map(example => <li key={example.text} className="flex items-start justify-between gap-3">
          <div><p lang={lang} className="font-medium">{example.text}</p><p className="text-sm text-muted">{example.english}</p></div>
          <button type="button" aria-label={`Listen to: ${example.text}`} onClick={() => void listen({ text: example.text, lang })} className="min-h-10 shrink-0 rounded-xl border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent">🔊</button>
        </li>)}
      </ul>
      <p className="mt-2 text-xs text-muted">{words.deviceVoice}</p>
      {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
    </>}
  </details>;
}
