'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CARDS, CATEGORIES, DEFAULT_LEVEL, LEVELS, LEVEL_LABELS, countByLevel, drawCard, flashcardWeight, pickCardSet, rateLevel, type Level } from '@/lib/flashcards/engine';
import { useReviews } from '@/lib/flashcards/useReviews';
import { useCardAudio } from '@/lib/flashcards/useCardAudio';
import { button, primary } from './styles';
import { wordsForCard } from '@/lib/vocabulary';
import { masteredTotal, milestoneCrossed, milestoneMessage } from '@/lib/flashcards/milestones';
import { loadFlashcardSession, saveFlashcardSession } from '@/lib/flashcards/sessionStore';
import { usePracticeStreak } from '@/lib/practice/usePracticeStreak';
import { AppNav } from '@/components/nav/AppNav';
import { StreakBadge } from '@/components/practice/StreakBadge';
import { GrammarNotes } from './GrammarNotes';
import { LevelBar } from './LevelBar';

type Mode = 'read' | 'say';
const MODES: Record<Mode, { title: string; blurb: string; action: string }> = {
  read: { title: 'Read & understand', blurb: 'See the Dutch sentence with its picture. Read it, listen, and think about what it means.', action: 'Start reading' },
  say: { title: 'Say it from memory', blurb: 'See only a picture and a situation. Say the Dutch out loud, then check how it is really said.', action: 'Start saying' },
};
const SIZES: { label: string; size: number | null }[] = [{ label: '10 cards', size: 10 }, { label: '20 cards', size: 20 }, { label: '30 cards', size: 30 }, { label: 'Unlimited', size: null }];

