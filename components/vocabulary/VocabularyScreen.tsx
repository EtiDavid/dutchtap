'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/flashcards/engine';
import { AppNav } from '../nav/AppNav';
import { BackButton } from '../nav/BackButton';
import { filterVocabulary, VOCABULARY, vocabularyExamples } from '@/lib/vocabulary';

export function VocabularyScreen({ cardId = '' }: { cardId?: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const entries = filterVocabulary(query, category, type, cardId);
  const field = 'mt-2 w-full rounded-xl border border-border bg-white p-3 text-base';

  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-28 pt-6">
    {cardId && <header className="text-sm"><BackButton fallback="/flashcards">Back to where you were</BackButton></header>}
    <div><h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1><p className="mt-2 text-muted">Useful words and expressions from your sentence cards.</p></div>
    {cardId && <p className="text-sm text-muted">Words from this sentence. <Link href="/vocabulary" className="text-accent underline">Browse all words</Link></p>}
    <label className="text-sm font-semibold">Search words<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Dutch, English or Dutch explanation" className={field} /></label>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm font-semibold">Place<select value={category} onChange={event => setCategory(event.target.value)} className={field}><option value="all">All places</option>{Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">Word type<select value={type} onChange={event => setType(event.target.value)} className={field}><option value="all">All types</option>{[...new Set(VOCABULARY.map(entry => entry.type))].map(kind => <option key={kind} value={kind}>{kind}</option>)}</select></label>
    </div>
    <p role="status" className="text-sm text-muted">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
    {!entries.length && <p>No matching words. Try another search or filter.</p>}
    {entries.map(entry => {
      const examples = vocabularyExamples(entry);
      const first = examples[0];
      return <article key={entry.id} id={entry.id} className="scroll-mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 lang="nl" className="text-xl font-bold">{entry.article ? `${entry.article} ` : ''}{entry.headword}</h2>
        <p className="mt-1 text-sm text-muted">{entry.type}{entry.plural ? ` · plural: ${entry.plural}` : ''}</p>
        <p className="mt-3 font-medium">{entry.english}</p><p lang="nl" className="mt-2 leading-relaxed">{entry.explanation}</p>
        {entry.details && <p className="mt-2 text-sm leading-relaxed text-muted">{entry.details}</p>}
        {first && <div className="mt-4 border-t border-border pt-3"><p lang="nl" className="font-medium">{first.card.dutch}</p><p className="mt-1 text-sm text-muted">{first.card.english}</p><p className="mt-2 text-xs text-muted">Form in this example: <span lang="nl">{first.form}</span></p></div>}
        <div className="mt-3 flex flex-wrap gap-3">{examples.map(({ card }) => <Link key={card.id} href={`/sentences/${card.id}`} className="text-sm text-accent underline">View sentence: {card.id}</Link>)}</div>
      </article>;
    })}
    <AppNav />
  </main>;
}
