'use client';
import { useLearningLanguage } from '@/lib/lang/useLanguage';
import type { Lang } from '@/lib/lang';
import { LanguageChooser } from './LanguageChooser';

/** Renders its children only once the learning language is known: no flash of Dutch before French, and a chooser on first launch. */
export function LanguageGate({ children }: { children: (lang: Lang, choose: (lang: Lang) => void) => React.ReactNode }) {
  const { lang, ready, choose } = useLearningLanguage();
  if (!ready) return <main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted" role="status">Loading…</p></main>;
  if (!lang) return <LanguageChooser onChoose={choose} />;
  return <>{children(lang, choose)}</>;
}
