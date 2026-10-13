'use client';
import { useEffect } from 'react';
import { CATEGORIES } from '@/lib/flashcards/engine';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { deckCard, newAttemptId, pickQuizCard, progressOf, retired } from '@/lib/sessions/engine';
import { QUIZ_POINTS, RETIRE_AT } from '@/lib/sessions/types';
import { shuffledTokenOrder, tokensForSentence } from '@/lib/sessions/wordOrder';
import { button, primary } from '../flashcards/styles';
import { GrammarNotes } from '../flashcards/GrammarNotes';
import { AudioControls, CardImage, VocabLinks } from './CardParts';
import type { ModeProps } from './modeTypes';

/** Quiz: put the words of the sentence you learned back in order. +10 points per correct answer; ten correct in a row retire a card. */
export function QuizMode({ session, store, onPractised }: ModeProps) {
  const { sound, listen, stop } = useCardAudio();
  const { current, done, points } = session.quiz;
  const hasCurrent = !!current;

  useEffect(() => {
    if (session.status === 'archived' || hasCurrent) return;
    const live = store.get(session.id);
    if (!live || live.quiz.done || live.quiz.current) return;
    const cardId = pickQuizCard(live);
    const card = cardId ? deckCard(cardId) : undefined;
    if (card) store.dispatch(live.id, { type: 'quiz/open', cardId: card.id, attemptId: newAttemptId(), tokenOrder: shuffledTokenOrder(card.dutch) });
  }, [session.id, session.status, hasCurrent, session.quiz.done, store]);

  const total = session.cardIds.length;
  const attempts = session.cards ? Object.values(session.cards).reduce((n, p) => n + p.qCorrect + p.qWrong, 0) : 0;
  const correct = Object.values(session.cards).reduce((n, p) => n + p.qCorrect, 0);
  const stats = <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" data-testid="quiz-stats">
    <span><strong className="text-foreground" data-testid="quiz-points">{points}</strong> points</span>
    <span>{correct} correct · {attempts - correct} wrong</span>
    <span data-testid="quiz-progress">Quiz: {retired(session, 'quiz')} of {total} cards retired</span>
  </div>;

  // The last answer's feedback is still shown (with its explanation) before the completed panel replaces it.
  if (done && !current) return <section aria-label="Quiz" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 text-center" data-testid="quiz-complete">
    <span aria-hidden className="text-4xl">🧩</span>
    <h2 className="text-2xl font-bold">Quiz completed</h2>
    <p className="text-muted">You put all {total} sentences in order ten times in a row. Study and Speaking stay open{session.speaking.done ? '' : ', and the session finishes when Speaking is completed too'}.</p>
    {stats}
  </section>;

  const card = current ? deckCard(current.cardId) : undefined;
  if (!current || !card) return <p className="text-muted" role="status">Choosing your next sentence…</p>;
  const words = tokensForSentence(card.dutch);
  const progress = progressOf(session, card.id);
  const placed = current.answer;
  const outcome = current.outcome;

  function place(id: string) { if (!outcome && !placed.includes(id)) store.dispatch(session.id, { type: 'quiz/draft', attemptId: current!.attemptId, answer: [...placed, id] }); }
  function undo() { if (!outcome && placed.length) store.dispatch(session.id, { type: 'quiz/draft', attemptId: current!.attemptId, answer: placed.slice(0, -1) }); }
  function clear() { if (!outcome && placed.length) store.dispatch(session.id, { type: 'quiz/draft', attemptId: current!.attemptId, answer: [] }); }
  function check() {
    if (outcome || placed.length !== words.length) return;
    store.dispatch(session.id, { type: 'quiz/submit', attemptId: current!.attemptId, answer: placed });
    onPractised();
  }
  function next() {
    stop();
    const nextId = pickQuizCard(session, Math.random, current!.cardId);
    const nextCard = nextId ? deckCard(nextId) : undefined;
    store.dispatch(session.id, { type: 'quiz/continue', attemptId: current!.attemptId, next: nextCard ? { cardId: nextCard.id, attemptId: newAttemptId(), tokenOrder: shuffledTokenOrder(nextCard.dutch) } : null });
  }

  return <section aria-label="Quiz" className="flex flex-col gap-5">
    <div className="flex justify-between text-sm text-muted"><span>{CATEGORIES[card.category as keyof typeof CATEGORIES]}</span><span>Word order</span></div>
    {stats}
    <article key={current.attemptId} className="flashcard-enter overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
      <CardImage card={card} alt={card.cue} />
      <div className="p-6">
        <p className="text-base text-muted" data-testid="quiz-english">{card.english}</p>
        {!outcome ? <>
          <p className="mt-3 text-sm text-muted">Reproduce the taught sentence. Other Dutch word orders can also be valid, so tap the words in the order you learned.</p>
          <p className="mt-3 min-h-12 rounded-xl border border-dashed border-border p-3 text-lg font-medium" lang="nl" aria-label="Your sentence" data-testid="quiz-answer">{placed.length ? placed.map(id => words[Number(id.slice(1))]).join(' ') : <span className="text-sm font-normal text-muted">Tap the words in the right order</span>}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Words">{current.tokenOrder.map(id => <button key={id} type="button" lang="nl" data-token={id} disabled={placed.includes(id)} className={`${button} disabled:opacity-30`} onClick={() => place(id)}>{words[Number(id.slice(1))]}</button>)}</div>
          <div className="mt-3 grid grid-cols-[2fr_1fr_1fr] gap-2"><button type="button" className={primary} disabled={placed.length !== words.length} onClick={check}>Check</button><button type="button" className={button} disabled={!placed.length} onClick={undo}>Undo</button><button type="button" className={button} disabled={!placed.length} onClick={clear}>Clear</button></div>
        </> : <>
          <p role="status" data-testid="quiz-feedback" className={`mt-3 text-sm font-semibold ${outcome.correct ? 'text-success' : 'text-accent'}`}>{outcome.correct ? `Juist! Correct. +${QUIZ_POINTS} points` : 'That differs from the taught sentence. Here it is:'}</p>
          <p lang="nl" className="mt-2 text-2xl font-semibold leading-snug">{card.dutch}</p>
          {!outcome.correct && <p className="mt-1 text-xs text-muted">Your answer: <span lang="nl">{placed.map(id => words[Number(id.slice(1))]).join(' ')}</span></p>}
          <AudioControls card={card} sound={sound} listen={listen} stop={stop} />
          <GrammarNotes key={card.id} cardId={card.id} variation={card.variation} defaultOpen={!outcome.correct} />
          <VocabLinks card={card} />
        </>}
        <p className="mt-5 text-sm font-semibold" data-testid="correct-progress">{progress.qStreak} / {RETIRE_AT} correct in a row</p>
        <progress aria-label="Correct answers in a row for this sentence" max={RETIRE_AT} value={progress.qStreak} className="flash-progress mt-1 h-1.5 w-full" />
      </div>
    </article>
    {outcome && <button type="button" className={primary} onClick={next}>Continue</button>}
  </section>;
}
