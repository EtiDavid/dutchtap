'use client';
import { useRouter } from 'next/navigation';

/** Goes back to where the learner came from, or to a fallback page when there is no history. */
export function BackButton({ fallback, children }: { fallback: string; children: React.ReactNode }) {
  const router = useRouter();
  return <button type="button" className="text-sm text-muted underline" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>← {children}</button>;
}
