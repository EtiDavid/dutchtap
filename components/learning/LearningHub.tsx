"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LanguageGate } from "@/components/lang/LanguageGate";
import { AppNav } from "@/components/nav/AppNav";
import { FeedbackSettings } from "@/components/practice/QuizFeedback";
import { celebrateCorrect } from "@/lib/practice/celebrate";
import { usePracticeStreak } from '@/lib/practice/usePracticeStreak';
import { useAccount } from "@/lib/auth/useAccount";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import {
  LEARNING_TOPICS,
  LEARNING_VERBS,
  acceptsAnswer,
  taskById,
} from "@/lib/learning/content";
import {
  emptyLabState,
  finishLabAttempt,
  labKey,
  nextLabAttempt,
  openLabAttempt,
  parseLabState,
  tasksFor,
  type LabState,
  type LabAttempt,
} from "@/lib/learning/progress";

const button = "btn !min-h-11 disabled:opacity-40";
const primary = "btn btn-primary !min-h-11 disabled:opacity-40";
const select = "field mt-1 w-full !min-h-11 !p-2 font-normal";

export function LearningHub() {
  return (
    <LanguageGate>
      {(lang) =>
        lang === "nl" ? (
          <DutchLearning />
        ) : (
          <main className="page-pad mx-auto max-w-lg px-5 pt-6">
            <Link href="/">← Home</Link>
            <h1 className="mt-6 text-3xl font-bold">Dutch practice labs</h1>
            <p className="mt-4">
              These lessons are in Dutch. Choose Nederlands on the home screen
              to practise them.
            </p>
            <AppNav lang={lang} />
          </main>
        )
      }
    </LanguageGate>
  );
}

