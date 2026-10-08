'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sessionsInProgress } from '@/lib/flashcards/sessionStore';

const TABS = [
  { href: '/', label: 'Home', icon: '🏠', session: null },
  { href: '/flashcards', label: 'Flashcards', icon: '🃏', session: 'flashcards' },
  { href: '/quiz', label: 'Quiz', icon: '✏️', session: 'quiz' },
  { href: '/vocabulary', label: 'Words', icon: '📖', session: null },
] as const;

/**
 * Bottom tab bar shared by the learning pages. Tabs with a session waiting show a dot,
 * and opening that tab resumes exactly where the learner left off.
 */
export function AppNav() {
  const pathname = usePathname();
  const [waiting, setWaiting] = useState({ flashcards: false, quiz: false });
  // Sessions live in localStorage, so they are read after mount and re-read when the page changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setWaiting(sessionsInProgress()); }, [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 backdrop-blur">
    <ul className="mx-auto grid max-w-lg grid-cols-4">
      {TABS.map(tab => {
        const active = isActive(tab.href);
        const resumable = tab.session && waiting[tab.session] && !active;
        return <li key={tab.href}>
          <Link href={tab.href} aria-current={active ? 'page' : undefined} className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent ${active ? 'text-accent' : 'text-muted'}`}>
            <span aria-hidden className="text-lg">{tab.icon}</span>
            {tab.label}
            {resumable && <><span aria-hidden className="absolute right-[28%] top-2 h-2.5 w-2.5 rounded-full bg-accent" /><span className="sr-only">, session in progress</span></>}
          </Link>
        </li>;
      })}
    </ul>
  </nav>;
}
