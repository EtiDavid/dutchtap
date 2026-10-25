import type { ReactNode } from 'react';

/** One small, consistent icon set (24px grid, 1.75 stroke) so the interface never leans on emoji for structure. */
const PATHS = {
  today: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>,
  practise: <><rect x="4" y="6" width="13" height="14" rx="2.5" /><path d="M8 3h9a3 3 0 0 1 3 3v10" /><path d="M8 11h5M8 15h3" /></>,
  words: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M9 8h6M9 12h4" /></>,
  progress: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  flame: <><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.2 1 1.8 1.8 2C10.5 8 11 5.5 12 3z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  chevron: <><path d="m9 6 6 6-6 6" /></>,
  back: <><path d="m15 6-6 6 6 6" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" /></>,
  book: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></>,
  pencil: <><path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" /><path d="m14.5 6.5 3 3" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  puzzle: <><path d="M9 4h3a2 2 0 1 1 4 0h3v4a2 2 0 1 0 0 4v4H4V4z" transform="translate(0 2)" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
  headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'h-5 w-5', filled = false }: { name: IconName; className?: string; filled?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>;
}