function DutchLearning() {
  const { account, loading } = useAccount();
  const params = useSearchParams();
  const requested = params.get("topic");
  const [topic, setTopic] = useState(
      LEARNING_TOPICS.some((t) => t.id === requested) || requested === "mixed"
        ? requested!
        : "inversion",
    ),
    [mode, setMode] = useState<"practice" | "quiz">(
      params.get("mode") === "quiz" ? "quiz" : "practice",
    );
  const [support, setSupport] = useState<"dutch" | "english" | "listen">(
    params.get("support") === "english"
      ? "english"
      : params.get("support") === "listen"
        ? "listen"
        : "dutch",
  );
  const [verb, setVerb] = useState(
      LEARNING_VERBS.some((v) => v.lemma === params.get("verb"))
        ? params.get("verb")!
        : "all",
    ),
    [tense, setTense] = useState(
      ["present", "past", "perfect", "intention"].includes(
        params.get("tense") ?? "",
      )
        ? params.get("tense")!
        : "all",
    );
  const [input, setInput] = useState<"tiles" | "typing">(
    params.get("input") === "typing" ? "typing" : "tiles",
  );
  function remember(values: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values))
      url.searchParams.set(key, value);
    window.history.replaceState(null, "", url);
  }
  const rule = LEARNING_TOPICS.find((t) => t.id === topic);
  const changeTopic = (id: string) => {
    setTopic(id);
    setVerb("all");
    setTense("all");
    remember({ topic: id, verb: "all", tense: "all" });
  };
  return (
    <main className="page-pad mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-5 pt-6">
      <header>
        <Link href="/flashcards" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
          ← Practise
        </Link>
        <p className="eyebrow mt-4">Skill labs</p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-tight">Think, build, speak</h1>
        <p className="mt-2 text-muted">
          Practise a Dutch pattern, then express it in a new situation.
        </p>
      </header>
      <div className="card p-4">
        <label className="text-sm font-semibold">
          Choose your focus
          <select
            aria-label="Choose your focus"
            value={topic}
            onChange={(e) => changeTopic(e.target.value)}
            className={select}
          >
            {[
              ["structure", "Sentence Builder"],
              ["verbs", "Verb Lab"],
              ["tenses", "Tense Lab"],
            ].map(([section, label]) => (
              <optgroup key={section} label={label}>
                {LEARNING_TOPICS.filter((t) => t.section === section).map(
                  (t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
            <option value="mixed">Think in Dutch · mixed situations</option>
          </select>
        </label>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Learning mode"
        >
          {(["practice", "quiz"] as const).map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={mode === m}
              className={mode === m ? primary : button}
              onClick={() => {
                setMode(m);
                remember({ mode: m });
              }}
            >
              {m === "practice" ? "Practice · say it" : "Quiz · build it"}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Prompt support
            <select
              aria-label="Prompt support"
              value={support}
              onChange={(e) => {
                setSupport(e.target.value as typeof support);
                remember({ support: e.target.value });
              }}
              className={select}
            >
              <option value="dutch">Dutch first</option>
              <option value="listen">Listen first · hide text</option>
              <option value="english">English situation</option>
            </select>
          </label>
          {mode === "quiz" && (
            <label className="text-sm font-semibold">
              Answer with
              <select
                aria-label="Answer with"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value as typeof input);
                  remember({ input: e.target.value });
                }}
                className={select}
              >
                <option value="tiles">Word tiles</option>
                <option value="typing">Type a sentence</option>
              </select>
            </label>
          )}
          {(topic === "verbs" || topic === "separable") && (
            <label className="text-sm font-semibold">
              Verb
              <select
                aria-label="Verb"
                value={verb}
                onChange={(e) => {
                  setVerb(e.target.value);
                  remember({ verb: e.target.value });
                }}
                className={select}
              >
                <option value="all">All verbs in this topic</option>
                {LEARNING_VERBS.filter((v) =>
                  topic === "separable" ? v.particle : !v.particle,
                ).map((v) => (
                  <option key={v.lemma}>{v.lemma}</option>
                ))}
              </select>
            </label>
          )}
          {(topic === "verbs" ||
            topic === "separable" ||
            topic === "tense" ||
            topic === "mixed") && (
            <label className="text-sm font-semibold">
              Time / tense
              <select
                aria-label="Time / tense"
                value={tense}
                onChange={(e) => {
                  setTense(e.target.value);
                  remember({ tense: e.target.value });
                }}
                className={select}
              >
                <option value="all">Mixed tenses</option>
                <option value="present">Present</option>
                <option value="past">Simple past</option>
                <option value="perfect">Perfect</option>
                {topic === "tense" && (
                  <option value="intention">Intention</option>
                )}
              </select>
            </label>
          )}
        </div>
      </div>
      {rule && (
        <details
          className="rounded-xl border border-border p-4"
          open={mode === "practice"}
        >
          <summary className="cursor-pointer font-semibold">
            Understand the pattern
          </summary>
          <p className="mt-3 leading-relaxed">{rule.rule}</p>
          <p lang="nl" className="mt-2 font-semibold">
            {rule.example}
          </p>
        </details>
      )}
      {rule && (
        <Link href={`/flashcards?new=grammar:${rule.id}`} className="card tap tap-hover flex items-center gap-3 p-4 text-sm" data-testid="pattern-session-link">
          <span className="min-w-0 flex-1"><span className="block font-semibold">Practise {rule.title} as a full session</span><span className="block text-muted">Many more sentences, with explanations, situations to speak from, word order and levels.</span></span>
          <span aria-hidden className="text-accent">→</span>
        </Link>
      )}
      {(topic === "verbs" || topic === "separable") && (
        <VerbReference selected={verb} separable={topic === "separable"} />
      )}
      <FeedbackSettings />
      {loading ? (
        <p role="status">Loading your practice…</p>
      ) : (
        <LearningExercise
          key={`${account?.username ?? "guest"}:${topic}:${mode}:${verb}:${tense}`}
          scope={account ? `user:${account.username.toLowerCase()}` : "guest"}
          topic={topic}
          mode={mode}
          support={support}
          verb={verb}
          tense={tense}
          input={input}
        />
      )}
      <AppNav lang="nl" />
    </main>
  );
}

function VerbReference({
  selected,
  separable,
}: {
  selected: string;
  separable: boolean;
}) {
  const { listen } = useCardAudio();
  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer font-semibold">
        Verb forms & separable particles
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        {LEARNING_VERBS.filter(
          (v) =>
            (selected === "all" || v.lemma === selected) &&
            !!v.particle === separable,
        ).map((v) => (
          <div key={v.lemma}>
            <p className="font-semibold">
              <span lang="nl">{v.lemma}</span> · {v.english}
            </p>
            <p className="mt-1 text-sm">
              Present: ik {v.present.ik} · hij {v.present.hij} · wij{" "}
              {v.present.wij}
            </p>
            <p className="text-sm">
              Past: ik {v.past.singular} · wij {v.past.plural}
            </p>
            <p className="text-sm">Perfect: ik {v.perfect}</p>
            <p className="mt-1 text-sm text-muted">{v.note}</p>
            <button
              className={`${button} mt-2 text-sm`}
              type="button"
              onClick={() => void listen({ text: v.lemma, lang: "nl" })}
            >
              Listen: {v.lemma}
            </button>
          </div>
        ))}
      </div>
    </details>
  );
}

function LearningExercise({
  scope,
  topic,
  mode,
  support,
  verb,
  tense,
  input,
}: {
  scope: string;
  topic: string;
  mode: "practice" | "quiz";
  support: "dutch" | "english" | "listen";
  verb: string;
  tense: string;
  input: "tiles" | "typing";
}) {
  const { sound, listen, stop } = useCardAudio();
  const { record: recordPractice } = usePracticeStreak('nl');
  const [state, setState] = useState<LabState>(emptyLabState),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [previous, setPrevious] = useState<number | null>(null);
  const key = labKey(scope, topic, mode, verb, tense);
  const tasks = tasksFor(topic, verb, tense),
    ids = tasks.map((t) => t.id);
  /* Initial browser-storage hydration deliberately follows the server render. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved = emptyLabState();
    try {
      saved = parseLabState(localStorage.getItem(key));
    } catch {
      setStorageError(true);
    }
    const initial = openLabAttempt(
      saved,
      tasksFor(topic, verb, tense).map((t) => t.id),
    );
    setState(initial);
    setReady(true);
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      setStorageError(true);
    }
  }, [key, topic, verb, tense]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function save(next: LabState) {
    setState(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }
  function draft(update: Partial<LabAttempt>) {
    if (state.current && !state.current.outcome)
      save({ ...state, current: { ...state.current, ...update } });
  }
  function finish(outcome: NonNullable<LabAttempt["outcome"]>) {
    stop();
    const next = finishLabAttempt(state, outcome);
    if (next === state) return;
    save(next);
    recordPractice();
    if (outcome === "correct") celebrateCorrect();
  }
  const attempt = previous === null ? state.current : state.history[previous];
  const task = attempt && taskById.get(attempt.taskId);
  if (!ready) return <p role="status">Restoring your exercise…</p>;
  if (!task || !attempt) return <p>No exercises match these filters.</p>;
  const reviewOnly = previous !== null,
    revealed = attempt.revealed || reviewOnly;
  const answer = task.answers[attempt.answerIndex],
    tokens = answer.split(/\s+/);
  const text =
    input === "typing"
      ? attempt.draft
      : attempt.placed.map((i) => tokens[i]).join(" ");
  const totals = Object.values(state.reviews).reduce(
    (p, r) => ({
      correct: p.correct + r.correct,
      wrong: p.wrong + r.wrong,
      recalled: p.recalled + r.recalled,
    }),
    { correct: 0, wrong: 0, recalled: 0 },
  );
  return (
    <section className="flex flex-col gap-4" aria-label="Grammar exercise">
      <p className="text-xs text-muted">
        {tasks.length} situations · {totals.correct} quiz matches ·{" "}
        {totals.wrong} unmatched · {totals.recalled} self-rated recalls. Saved
        on this device for {scope === "guest" ? "Guest" : scope.slice(5)}; lab
        progress does not sync across devices yet.
      </p>
      {storageError && (
        <p role="alert">
          This browser could not save your lab progress. Keep this page open to
          continue.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          disabled={!state.history.length || previous === 0}
          onClick={() => {
            stop();
            setPrevious(
              previous === null
                ? state.history.length - 1
                : Math.max(0, previous - 1),
            );
          }}
        >
          ← Previous
        </button>
        {reviewOnly && (
          <button
            type="button"
            className={button}
            onClick={() => setPrevious(null)}
          >
            Return to current exercise
          </button>
        )}
      </div>
      <article
        className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-7"
        data-testid="learning-task"
        data-task-id={task.id}
      >
        <p className="text-sm font-semibold text-accent">
          {reviewOnly
            ? "Previous exercise · read only"
            : mode === "practice"
              ? "Say it in Dutch"
              : "Express the situation"}{" "}
          · {task.tense}
        </p>
        {support === "listen" && !reviewOnly ? (
          <details className="mt-4">
            <summary className="cursor-pointer">Show Dutch situation</summary>
            <p className="mt-3 text-lg" lang="nl">
              {task.promptNl}
            </p>
          </details>
        ) : (
          <p
            className="mt-4 text-lg leading-relaxed"
            lang={support === "english" ? "en" : "nl"}
          >
            {support === "english" ? task.promptEnglish : task.promptNl}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            onClick={() => void listen({ text: task.promptNl, lang: "nl" })}
          >
            Listen to Dutch situation
          </button>
          {support === 'english' && <button type="button" className={button} onClick={() => void listen({text:task.promptEnglish,lang:'en'})}>Listen to English situation</button>}
          <button type="button" className={button} onClick={stop}>
            Stop
          </button>
        </div>
        {!revealed && support !== "english" && (
          <details
            className="mt-3"
            onToggle={(e) => {
              if (e.currentTarget.open) draft({ assisted: true });
            }}
          >
            <summary className="cursor-pointer text-sm text-accent">
              English help
            </summary>
            <p className="mt-2">{task.promptEnglish}</p>
          </details>
        )}
        {!revealed && mode === "practice" && (
          <p className="mt-5 text-muted">
            Say your answer out loud before checking. There is no timer.
          </p>
        )}
        {!revealed &&
          mode === "quiz" &&
          (input === "typing" ? (
            <label className="mt-5 block font-semibold">
              Your Dutch sentence
              <textarea
                value={attempt.draft}
                maxLength={2000}
                onChange={(e) => draft({ draft: e.target.value })}
                className="mt-2 min-h-24 w-full rounded-xl border border-border p-3 font-normal"
                lang="nl"
              />
            </label>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-muted">
                Use this round’s words. Other phrasings may use different words.
              </p>
              <div
                aria-label="Your sentence"
                className="mt-2 flex min-h-16 flex-wrap gap-2 rounded-xl border border-dashed border-border p-3"
              >
                {attempt.placed.map((i) => (
                  <button
                    type="button"
                    key={i}
                    className={button}
                    onClick={() =>
                      draft({ placed: attempt.placed.filter((n) => n !== i) })
                    }
                  >
                    {tokens[i]}
                  </button>
                ))}
              </div>
              <div
                aria-label="Word tiles"
                className="mt-3 flex flex-wrap gap-2"
              >
                {attempt.tiles
                  .filter((i) => !attempt.placed.includes(i))
                  .map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={button}
                      onClick={() => draft({ placed: [...attempt.placed, i] })}
                    >
                      {tokens[i]}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        {revealed && (
          <div className="mt-6 border-t border-border pt-4">
            {attempt.outcome && (
              <p className="mb-3 font-semibold" role="status">
                {attempt.outcome === "correct"
                  ? "Correct — well done!"
                  : attempt.outcome === "unmatched"
                    ? "Compare your answer with the reviewed model."
                    : attempt.outcome === "recalled"
                      ? "Recalled · self-rated"
                      : "Practised with help"}
              </p>
            )}
            {attempt.outcome === "unmatched" && (
              <>
                <p className="mb-2 text-sm">
                  Your answer:{" "}
                  {attempt.draft ||
                    attempt.placed.map((i) => tokens[i]).join(" ") ||
                    "(empty)"}
                </p>
                <p className="mb-3 text-sm text-muted">
                  An unmatched answer is not automatically ungrammatical. Check
                  whether it conveys the situation and the requested pattern.
                </p>
              </>
            )}
            <p lang="nl" className="text-2xl font-semibold">
              {answer}
            </p>
            <p className="mt-2 text-muted">{task.english}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={button}
                onClick={() => void listen({ text: answer, lang: "nl" })}
              >
                Listen to answer
              </button>
              <button
                type="button"
                className={button}
                onClick={() => void listen({ text: answer, lang: "nl" }, true)}
              >
                Listen slowly
              </button>
            </div>
            <p className="mt-4 leading-relaxed">{task.explanation}</p>
            {task.answers.length > 1 && (
              <details className="mt-4">
                <summary>Other natural ways</summary>
                {task.answers
                  .filter((a) => a !== answer)
                  .map((a) => (
                    <p key={a} lang="nl" className="mt-2">
                      {a}
                    </p>
                  ))}
              </details>
            )}
            <p className="mt-4 text-sm text-muted">
              Try saying the full answer once, then recall it without looking.
            </p>
          </div>
        )}
      </article>
      {sound && (
        <p role="status" className="text-sm text-muted">
          {sound}
        </p>
      )}
      {!reviewOnly && !revealed && (
        <button
          type="button"
          className={primary}
          disabled={
            mode === "quiz" &&
            (input === "tiles"
              ? attempt.placed.length !== tokens.length
              : !attempt.draft.trim())
          }
          onClick={() => {
            stop();
            if (mode === "practice") draft({ revealed: true });
            else finish(acceptsAnswer(task, text) ? "correct" : "unmatched");
          }}
        >
          {mode === "practice" ? "Check the Dutch" : "Check answer"}
        </button>
      )}
      {!reviewOnly && revealed && mode === "practice" && !attempt.outcome && (
        <div>
          <p className="mb-2 text-sm">
            Did you recall the message and requested pattern before revealing?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={button}
              type="button"
              onClick={() => finish(attempt.assisted ? "assisted" : "recalled")}
            >
              I recalled it{attempt.assisted ? " with help" : ""}
            </button>
            <button
              className={button}
              type="button"
              onClick={() => finish("assisted")}
            >
              I needed help
            </button>
          </div>
        </div>
      )}
      {!reviewOnly && attempt.outcome && (
        <button
          type="button"
          className={primary}
          onClick={() => {
            stop();
            save(nextLabAttempt(state, ids));
          }}
        >
          Next situation →
        </button>
      )}
    </section>
  );
}
