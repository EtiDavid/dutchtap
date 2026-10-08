import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CARDS } from '@/lib/flashcards/engine';
import { wordsForCard } from '@/lib/vocabulary';
import { AppNav } from '@/components/nav/AppNav';
import { BackButton } from '@/components/nav/BackButton';
import { GrammarNotes } from '@/components/flashcards/GrammarNotes';

export function generateStaticParams() { return CARDS.map(card => ({ id: card.id })); }

export default async function SentencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = CARDS.find(card => card.id === id);
  if (!card) notFound();
  const words = wordsForCard(id);
  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-28 pt-6">
    <header className="flex justify-between text-sm"><BackButton fallback="/vocabulary">Back</BackButton><Link href="/flashcards" className="font-semibold text-accent underline">Continue flashcards</Link></header>
    <h1 className="text-3xl font-bold">Sentence example</h1>
    <article className="overflow-hidden rounded-3xl border border-border bg-white">
      {card.imageStatus === 'pending' ? <div className="flex aspect-[3/2] items-center justify-center bg-surface p-6 text-sm text-muted">Illustration awaiting generation</div> : <Image src={card.image} alt={card.cue} width={1536} height={1024} className="aspect-[3/2] w-full object-cover" />}
      <div className="p-6"><p lang="nl" className="text-2xl font-semibold">{card.dutch}</p><p className="mt-3 text-muted">{card.english}</p><GrammarNotes cardId={card.id} variation={card.variation} defaultOpen /></div>
    </article>
    <div className="flex flex-wrap gap-3">{words.map(word => <Link key={word.id} href={`/vocabulary#${word.id}`} lang="nl" className="text-accent underline">{word.headword}</Link>)}</div>
    <AppNav />
  </main>;
}
