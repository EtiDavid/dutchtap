import { z } from "zod";
import { LEARNING_TASKS, shuffle, taskById } from "./content";

const reviewSchema = z.object({
  correct: z.number().int().nonnegative(),
  wrong: z.number().int().nonnegative(),
  recalled: z.number().int().nonnegative(),
  assisted: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  due: z.number().nonnegative(),
});
export type LabReview = z.infer<typeof reviewSchema>;
const attemptSchema = z.object({
  taskId: z.string(),
  answerIndex: z.number().int().nonnegative(),
  tiles: z.array(z.number().int().nonnegative()),
  placed: z.array(z.number().int().nonnegative()),
  draft: z.string().max(2000),
  revealed: z.boolean(),
  assisted: z.boolean().default(false),
  outcome: z.enum(["correct", "unmatched", "recalled", "assisted"]).nullable(),
});
export type LabAttempt = z.infer<typeof attemptSchema>;
const stateSchema = z.object({
  version: z.literal(1),
  reviews: z.record(z.string(), reviewSchema),
  current: attemptSchema.nullable(),
  history: z.array(attemptSchema).max(100),
});
export type LabState = z.infer<typeof stateSchema>;
export const emptyLabState = (): LabState => ({
  version: 1,
  reviews: {},
  current: null,
  history: [],
});
export const labKey = (
  scope: string,
  topic: string,
  mode: string,
  verb: string,
  tense: string,
) =>
  `dutchtap:labs:v1:${encodeURIComponent(scope)}:${topic}:${mode}:${verb}:${tense}`;
export function parseLabState(raw: string | null): LabState {
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw || "null"));
    if (!parsed.success) return emptyLabState();
    const state = parsed.data;
    const valid = (a: LabAttempt) => {
      const task = taskById.get(a.taskId),
        answer = task?.answers[a.answerIndex];
      if (!answer) return false;
      const length = answer.split(/\s+/).length;
      return (
        a.tiles.length === length &&
        new Set(a.tiles).size === length &&
        a.tiles.every((i) => i < length) &&
        new Set(a.placed).size === a.placed.length &&
        a.placed.every((i) => i < length)
      );
    };
    state.current =
      state.current && valid(state.current) ? state.current : null;
    state.history = state.history.filter(valid);
    return state;
  } catch {
    return emptyLabState();
  }
}
export function openLabAttempt(
  state: LabState,
  ids: string[],
  now = Date.now(),
  random = Math.random,
): LabState {
  if (state.current && ids.includes(state.current.taskId)) return state;
  const last = state.history.at(-1)?.taskId;
  const pool = ids.length > 1 ? ids.filter((id) => id !== last) : ids;
  const weighted = pool.flatMap((id) => {
    const r = state.reviews[id];
    const weight = !r ? 3 : r.due <= now ? 5 : r.streak === 0 ? 3 : 1;
    return Array<string>(weight).fill(id);
  });
  if (!weighted.length) return { ...state, current: null };
  const taskId = weighted[Math.floor(random() * weighted.length)],
    task = taskById.get(taskId)!;
  const lastAnswer = [...state.history]
    .reverse()
    .find((a) => a.taskId === taskId)?.answerIndex;
  const choices = task.answers
    .map((_, i) => i)
    .filter((i) => task.answers.length === 1 || i !== lastAnswer);
  const answerIndex = choices[Math.floor(random() * choices.length)];
  return {
    ...state,
    current: {
      taskId,
      answerIndex,
      tiles: shuffle(
        task.answers[answerIndex].split(/\s+/).map((_, i) => i),
        random,
      ),
      placed: [],
      draft: "",
      revealed: false,
      assisted: false,
      outcome: null,
    },
  };
}
/** One result per saved attempt; revealing/reloading/Back cannot add another score. */
export function finishLabAttempt(
  state: LabState,
  outcome: NonNullable<LabAttempt["outcome"]>,
  now = Date.now(),
): LabState {
  if (!state.current || state.current.outcome) return state;
  const old = state.reviews[state.current.taskId] ?? {
    correct: 0,
    wrong: 0,
    recalled: 0,
    assisted: 0,
    streak: 0,
    due: 0,
  };
  const success = outcome === "correct" || outcome === "recalled",
    streak = success ? old.streak + 1 : 0;
  const review = {
    ...old,
    correct: old.correct + Number(outcome === "correct"),
    wrong: old.wrong + Number(outcome === "unmatched"),
    recalled: old.recalled + Number(outcome === "recalled"),
    assisted: old.assisted + Number(outcome === "assisted"),
    streak,
    due:
      now +
      (success
        ? Math.min(14, 2 ** Math.min(streak - 1, 4)) * 86400000
        : 300000),
  };
  return {
    ...state,
    current: { ...state.current, outcome, revealed: true },
    reviews: { ...state.reviews, [state.current.taskId]: review },
  };
}
export function nextLabAttempt(state: LabState, ids: string[]): LabState {
  if (!state.current?.outcome) return state;
  return openLabAttempt(
    {
      ...state,
      history: [...state.history, state.current].slice(-100),
      current: null,
    },
    ids,
  );
}
export function tasksFor(topic: string, verb = "all", tense = "all") {
  return LEARNING_TASKS.filter(
    (task) =>
      (topic === "mixed" || task.topic === topic) &&
      (verb === "all" || task.verb === verb) &&
      (tense === "all" || task.tense === tense),
  );
}
