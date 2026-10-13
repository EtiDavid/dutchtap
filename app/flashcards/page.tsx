import { Suspense } from 'react';
import { FlashcardsApp } from '@/components/sessions/FlashcardsApp';

export default function FlashcardsPage() {
  // useSearchParams (?session=ID&mode=...) needs a Suspense boundary on a prerendered page.
  return <Suspense fallback={<main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted">Loading your sessions…</p></main>}><FlashcardsApp /></Suspense>;
}
