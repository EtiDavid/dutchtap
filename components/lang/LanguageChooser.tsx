'use client';
import { LANGS, LANG_INFO, type Lang } from '@/lib/lang';

/** First launch: what do you want to learn? The app itself stays in clear English. */
export function LanguageChooser({ onChoose }: { onChoose: (lang: Lang) => void }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-8" data-testid="language-chooser">
    <div>
      <p className="flex items-center gap-2.5 text-lg font-bold tracking-tight"><span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-black text-white shadow-[0_6px_14px_rgb(194_65_12/.3)]">D</span>DutchTap</p>
      <h1 className="mt-6 text-[2rem] font-bold leading-tight tracking-tight">What do you want to learn?</h1>
      <p className="mt-2 text-sm text-muted">The app stays in English. You can switch language at any time; your progress in each language is kept separately.</p>
    </div>
    <div className="flex flex-col gap-3" role="group" aria-label="Learning language">
      {LANGS.map(lang => <button key={lang} type="button" onClick={() => onChoose(lang)} data-lang={lang}
        className="flex w-full items-center gap-4 card px-5 py-4 text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span aria-hidden className="text-3xl">{LANG_INFO[lang].flag}</span>
        <span><span className="block text-lg font-semibold" lang={lang}>{LANG_INFO[lang].native} <span className="font-normal text-muted">/ {LANG_INFO[lang].english}</span></span>
          <span className="block text-sm text-muted">{LANG_INFO[lang].blurb}</span></span>
      </button>)}
    </div>
  </main>;
}
