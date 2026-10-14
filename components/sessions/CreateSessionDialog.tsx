'use client';
import { useState } from 'react';
import { CATEGORIES, LEVEL_LABELS, type Level, type Reviews } from '@/lib/flashcards/engine';
import { LANG_INFO, type Lang } from '@/lib/lang';
import { checkCreation, createSession, defaultSessionName, levelAvailability, levelCounts } from '@/lib/sessions/engine';
import { MAX_ACTIVE_SESSIONS, MAX_SESSION_CARDS, type Session } from '@/lib/sessions/types';
import { Modal } from '../ui/Modal';
import { button, primary } from '../flashcards/styles';

const COUNTS = [10, 20, 30, 50] as const;
const field = 'mt-2 w-full rounded-xl border border-border bg-white p-3 text-base';

/**
 * Create a session: choose the place (topic), how many cards, and ONE starting knowledge level. The cards are picked once,
 * here, and never change. Levels that cannot supply the requested count are disabled with an explanation; nothing is substituted.
 */
export function CreateSessionDialog({ lang, reviews, activeCount, onCreate, onClose }: { lang: Lang; reviews: Reviews; activeCount: number; onCreate: (session: Session) => string | null; onClose: () => void }) {
  const [topic, setTopic] = useState('all');
  const [choice, setChoice] = useState<number | 'custom'>(10);
  const [custom, setCustom] = useState('15');
  const [level, setLevel] = useState<Level>('difficult');
  const [name, setName] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const count = choice === 'custom' ? (/^\d+$/.test(custom.trim()) ? Number(custom) : NaN) : choice;
  const counts = levelCounts(topic, reviews, lang);
  const availability = levelAvailability(topic, count, reviews, lang);
  const check = checkCreation({ topic, count, level, lang }, reviews, activeCount);
  const suggested = defaultSessionName(topic, Number.isFinite(count) ? count : 10, level, new Date(), lang);
  const countValid = Number.isInteger(count) && count >= 1 && count <= MAX_SESSION_CARDS;
  const selected = availability.find(a => a.level === level)!;
  // The learner's own choice is explained first, whichever other levels (if any) could supply the count.
  const selectedUnavailable = countValid && !selected.enough && activeCount < MAX_ACTIVE_SESSIONS;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!check.ok) return;
    const session = createSession({ topic, count, level, lang, reviews, name: name.trim() || suggested });
    if (!session) { setServerError('Not enough cards at that level. Choose another level or fewer cards.'); return; }
    const error = onCreate(session);
    if (error) setServerError(error);
  }

  return <Modal title="Create a session" onClose={onClose}>
    <form onSubmit={submit} className="mt-4 flex flex-col gap-5" noValidate>
      <p className="text-sm text-muted" data-testid="create-language">Language: <strong lang={lang}>{LANG_INFO[lang].flag} {LANG_INFO[lang].native}</strong>. A session keeps its language. Levels below are your {LANG_INFO[lang].english} levels.</p>
      {activeCount >= MAX_ACTIVE_SESSIONS && <p role="alert" className="rounded-xl bg-accent/10 p-3 text-sm">You already have {MAX_ACTIVE_SESSIONS} active sessions across all languages. Finish one (complete Speaking and the Quiz) or delete one to make room.</p>}

      <label className="text-sm font-semibold">Place (topic)
        <select data-autofocus value={topic} onChange={event => setTopic(event.target.value)} className={field}>
          <option value="all">All places</option>
          {Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">How many cards?</legend>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {COUNTS.map(n => <button key={n} type="button" aria-pressed={choice === n} onClick={() => setChoice(n)} className={`${button} min-w-0 px-0 ${choice === n ? 'border-accent bg-accent text-white' : ''}`}>{n}</button>)}
          <button type="button" aria-pressed={choice === 'custom'} onClick={() => setChoice('custom')} className={`${button} min-w-0 px-0 ${choice === 'custom' ? 'border-accent bg-accent text-white' : ''}`}>Other</button>
        </div>
        {choice === 'custom' && <label className="mt-2 block text-sm">Number of cards (1 to {MAX_SESSION_CARDS})
          <input inputMode="numeric" value={custom} onChange={event => setCustom(event.target.value)} aria-invalid={!Number.isInteger(count) || count < 1 || count > MAX_SESSION_CARDS} className={field} />
        </label>}
        {check.ok === false && check.code === 'count' && <p role="alert" className="mt-2 text-sm text-accent">{check.message}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Start with cards you rated…</legend>
        <p className="mt-1 text-xs text-muted">Your current levels in {topic === 'all' ? 'all places' : CATEGORIES[topic as keyof typeof CATEGORIES]}. Cards you have not rated yet count as Difficult.</p>
        <div className="mt-2 flex flex-col gap-2" role="radiogroup" aria-label="Starting level">
          {availability.map(a => {
            const selected = level === a.level;
            return <div key={a.level}>
              <button type="button" role="radio" aria-checked={selected} aria-disabled={!a.enough} disabled={!a.enough} onClick={() => setLevel(a.level)} data-level={a.level}
                className={`${button} flex w-full items-center justify-between disabled:opacity-50 ${selected ? 'border-accent bg-accent text-white' : ''}`}>
                <span>{LEVEL_LABELS[a.level]}</span><span className="text-xs font-normal">{counts[a.level]} {counts[a.level] === 1 ? 'card' : 'cards'}</span>
              </button>
              {!a.enough && a.message && <p className="mt-1 text-xs text-muted" data-testid={`why-${a.level}`}>{a.message}</p>}
            </div>;
          })}
        </div>
        {selectedUnavailable && <p role="alert" className="mt-2 rounded-xl bg-accent/10 p-3 text-sm" data-testid="level-unavailable">{selected.message} Please choose another level or fewer cards.{check.ok === false && check.code === 'none' ? ` ${check.message}` : ''}</p>}
      </fieldset>

      <label className="text-sm font-semibold">Session name
        <input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder={suggested} className={field} />
      </label>

      {serverError && <p role="alert" className="text-sm text-accent">{serverError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={button} onClick={onClose}>Cancel</button>
        <button type="submit" className={primary} disabled={!check.ok}>Create session</button>
      </div>
    </form>
  </Modal>;
}