export function FlashcardScreen() {
  const { account, reviews, ready, status, persist, guestAvailable, copyGuest } = useReviews();
  const { sound, listen, stop } = useCardAudio();
  const { streak, practisedToday, record } = usePracticeStreak();
  const [category, setCategory] = useState('all');
  const [choosing, setChoosing] = useState<Mode | null>(null);
  const [mode, setMode] = useState<Mode>('read');
  const [set, setSet] = useState<string[]>([]);
  const [cardId, setCardId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
  const [celebration, setCelebration] = useState('');
  // Becomes true once a saved session has been looked for, so the menu doesn't flash before a resume.
  const [restored, setRestored] = useState(false);
  const restoring = useRef(false);

  // Resume an in-progress session after a refresh or after visiting another page. Waits for progress to load
  // so the resumed session never saves over progress that has not been read yet.
  useEffect(() => {
    if (!ready || restoring.current) return;
    restoring.current = true;
    const saved = loadFlashcardSession();
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after mount */
    if (saved) {
      setCategory(saved.category); setMode(saved.mode); setSet(saved.set); setCardId(saved.cardId);
      setRevealed(saved.revealed); setLevel(saved.level);
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready]);
  useEffect(() => {
    if (!restored) return;
    saveFlashcardSession(cardId ? { mode, category, set, cardId, revealed, level } : null);
  }, [restored, mode, category, set, cardId, revealed, level]);

  const selected = CARDS.filter(c => category === 'all' || c.category === category);
  const counts = countByLevel(selected, reviews);
  const card = CARDS.find(c => c.id === cardId);

  function show(id: string | null, from = reviews) {
    stop(); setCardId(id); setRevealed(false); setLevel(id ? from[id]?.level ?? DEFAULT_LEVEL : DEFAULT_LEVEL);
  }
  function begin(size: number | null) {
    if (!choosing) return;
    const chosen = pickCardSet(selected.map(c => c.id), reviews, size);
    setMode(choosing); setChoosing(null); setSet(chosen);
    show(drawCard(chosen, reviews, flashcardWeight) ?? null);
  }
  function next() {
    if (!card) return;
    const updated = { ...reviews, [card.id]: rateLevel(card.id, reviews[card.id], level) };
    void persist(updated); record();
    const crossed = milestoneCrossed(masteredTotal(reviews), masteredTotal(updated));
    setCelebration(crossed ? milestoneMessage(crossed) : '');
    show(drawCard(set, updated, flashcardWeight, Math.random, card.id) ?? null, updated);
  }
  function finish() { stop(); setCardId(null); setSet([]); setCelebration(''); }
  function skip() {
    if (!card) return;
    show(drawCard(set, reviews, flashcardWeight, Math.random, card.id) ?? null);
  }

  const levelPicker = card && (mode === 'read' || revealed) && <section aria-label="How well do you know this card?">
    <p className="mb-2 text-center text-sm text-muted">How well do you know this card?</p>
    <div className="grid grid-cols-4 gap-2">{LEVELS.map(l => <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)} className={`${button} px-1 ${level === l ? 'border-accent bg-accent text-white' : ''}`}>{LEVEL_LABELS[l]}</button>)}</div>
    <button className={`${primary} mt-3 w-full`} onClick={next}>Next card</button>
  </section>;

  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-28 pt-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Flashcards</h1><p className="mt-2 text-muted">Learn everyday Dutch sentences with pictures and sound.</p></div>
    <p className="text-xs text-muted" role="status">{status} {account && <button onClick={() => void persist(reviews)} disabled={!ready} className="ml-2 underline">Retry sync</button>}</p>

    {!restored ? <p className="text-muted" role="status">Loading your flashcards…</p> : !card ? <>
      <StreakBadge streak={streak} practisedToday={practisedToday} />
      <LevelBar counts={counts} />
      <label className="text-sm font-semibold">Choose a place<select value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base"><option value="all">Everyday mix</option>{Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {(Object.keys(MODES) as Mode[]).map(m => <section key={m} className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">{MODES[m].title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{MODES[m].blurb}</p>
        <button className={`${primary} mt-4 w-full`} disabled={!ready} onClick={() => setChoosing(m)}>{MODES[m].action}</button>
      </section>)}
      {guestAvailable && <button className={button} onClick={copyGuest}>Copy my guest flashcard progress to this account</button>}
    </> : <>
      {celebration && <p role="status" data-testid="milestone" className="flex items-start justify-between gap-3 rounded-2xl bg-success/15 px-4 py-3 text-sm font-semibold"><span>🏆 {celebration}</span><button type="button" aria-label="Dismiss" className="text-muted" onClick={() => setCelebration('')}>✕</button></p>}
      <div className="flex justify-between text-sm text-muted"><span>{CATEGORIES[card.category as keyof typeof CATEGORIES]}</span><span>{MODES[mode].title}</span></div>
      <article key={card.id + (cardId ?? '')} className="flashcard-enter overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        {card.imageStatus === 'pending' ? <div className="flex aspect-[3/2] items-center justify-center bg-surface p-6 text-center text-sm text-muted">Illustration awaiting generation</div> : <Image src={card.image} alt={mode === 'say' && !revealed ? card.scenario : card.cue} width={1536} height={1024} priority className="aspect-[3/2] w-full object-cover" />}
        <div className="p-6">
          {mode === 'say' && !revealed ? <>
            <p className="text-lg leading-snug">{card.scenario}</p>
            <p className="mt-4 text-xl font-bold text-accent">How do you say it?</p>
            <p className="mt-1 text-sm text-muted">Say it out loud first, then check.</p>
          </> : <>
            <p lang="nl" className="text-2xl font-semibold leading-snug">{card.dutch}</p>
            <p className="mt-3 text-base text-muted">{card.english}</p>
            {card.audioStatus === 'awaiting-recording' ? <p className="mt-4 text-sm text-muted">Diederik recording awaiting installation.</p> : <div className="mt-4 flex gap-2"><button className={button} onClick={() => void listen(card)}>Listen</button><button className={button} onClick={() => void listen(card, true)}>Listen slowly</button><button aria-label="Stop audio" className={button} onClick={stop}>Stop</button></div>}
            {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
            <GrammarNotes key={card.id} cardId={card.id} variation={card.variation} />
            <div className="mt-4 flex flex-wrap gap-3">{wordsForCard(card.id).map(word => <Link key={word.id} href={`/vocabulary?card=${card.id}#${word.id}`} lang="nl" className="text-sm text-accent underline">{word.headword}</Link>)}</div>
            <Link href={wordsForCard(card.id).length ? `/vocabulary?card=${card.id}` : '/vocabulary'} className="mt-3 block text-sm text-accent underline">{wordsForCard(card.id).length ? 'Vocabulary for this sentence' : 'Browse vocabulary'}</Link>
          </>}
        </div>
      </article>
      {mode === 'say' && !revealed && <button className={primary} onClick={() => setRevealed(true)}>Check the Dutch</button>}
      <button className={button} onClick={skip}>Skip without rating</button>
      {levelPicker}
      <button className="text-sm text-muted underline" onClick={finish}>Finish for now</button>
    </>}

    {choosing && <div role="dialog" aria-modal="true" aria-label="How many cards do you want to practise?" className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold">How many cards do you want to practise?</h2>
        <p className="mt-2 text-sm text-muted">Cards you find difficult come up most. You can stop whenever you like.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">{SIZES.map(s => <button key={s.label} className={button} onClick={() => begin(s.size)}>{s.label}</button>)}</div>
        <button className="mt-4 w-full text-sm text-muted underline" onClick={() => setChoosing(null)}>Cancel</button>
      </div>
    </div>}
    <AppNav />
  </main>;
}
