'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CARDS, CATEGORIES, drawCard, quizWeight, recordQuiz } from '@/lib/flashcards/engine';
import { buildExercise, isBlankCorrect, isOrderCorrect, pickKind, type Exercise } from '@/lib/flashcards/exercises';
import { useReviews } from '@/lib/flashcards/useReviews';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { button, primary } from '../flashcards/styles';
import { GrammarNotes } from '../flashcards/GrammarNotes';
import { AppNav } from '../nav/AppNav';
import { StreakBadge } from '../practice/StreakBadge';
import { loadQuizSession, saveQuizSession } from '@/lib/flashcards/sessionStore';
import { usePracticeStreak } from '@/lib/practice/usePracticeStreak';

type Question = { id: string; exercise: Exercise };

export function QuizScreen() {
  const { account, reviews, ready, status, persist, guestAvailable, copyGuest } = useReviews();
  const { sound, listen, stop } = useCardAudio();
  const { streak, practisedToday, record } = usePracticeStreak();
  const [category, setCategory] = useState('all');
  const [question, setQuestion] = useState<Question | null>(null);
  const [asked, setAsked] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<'right' | 'wrong' | null>(null);

  // Becomes true once a saved quiz has been looked for, so the menu doesn't flash before a resume.
  const [restored, setRestored] = useState(false);
  const restoring = useRef(false);

  const card = CARDS.find(c => c.id === question?.id);
  const exercise = question?.exercise;

  // Resume the question that was on screen after a refresh or after visiting another page.
  // The exercise is rebuilt from the card and question number, so it is exactly the same one.
  useEffect(() => {
    if (!ready || restoring.current) return;
    restoring.current = true;
    const saved = loadQuizSession();
    const savedCard = saved && CARDS.find(c => c.id === saved.cardId);
    const rebuilt = savedCard && buildExercise(savedCard, pickKind(saved.n), String(saved.n));
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after mount */
    if (saved && savedCard && rebuilt) {
      setCategory(saved.category); setQuestion({ id: savedCard.id, exercise: rebuilt }); setAsked(saved.n); setOutcome(saved.outcome);
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready]);
  useEffect(() => {
    if (!restored) return;
    saveQuizSession(question ? { category, n: asked, cardId: question.id, outcome } : null);
  }, [restored, category, question, asked, outcome]);

  function ask(n: number, from = reviews, avoid?: string) {
    stop(); setBuilt([]); setOutcome(null);
    const ids = CARDS.filter(c => category === 'all' || c.category === category).map(c => c.id);
    const id = drawCard(ids, from, quizWeight, Math.random, avoid);
    const picked = CARDS.find(c => c.id === id);
    const built = picked && buildExercise(picked, pickKind(n), String(n));
    if (!picked || !built) { setQuestion(null); return; }
    setQuestion({ id: picked.id, exercise: built }); setAsked(n);
  }
  function answer(right: boolean) {
    if (!card) return;
    setOutcome(right ? 'right' : 'wrong'); record();
    void persist({ ...reviews, [card.id]: recordQuiz(card.id, reviews[card.id], right) });
  }

  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-28 pt-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Quiz</h1><p className="mt-2 text-muted">Tap the missing word, or tap the words into the right order.</p></div>
    <p className="text-xs text-muted" role="status">{status} {account && <button onClick={() => void persist(reviews)} disabled={!ready} className="ml-2 underline">Retry sync</button>}</p>

    {!restored ? <p className="text-muted" role="status">Loading your quiz…</p> : !card || !exercise ? <>
      <StreakBadge streak={streak} practisedToday={practisedToday} />
      <label className="text-sm font-semibold">Choose a place<select value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base"><option value="all">Everyday mix</option>{Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <p className="text-sm leading-relaxed text-muted">The quiz uses the same pictures and sentences as the flashcards. Sentences you get wrong come back sooner; ones you get right again and again appear less often. There is no score.</p>
      <button className={primary} disabled={!ready} onClick={() => ask(0)}>Start the quiz</button>
      {guestAvailable && <button className={button} onClick={copyGuest}>Copy my guest progress to this account</button>}
    </> : <>
      <div className="flex justify-between text-sm text-muted"><span>{CATEGORIES[card.category as keyof typeof CATEGORIES]}</span><span>{exercise.kind === 'blank' ? 'Fill the blank' : 'Word order'}</span></div>
      <article key={asked} className="flashcard-enter overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        {card.imageStatus === 'pending' ? <div className="flex aspect-[3/2] items-center justify-center bg-surface p-6 text-center text-sm text-muted">Illustration awaiting generation</div> : <Image src={card.image} alt={card.cue} width={1536} height={1024} priority className="aspect-[3/2] w-full object-cover" />}
        <div className="p-6">
          <p className="text-base text-muted">{card.english}</p>
          {!outcome ? (exercise.kind === 'blank' ? <>
            <p lang="nl" className="mt-3 text-2xl font-semibold leading-snug">{exercise.before}<span className="mx-1 inline-block min-w-12 border-b-2 border-accent text-center text-accent" aria-label="blank">&nbsp;</span>{exercise.after}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">{exercise.options.map(o => <button key={o} lang="nl" className={button} onClick={() => answer(isBlankCorrect(exercise, o))}>{o}</button>)}</div>
          </> : <>
            <p className="mt-3 text-sm text-muted">Reproduce the taught sentence. Other Dutch word orders can also be valid.</p>
            <p className="mt-3 min-h-12 rounded-xl border border-dashed border-border p-3 text-lg font-medium" lang="nl" aria-label="Your sentence">{built.length ? built.map(i => exercise.words[i]).join(' ') : <span className="text-sm font-normal text-muted">Tap the words in the right order</span>}</p>
            <div className="mt-3 flex flex-wrap gap-2">{exercise.words.map((w, i) => <button key={i} lang="nl" disabled={built.includes(i)} className={`${button} disabled:opacity-30`} onClick={() => setBuilt([...built, i])}>{w}</button>)}</div>
            <div className="mt-3 grid grid-cols-[2fr_1fr] gap-2"><button className={primary} disabled={built.length !== exercise.words.length} onClick={() => answer(isOrderCorrect(exercise, built.map(i => exercise.words[i])))}>Check</button><button className={button} disabled={!built.length} onClick={() => setBuilt(built.slice(0, -1))}>Undo</button></div>
          </>) : <>
            <p role="status" className={`mt-3 text-sm font-semibold ${outcome === 'right' ? 'text-success' : 'text-accent'}`}>{outcome === 'right' ? 'Juist! Correct.' : exercise.kind === 'order' ? 'That differs from the taught sentence. Here it is:' : 'Not quite. Here is the sentence:'}</p>
            <p lang="nl" className="mt-2 text-2xl font-semibold leading-snug">{card.dutch}</p>
            {card.audioStatus === 'awaiting-recording' ? <p className="mt-4 text-sm text-muted">Diederik recording awaiting installation.</p> : <div className="mt-4 flex gap-2"><button className={button} onClick={() => void listen(card)}>Listen</button><button className={button} onClick={() => void listen(card, true)}>Listen slowly</button><button aria-label="Stop audio" className={button} onClick={stop}>Stop</button></div>}
            {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
            <GrammarNotes key={card.id} cardId={card.id} variation={card.variation} />
          </>}
        </div>
      </article>
      {outcome && <button className={primary} onClick={() => ask(asked + 1, undefined, card.id)}>Continue</button>}
      <button className="text-sm text-muted underline" onClick={() => { stop(); setQuestion(null); }}>Finish for now</button>
    </>}
    <AppNav />
  </main>;
}
