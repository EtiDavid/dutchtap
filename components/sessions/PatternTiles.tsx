import Link from 'next/link';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { CARDS } from '@/lib/flashcards/engine';
import { Icon } from '../ui/Icon';

/** Short names for the tiles; the full names appear in the Create session form. */
const SHORT: Record<keyof typeof GRAMMAR_AREAS, { title: string; hint: string }> = {
  inversion: { title: 'Verb second', hint: 'Morgen heb ik…' },
  omdat: { title: 'Omdat', hint: 'omdat ik ziek ben' },
  dat: { title: 'Dat', hint: 'ik denk dat…' },
  als: { title: 'Als', hint: 'als het regent…' },
  wanneer: { title: 'Wanneer', hint: 'wanneer ik thuis ben…' },
  terwijl: { title: 'Terwijl', hint: 'terwijl ik werk…' },
  voordat: { title: 'Voordat', hint: 'voordat ik vertrek…' },
  nadat: { title: 'Nadat', hint: 'nadat ik heb gegeten…' },
  tot: { title: 'Tot', hint: 'tot de bus komt' },
  toen: { title: 'Toen', hint: 'toen ik jong was' },
  verbs: { title: 'Verbs', hint: 'probeer · probeerde' },
  separable: { title: 'Separable verbs', hint: 'ik stuur op' },
  tense: { title: 'Past & perfect', hint: 'ging · ben gegaan' },
};
const counts = new Map<string, number>();
for (const card of CARDS) if (card.collection === 'grammar') counts.set(card.category, (counts.get(card.category) ?? 0) + 1);

/** Each grammar pattern is a set of real sentences: choose one to start a session (Study, Say it, Word order, with levels). */
export function PatternTiles() {
  return <div className="grid grid-cols-3 gap-3" data-testid="pattern-tiles">
    {(Object.keys(GRAMMAR_AREAS) as (keyof typeof GRAMMAR_AREAS)[]).map(id =>
      <Link key={id} href={`/flashcards?new=grammar:${id}`} aria-label={`${GRAMMAR_AREAS[id]}: ${counts.get(id) ?? 0} sentences`} className="card tap tap-hover flex min-h-[7.25rem] flex-col justify-between gap-2 p-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name="layers" className="h-[1.125rem] w-[1.125rem]" /></span>
        <span>
          <span className="block text-[0.8125rem] font-semibold leading-snug">{SHORT[id].title}</span>
          <span className="mt-0.5 block text-xs text-muted">{counts.get(id) ?? 0} sentences</span>
        </span>
      </Link>)}
  </div>;
}
