import { Suspense } from 'react';
import { VocabularyScreen } from '@/components/vocabulary/VocabularyScreen';

export default async function VocabularyPage({ searchParams }: { searchParams: Promise<{ card?: string | string[] }> }) {
  const { card } = await searchParams;
  // The language comes from ?lang= or the saved choice, which the page reads on the device, so it needs a Suspense boundary.
  return <Suspense fallback={<main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted">Loading…</p></main>}>
    <VocabularyScreen key={typeof card === 'string' ? card : ''} cardId={typeof card === 'string' ? card : ''} />
  </Suspense>;
}
