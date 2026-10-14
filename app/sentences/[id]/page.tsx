import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CARDS } from '@/lib/flashcards/engine';
import { SentenceView } from '@/components/sessions/SentenceView';

export function generateStaticParams() { return CARDS.map(card => ({ id: card.id })); }

export default async function SentencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!CARDS.some(card => card.id === id)) notFound();
  // One prerendered page serves both languages; the language is chosen on the device (?lang= or the saved choice).
  return <Suspense fallback={<main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted">Loading…</p></main>}><SentenceView id={id} /></Suspense>;
}
