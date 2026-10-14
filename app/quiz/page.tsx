import { Suspense } from 'react';
import { QuizChooser } from '@/components/sessions/QuizChooser';

export default function QuizPage() {
  // The language is read from ?lang= or the saved choice on the device, which needs a Suspense boundary.
  return <Suspense fallback={<main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted">Loading…</p></main>}><QuizChooser /></Suspense>;
}
