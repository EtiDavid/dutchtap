'use client';
import Image from 'next/image';
import Link from 'next/link';
import { wordsForCard } from '@/lib/vocabulary';
import type { Card } from '@/lib/flashcards/engine';
import { button } from '../flashcards/styles';

export function CardImage({ card, alt, priority = true }: { card: Card; alt: string; priority?: boolean }) {
  return card.imageStatus === 'pending'
    ? <div className="flex aspect-[3/2] items-center justify-center bg-surface p-6 text-center text-sm text-muted">Illustration awaiting generation</div>
    : <Image src={card.image} alt={alt} width={1536} height={1024} priority={priority} className="aspect-[3/2] w-full object-cover" />;
}

export function AudioControls({ card, sound, listen, stop }: { card: Card; sound: string; listen: (card: Card, slow?: boolean) => void | Promise<void>; stop: () => void }) {
  return <>
    {card.audioStatus === 'awaiting-recording'
      ? <p className="mt-4 text-sm text-muted">Diederik recording awaiting installation.</p>
      : <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => void listen(card)}>Listen</button><button type="button" className={button} onClick={() => void listen(card, true)}>Listen slowly</button><button type="button" aria-label="Stop audio" className={button} onClick={stop}>Stop</button></div>}
    {sound && <p role="status" className="mt-2 text-xs text-muted">{sound}</p>}
  </>;
}

export function VocabLinks({ card }: { card: Card }) {
  const words = wordsForCard(card.id);
  return <>
    {words.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{words.map(word => <Link key={word.id} href={`/vocabulary?card=${card.id}#${word.id}`} lang="nl" className="text-sm text-accent underline">{word.headword}</Link>)}</div>}
    <Link href={words.length ? `/vocabulary?card=${card.id}` : '/vocabulary'} className="mt-3 block text-sm text-accent underline">{words.length ? 'Vocabulary for this sentence' : 'Browse vocabulary'}</Link>
  </>;
}
