"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppNav } from "../nav/AppNav";
import { PageHeader } from "../ui/PageHeader";
import { button, primary } from "../flashcards/styles";
import { GRAMMAR_AREAS } from "@/lib/content/collections";
import { useMixedProgress } from "@/lib/useMixedProgress";
import { ROUND_SIZE, buildRound, recordAnswer, shuffledOptions, topicAccuracy, type MixedChallenge, type MixedOption, type MixedProgress } from "@/lib/grammarMixed";

const topicName = (id: string) => (GRAMMAR_AREAS as Record<string, string>)[id]?.split(" · ")[0] ?? id;

type Step = { challenge: MixedChallenge; options: MixedOption[] };

const freshRound = (saved: MixedProgress): Step[] => buildRound(saved, Math.random, ROUND_SIZE).map(challenge => ({ challenge, options: shuffledOptions(challenge, Math.random) }));

/** Uncued mixed grammar: a Dutch situation, no conjunction named, and the learner picks the construction that fits. Client-only: it reads this device's saved answers on first render. */
export default function MixedGrammar() {
  const { progress, ready, status, save, account, guestAvailable, copyGuest } = useMixedProgress();
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [help, setHelp] = useState(false);
  const [score, setScore] = useState(0);
  const newRound = () => { setSteps(freshRound(progress)); setIndex(0); setPicked(null); setHelp(false); setScore(0); };

  // The first round is drawn once this learner's saved answers (device or account) are loaded, so weak situations come first.
  if (ready && steps.length === 0) setSteps(freshRound(progress));
  const step = steps[index];
  const done = steps.length > 0 && index >= steps.length;
  const weakest = useMemo(() => topicAccuracy(progress).filter(t => t.seen >= 2 && t.right / t.seen < 0.75).slice(0, 3), [progress]);

  const choose = (i: number) => {
    if (picked !== null || !step) return;
    const right = step.options[i].correct;
    const next = recordAnswer(progress, step.challenge.id, right);
    void save(next); setPicked(i); if (right) setScore(s => s + 1);
  };
  const advance = () => { setIndex(i => i + 1); setPicked(null); setHelp(false); };

  return <main className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6">
    <PageHeader eyebrow="Grammar" title="Mixed grammar" subtitle="Read the situation in Dutch and choose the sentence that fits. The situation never names the word you need." />
    {!ready && <p className="text-sm text-muted" role="status">Loading your saved answers…</p>}
    {step && <section aria-label="Challenge" className="flex flex-col gap-4" data-testid="mixed-challenge">
      <p className="text-xs text-muted" data-testid="mixed-progress">Question {index + 1} of {steps.length}</p>
      <p lang="nl" className="text-lg leading-relaxed" data-testid="mixed-situation">{step.challenge.situationNl}</p>
      <button type="button" className={button} aria-pressed={help} onClick={() => setHelp(!help)}>{help ? "Hide English help" : "Show English help"}</button>
      {help && <p className="text-sm text-muted" data-testid="mixed-help">{step.challenge.hintEn}</p>}
      <ul className="flex flex-col gap-2" aria-label="Sentences to choose from">
        {step.options.map((option, i) => {
          const chosen = picked === i;
          const state = picked === null ? "" : option.correct ? "border-accent bg-accent-soft" : chosen ? "border-red-500" : "opacity-70";
          return <li key={option.text}>
            <button type="button" lang="nl" disabled={picked !== null} onClick={() => choose(i)} data-correct={picked !== null ? String(option.correct) : undefined}
              className={`card tap w-full border p-3.5 text-left ${state}`} data-testid="mixed-option">{option.text}</button>
            {picked !== null && (chosen || option.correct) && <p className="mt-1 px-1 text-sm" data-testid={option.correct ? "mixed-why-correct" : "mixed-why-wrong"}>{option.correct ? "Fits: " : "Does not fit: "}{option.why}</p>}
          </li>;
        })}
      </ul>
      {picked !== null && <div className="flex flex-col gap-3" data-testid="mixed-feedback">
        <p className="text-sm"><strong>{step.options[picked].correct ? "Correct." : "Not this one."}</strong> {step.challenge.rule}</p>
        <p className="text-xs text-muted">Rules used: {step.challenge.topics.map(topicName).join(" · ")}</p>
        <button type="button" className={primary} onClick={advance} data-testid="mixed-next">{index + 1 >= steps.length ? "See results" : "Next question"}</button>
      </div>}
    </section>}
    {done && <section aria-label="Results" className="flex flex-col gap-4" data-testid="mixed-summary">
      <p className="text-lg font-semibold">You chose {score} of {steps.length} correctly.</p>
      {weakest.length > 0 && <div>
        <p className="text-sm text-muted">Worth another look (from your saved answers):</p>
        <ul className="mt-2 flex flex-col gap-2">{weakest.map(t => <li key={t.topic}><Link className="text-accent underline" href={`/flashcards?new=grammar:${t.topic}`}>{topicName(t.topic)} · {t.right} of {t.seen} right</Link></li>)}</ul>
      </div>}
      <button type="button" className={primary} onClick={newRound} data-testid="mixed-again">New round</button>
      <Link href="/learn?topic=mixed" className={`${button} block text-center`}>Think in Dutch · speak your own answer</Link>
      <p className="text-xs text-muted" data-testid="mixed-status">{status}. {account ? "Your answers follow your account on every device." : "Sign in to keep them across devices."} Weak situations come back more often; ones you get right repeatedly appear less, but never vanish. Mixed practice does not change your card levels.</p>
      {guestAvailable && <button type="button" className={button} onClick={copyGuest} data-testid="mixed-copy-guest">Add answers from this device (as guest) to my account</button>}
    </section>}
    <AppNav lang="nl" />
  </main>;
}
