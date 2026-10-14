'use client';
import { deckCard, shuffleRound } from '@/lib/sessions/engine';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { CATEGORIES } from '@/lib/flashcards/engine';
import { primary } from '../flashcards/styles';
import { GrammarNotes } from '../flashcards/GrammarNotes';
import { AudioControls, CardImage, VocabLinks } from './CardParts';
import type { ModeProps } from './modeTypes';

/** Study: read, listen and understand each sentence in shuffled complete rounds. Nothing here is graded or changes any level. */
export function StudyMode({ session, store, onPractised }: ModeProps) {
  const { sound, listen, stop } = useCardAudio();
  const { order, pos, round } = session.study;
  const card = deckCard(session.lang, order[pos]);
  if (!card) return <p>This sentence is no longer available.</p>;

  function next() {
    stop();
    const atEnd = pos + 1 >= order.length;
    store.dispatch(session.id, { type: 'study/next', nextOrder: atEnd ? shuffleRound(session.cardIds, Math.random, order[order.length - 1]) : undefined });
    onPractised();
  }

  return <section aria-label="Study" className="flex flex-col gap-5">
    <div className="flex justify-between text-sm text-muted"><span>{CATEGORIES[card.category as keyof typeof CATEGORIES]}</span><span data-testid="study-position">Round {round} · sentence {pos + 1} of {order.length}</span></div>
    <progress aria-label="Progress through this round" max={order.length} value={pos + 1} className="flash-progress h-1.5 w-full" />
    <article key={`${round}-${pos}`} className="flashcard-enter overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
      <CardImage card={card} alt={card.cue} />
      <div className="p-6">
        <p lang={card.lang} className="text-2xl font-semibold leading-snug">{card.text}</p>
        <p className="mt-3 text-base text-muted">{card.english}</p>
        <AudioControls card={card} sound={sound} listen={listen} stop={stop} />
        <GrammarNotes key={card.id} cardId={card.id} lang={card.lang} variation={card.variation} />
        <VocabLinks card={card} />
      </div>
    </article>
    <button type="button" className={primary} onClick={next}>Next sentence</button>
    <p className="text-center text-xs text-muted">Study is for reading and listening. It does not change your card levels or your session progress.</p>
  </section>;
}
