'use client';
import { useState } from 'react';
import { LANGS, LANG_INFO, type Lang } from '@/lib/lang';
import { Modal } from '../ui/Modal';
import { button } from '../flashcards/styles';

/**
 * The visible language switch. Switching stops anything playing, keeps every saved session, and opens the chosen language's
 * own dashboard when the learner is inside a session (a session never changes language).
 */
export function LanguageSwitch({ lang, onSwitch }: { lang: Lang; onSwitch: (lang: Lang) => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} data-testid="language-switch" aria-haspopup="dialog"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">
      <span aria-hidden>{LANG_INFO[lang].flag}</span><span lang={lang}>{LANG_INFO[lang].native}</span><span className="sr-only">: change learning language</span>
    </button>
    {open && <Modal title="Learning language" onClose={() => setOpen(false)}>
      <p className="mt-2 text-sm text-muted">Your sessions and card levels are kept separately for each language. Nothing is lost when you switch.</p>
      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Learning language">
        {LANGS.map(option => <button key={option} type="button" role="radio" aria-checked={option === lang} data-lang={option} data-autofocus={option === lang ? true : undefined}
          onClick={() => { setOpen(false); if (option !== lang) onSwitch(option); }}
          className={`${button} flex items-center gap-3 text-left ${option === lang ? 'border-accent bg-accent text-white' : ''}`}>
          <span aria-hidden>{LANG_INFO[option].flag}</span><span lang={option}>{LANG_INFO[option].native}</span><span className="font-normal opacity-80">{LANG_INFO[option].english}</span>
        </button>)}
      </div>
      <button type="button" className={`${button} mt-4 w-full`} onClick={() => setOpen(false)}>Close</button>
    </Modal>}
  </>;
}
