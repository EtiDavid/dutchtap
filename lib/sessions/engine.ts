import {
  CATEGORIES,
  DEFAULT_LEVEL,
  LEVELS,
  LEVEL_LABELS,
  type Level,
  type Reviews,
} from "@/lib/flashcards/engine";
import {
  isVariation,
  variationCard,
  variationsFor,
  parentFor,
} from "@/lib/variations/content";
import { newId } from "./ids";
import { DEFAULT_LANG, LANG_INFO, type Lang } from "@/lib/lang";
import { cardFor, cardsFor, type LCard } from "@/lib/content/cards";
import {
  APPLIED_LOG_LIMIT,
  EVENT_LOG_LIMIT,
  MAX_ACTIVE_SESSIONS,
  MAX_SESSION_CARDS,
  QUIZ_POINTS,
  RETIRE_AT,
  type Action,
  type ApplyResult,
  type CardProgress,
  type LevelEffect,
  type Mode,
  type Rejection,
  type Session,
} from "./types";
import {
  isTokenPermutation,
  isValidDraft,
  isOrderAnswerCorrect,
  sentenceTokens,
  seededRandom,
  shuffled,
  shuffledTokenOrder,
} from "./wordOrder";

type Rand = () => number;
/** The card in the session's own language (undefined if that language has no content for it). */
export const deckCard = (lang: Lang, id: string): LCard | undefined =>
  lang === "nl" && isVariation(id) ? variationCard(id) : cardFor(lang, id);

export const emptyProgress = (): CardProgress => ({
  spStreak: 0,
  spDone: false,
  spAttempts: 0,
  qStreak: 0,
  qDone: false,
  qCorrect: 0,
  qWrong: 0,
  qLastWrong: false,
});
export const progressOf = (session: Session, id: string): CardProgress =>
  (isVariation(id) ? session.childProgress?.[id] : session.cards[id]) ??
  emptyProgress();

// ---- Creating a session ---------------------------------------------------------------------------------------
/** Topic = the place a sentence belongs to (shopping, school, ...). Level = how well the learner knows it. */
export const topicLabel = (topic: string) =>
  topic === "all"
    ? "All places"
    : (CATEGORIES[topic as keyof typeof CATEGORIES] ?? topic);
export const levelOf = (reviews: Reviews, id: string): Level =>
  reviews[id]?.level ?? DEFAULT_LEVEL;

export function eligibleIds(
  topic: string,
  level: Level,
  reviews: Reviews,
  lang: Lang = DEFAULT_LANG,
): string[] {
  return cardsFor(lang)
    .filter(
      (card) =>
        (topic === "all" || card.category === topic) &&
        levelOf(reviews, card.id) === level,
    )
    .map((card) => card.id);
}
export function levelCounts(
  topic: string,
  reviews: Reviews,
  lang: Lang = DEFAULT_LANG,
): Record<Level, number> {
  const counts: Record<Level, number> = {
    difficult: 0,
    medium: 0,
    easy: 0,
    mastered: 0,
  };
  for (const card of cardsFor(lang))
    if (topic === "all" || card.category === topic)
      counts[levelOf(reviews, card.id)]++;
  return counts;
}

export type LevelAvailability = {
  level: Level;
  available: number;
  enough: boolean;
  message: string;
};
/** Which starting levels can supply `count` distinct cards for this topic, with a plain explanation for each one that cannot. */
export function levelAvailability(
  topic: string,
  count: number,
  reviews: Reviews,
  lang: Lang = DEFAULT_LANG,
): LevelAvailability[] {
  const counts = levelCounts(topic, reviews, lang);
  return LEVELS.map((level) => {
    const available = counts[level];
    const enough = Number.isInteger(count) && count >= 1 && available >= count;
    const message =
      enough || !Number.isInteger(count) || count < 1
        ? ""
        : available === 0
          ? `There are no ${LEVEL_LABELS[level]} cards here. Choose another level, or practise Difficult cards and rate them ${LEVEL_LABELS[level]}.`
          : `${LEVEL_LABELS[level]} has ${available} ${available === 1 ? "card" : "cards"}; you requested ${count}. Choose fewer cards or practise Difficult cards and rate them ${LEVEL_LABELS[level]}.`;
    return { level, available, enough, message };
  });
}

export type Creation = {
  topic: string;
  count: number;
  level: Level;
  lang?: Lang;
};
export type CreationCheck =
  | { ok: true }
  | { ok: false; code: "count" | "level" | "limit" | "none"; message: string };
export function checkCreation(
  { topic, count, level, lang = DEFAULT_LANG }: Creation,
  reviews: Reviews,
  activeSessions: number,
): CreationCheck {
  if (activeSessions >= MAX_ACTIVE_SESSIONS)
    return {
      ok: false,
      code: "limit",
      message: `You already have ${MAX_ACTIVE_SESSIONS} active sessions. Finish one (complete Speaking and Quiz) or delete one before creating another.`,
    };
  if (!Number.isInteger(count) || count < 1 || count > MAX_SESSION_CARDS)
    return {
      ok: false,
      code: "count",
      message: `Choose a number of cards from 1 to ${MAX_SESSION_CARDS}.`,
    };
  const availability = levelAvailability(topic, count, reviews, lang);
  if (!availability.some((a) => a.enough))
    return {
      ok: false,
      code: "none",
      message: `No level has ${count} cards for ${topicLabel(topic)}. Choose fewer cards or another place.`,
    };
  const chosen = availability.find((a) => a.level === level)!;
  if (!chosen.enough)
    return { ok: false, code: "level", message: chosen.message };
  return { ok: true };
}

export function defaultSessionName(
  topic: string,
  count: number,
  level: Level,
  now = new Date(),
  lang: Lang = DEFAULT_LANG,
): string {
  const date = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const prefix = lang === DEFAULT_LANG ? "" : `${LANG_INFO[lang].english} · `;
  return `${prefix}${topicLabel(topic)} · ${count} ${LEVEL_LABELS[level]} ${count === 1 ? "card" : "cards"} · ${date}`;
}

/** A shuffled study round. If possible, the round does not start with `avoidFirst` (the last card of the previous round). */
export function shuffleRound(
  ids: readonly string[],
  rand: Rand,
  avoidFirst?: string,
): string[] {
  const order = shuffled(ids, rand);
  if (avoidFirst && order.length > 1 && order[0] === avoidFirst) {
    const swap = 1 + Math.floor(rand() * (order.length - 1));
    [order[0], order[swap]] = [order[swap], order[0]];
  }
  return order;
}

/** Picks `count` distinct cards from `pool` at random. */
export function sampleCards(
  pool: readonly string[],
  count: number,
  rand: Rand = Math.random,
): string[] {
  return shuffled(pool, rand).slice(0, count);
}

export function createSessionFromIds(input: {
  id?: string;
  name: string;
  cardIds: string[];
  topic: string;
  startingLevel: Level;
  lang?: Lang;
  now?: Date;
  rand?: Rand;
}): Session {
  const now = (input.now ?? new Date()).toISOString();
  const rand = input.rand ?? Math.random;
  return {
    id: input.id ?? newId(),
    lang: input.lang ?? DEFAULT_LANG,
    name: input.name.trim().slice(0, 80),
    cardIds: [...input.cardIds],
    topic: input.topic,
    startingLevel: input.startingLevel,
    createdAt: now,
    updatedAt: now,
    status: "active",
    completedAt: null,
    rev: 0,
    study: { order: shuffleRound(input.cardIds, rand), pos: 0, round: 1 },
    speaking: { current: null, done: false },
    quiz: { current: null, done: false, points: 0 },
    variations:
      input.lang === "fr" || input.startingLevel !== "mastered"
        ? {}
        : Object.fromEntries(
            input.cardIds
              .filter((id) => variationsFor(id).length === 10)
              .map((id) => [
                id,
                { enabled: true, unlocked: 2, manualOff: false },
              ]),
          ),
    childProgress: {},
    history: { study: [], speaking: [], quiz: [] },
    cards: Object.fromEntries(
      input.cardIds.map((id) => [
        id,
        {
          ...emptyProgress(),
          ...(input.lang === "fr" ? {} : { level: input.startingLevel }),
        },
      ]),
    ),
    events: [],
    applied: [],
  };
}

/** Chooses the fixed set once. Returns null when the request cannot be met (nothing is substituted). */
export function createSession(
  input: Creation & {
    reviews: Reviews;
    name?: string;
    id?: string;
    now?: Date;
    rand?: Rand;
  },
): Session | null {
  const lang = input.lang ?? DEFAULT_LANG;
  const pool = eligibleIds(input.topic, input.level, input.reviews, lang);
  if (
    !Number.isInteger(input.count) ||
    input.count < 1 ||
    input.count > MAX_SESSION_CARDS ||
    pool.length < input.count
  )
    return null;
  const rand = input.rand ?? Math.random;
  return createSessionFromIds({
    id: input.id,
    topic: input.topic,
    startingLevel: input.level,
    lang,
    now: input.now,
    rand,
    name:
      input.name?.trim() ||
      defaultSessionName(
        input.topic,
        input.count,
        input.level,
        input.now,
        lang,
      ),
    cardIds: sampleCards(pool, input.count, rand),
  });
}

/** A new session over exactly the same cards, with fresh counters. */
export function practiseAgain(
  source: Session,
  options: { id?: string; now?: Date; rand?: Rand } = {},
): Session {
  return createSessionFromIds({
    ...options,
    name: `Again: ${source.name.replace(/^Again: /, "")}`,
    cardIds: source.cardIds,
    topic: source.topic,
    startingLevel: source.startingLevel,
    lang: source.lang,
  });
}

// ---- Reading a session ----------------------------------------------------------------------------------------
export const unfinished = (
  session: Session,
  mode: "speaking" | "quiz",
): string[] =>
  session.cardIds.filter(
    (id) =>
      !(mode === "speaking"
        ? progressOf(session, id).spDone
        : progressOf(session, id).qDone),
  );
export const retired = (session: Session, mode: "speaking" | "quiz") =>
  session.cardIds.length - unfinished(session, mode).length;
export const isComplete = (session: Session) =>
  session.speaking.done && session.quiz.done;

export function sessionStats(session: Session) {
  let spAttempts = 0,
    qCorrect = 0,
    qWrong = 0;
  for (const id of session.cardIds) {
    const p = progressOf(session, id);
    spAttempts += p.spAttempts;
    qCorrect += p.qCorrect;
    qWrong += p.qWrong;
  }
  const answered = qCorrect + qWrong;
  return {
    total: session.cardIds.length,
    speakingRetired: retired(session, "speaking"),
    quizRetired: retired(session, "quiz"),
    speakingAttempts: spAttempts,
    quizCorrect: qCorrect,
    quizWrong: qWrong,
    quizAccuracy: answered ? Math.round((qCorrect / answered) * 100) : null,
    variationSpeakingAttempts: Object.values(
      session.childProgress ?? {},
    ).reduce((n, p) => n + p.spAttempts, 0),
    variationQuizCorrect: Object.values(session.childProgress ?? {}).reduce(
      (n, p) => n + p.qCorrect,
      0,
    ),
    variationQuizWrong: Object.values(session.childProgress ?? {}).reduce(
      (n, p) => n + p.qWrong,
      0,
    ),
    quizPoints: session.quiz.points,
    studyRound: session.study.round,
    studyPosition: session.study.pos + 1,
  };
}

// ---- Choosing the next card (random choices are made by the device and sent as part of the action) ----------------
function drawWeighted(
  ids: readonly string[],
  weightOf: (id: string) => number,
  rand: Rand,
  avoid?: string,
): string | undefined {
  const pool =
    ids.length > 1 && avoid ? ids.filter((id) => id !== avoid) : [...ids];
  const total = pool.reduce((sum, id) => sum + weightOf(id), 0);
  if (!pool.length) return undefined;
  if (total <= 0) return pool[Math.floor(rand() * pool.length)];
  let target = rand() * total;
  for (const id of pool) {
    target -= weightOf(id);
    if (target < 0) return id;
  }
  return pool[pool.length - 1];
}
/** Speaking favours Difficult > Medium > Easy > Mastered using the learner's current global level. */
export function pickSpeakingCard(
  session: Session,
  reviews: Reviews,
  rand: Rand = Math.random,
  avoid?: string,
  retiring?: string,
): string | undefined {
  return drawWeighted(
    avoidRepeatedSentence(
      session,
      availablePractice(session, "speaking").filter((id) => id !== retiring),
      avoid,
    ),
    (id) =>
      ({ difficult: 8, medium: 4, easy: 2, mastered: 0.15 })[
        practiceLevel(session, id, reviews)
      ],
    rand,
    avoid,
  );
}
/** True when rating this card `level` now would be its tenth consecutive recall, retiring it from Speaking. */
export function wouldRetireSpeaking(
  session: Session,
  cardId: string,
  level: Level,
): boolean {
  return (
    level === "mastered" &&
    progressOf(session, cardId).spStreak + 1 >= RETIRE_AT
  );
}
/** Quiz brings missed cards back sooner and shows well-answered ones less often. Retired cards have no weight. */
export function quizDrawWeight(progress: CardProgress): number {
  if (progress.qDone) return 0;
  if (progress.qLastWrong) return 10;
  if (progress.qCorrect + progress.qWrong === 0) return 6;
  return Math.max(0.5, 6 - progress.qStreak * 0.5);
}
export function pickQuizCard(
  session: Session,
  rand: Rand = Math.random,
  avoid?: string,
): string | undefined {
  return drawWeighted(
    avoidRepeatedSentence(session, availablePractice(session, "quiz"), avoid),
    (id) =>
      quizDrawWeight(progressOf(session, id)) *
      (session.lang === "nl"
        ? { difficult: 1, medium: 0.6, easy: 0.3, mastered: 0.025 }[
            progressOf(session, id).level ?? DEFAULT_LEVEL
          ]
        : 1),
    rand,
    avoid,
  );
}
function avoidRepeatedSentence(
  session: Session,
  ids: string[],
  avoid?: string,
): string[] {
  const text = avoid ? deckCard(session.lang, avoid)?.text : undefined;
  const different = text
    ? ids.filter((id) => deckCard(session.lang, id)?.text !== text)
    : ids;
  return different.length ? different : ids;
}
/** Main completion is independent from optional variation completion. */
export function availablePractice(
  session: Session,
  mode: "speaking" | "quiz",
): string[] {
  const children =
    session.lang === "nl"
      ? Object.entries(session.variations ?? {}).flatMap(([parent, family]) =>
          family.enabled
            ? variationsFor(parent)
                .slice(0, family.unlocked)
                .map((v) => v.id)
                .filter(
                  (id) =>
                    !(mode === "speaking"
                      ? progressOf(session, id).spDone
                      : progressOf(session, id).qDone),
                )
            : [],
        )
      : [];
  return [...unfinished(session, mode), ...children];
}
export function practiceLevel(
  session: Session,
  id: string,
  reviews: Reviews,
): Level {
  return isVariation(id)
    ? (progressOf(session, id).level ?? DEFAULT_LEVEL)
    : (reviews[id]?.level ?? progressOf(session, id).level ?? DEFAULT_LEVEL);
}
function releaseChildren(s: Session, parent: string) {
  const f = s.variations[parent];
  if (!f?.enabled) return;
  const learned = variationsFor(parent)
    .slice(0, f.unlocked)
    .filter(
      (v) =>
        ["easy", "mastered"].includes(
          progressOf(s, v.id).level ?? "difficult",
        ) || progressOf(s, v.id).qStreak >= 3,
    ).length;
  f.unlocked = Math.max(f.unlocked, Math.min(10, 2 + learned));
}
export function newAttemptId() {
  return newId();
}

// ---- The action reducer (identical on the device and on the server) -------------------------------------------
const reject = (session: Session, reason: Rejection): ApplyResult => ({
  session,
  applied: false,
  reason,
  effects: [],
});

/** Chooses the card to continue with after a rating/answer, trusting the device's random choice only when valid. */
function resolveNext(
  remaining: string[],
  proposed: string | undefined,
  previous: string,
): string | undefined {
  if (!remaining.length) return undefined;
  const valid =
    proposed &&
    remaining.includes(proposed) &&
    (remaining.length === 1 || proposed !== previous);
  return valid
    ? proposed
    : (remaining.find((id) => id !== previous) ?? remaining[0]);
}

export function applyAction(
  input: Session,
  action: Action,
  now: Date = new Date(),
): ApplyResult {
  if (input.applied.includes(action.id)) return reject(input, "duplicate");
  // Archived main sessions can still host optional Dutch child practice without resurrecting their slot.
  if (input.status === "archived") {
    const childAction =
      action.type === "speaking/open" || action.type === "quiz/open"
        ? isVariation(action.cardId)
        : action.type.startsWith("speaking/")
          ? !!input.speaking.current &&
            isVariation(input.speaking.current.cardId)
          : action.type.startsWith("quiz/")
            ? !!input.quiz.current && isVariation(input.quiz.current.cardId)
            : false;
    if (
      !childAction &&
      !["study/next", "rename", "quiz/continue", "variations/toggle"].includes(
        action.type,
      )
    )
      return reject(input, "archived");
  }
  const s = structuredClone(input);
  s.variations ??= {};
  s.childProgress ??= {};
  s.history ??= { study: [], speaking: [], quiz: [] };
  const stamp = now.toISOString();
  const effects: LevelEffect[] = [];
  const logEvent = (event: Omit<Session["events"][number], "id" | "at">) => {
    s.events.push({ id: action.id, at: action.at, ...event });
    if (s.events.length > EVENT_LOG_LIMIT)
      s.events.splice(0, s.events.length - EVENT_LOG_LIMIT);
  };
  const progress = (id: string) =>
    isVariation(id)
      ? (s.childProgress[id] ??= emptyProgress())
      : (s.cards[id] ??= emptyProgress());
  const remember = (mode: Mode, id: string) => {
    s.history[mode].push(id);
    if (s.history[mode].length > 100) s.history[mode].shift();
  };
  const allowed = (id: string, mode: "speaking" | "quiz") =>
    availablePractice(s, mode).includes(id);

  switch (action.type) {
    case "variations/toggle": {
      if (
        s.lang !== "nl" ||
        !s.cardIds.includes(action.parentId) ||
        variationsFor(action.parentId).length !== 10
      )
        return reject(input, "invalid");
      const previous = s.variations[action.parentId];
      s.variations[action.parentId] = {
        enabled: action.enabled,
        unlocked: previous?.unlocked ?? 2,
        manualOff: !action.enabled,
      };
      if (!action.enabled) {
        if (
          s.speaking.current &&
          isVariation(s.speaking.current.cardId) &&
          parentFor(s.speaking.current.cardId) === action.parentId
        )
          s.speaking.current = null;
        if (
          s.quiz.current &&
          isVariation(s.quiz.current.cardId) &&
          parentFor(s.quiz.current.cardId) === action.parentId
        )
          s.quiz.current = null;
      }
      break;
    }
    case "study/next": {
      remember("study", s.study.order[s.study.pos]);
      if (s.study.pos + 1 < s.study.order.length) {
        s.study.pos += 1;
        break;
      }
      const proposed = action.nextOrder;
      const valid =
        proposed &&
        proposed.length === s.cardIds.length &&
        new Set(proposed).size === s.cardIds.length &&
        proposed.every((id) => s.cardIds.includes(id)) &&
        !(
          proposed.length > 1 &&
          proposed[0] === s.study.order[s.study.order.length - 1]
        );
      s.study.order = valid
        ? [...proposed]
        : shuffleRound(
            s.cardIds,
            seededRandom(`${s.id}:${s.study.round + 1}`),
            s.study.order[s.study.order.length - 1],
          );
      s.study.pos = 0;
      s.study.round += 1;
      break;
    }
    case "rename":
      s.name = action.name.trim().slice(0, 80);
      break;
    case "speaking/open": {
      if (s.speaking.current) return reject(input, "busy");
      if (!allowed(action.cardId, "speaking")) return reject(input, "invalid");
      s.speaking.current = {
        cardId: action.cardId,
        attemptId: action.attemptId,
        revealed: false,
        chosen:
          s.lang === "nl"
            ? isVariation(action.cardId)
              ? (progress(action.cardId).level ?? DEFAULT_LEVEL)
              : (action.level ?? progress(action.cardId).level ?? DEFAULT_LEVEL)
            : null,
      };
      break;
    }
    case "speaking/reveal": {
      if (s.speaking.current?.attemptId !== action.attemptId)
        return reject(input, "stale");
      s.speaking.current.revealed = true;
      break;
    }
    case "speaking/choose": {
      const current = s.speaking.current;
      if (current?.attemptId !== action.attemptId)
        return reject(input, "stale");
      if (!current.revealed) return reject(input, "not-revealed");
      current.chosen = action.level;
      break;
    }
    case "speaking/submit": {
      const current = s.speaking.current;
      if (current?.attemptId !== action.attemptId)
        return reject(input, "stale");
      if (!current.revealed) return reject(input, "not-revealed");
      if (
        (current.chosen !== null && current.chosen !== action.level) ||
        (s.lang !== "nl" && current.chosen === null)
      )
        return reject(input, "not-chosen"); // an explicit rating for this attempt is required
      if (!allowed(current.cardId, "speaking")) return reject(input, "invalid");
      const p = progress(current.cardId);
      p.level = action.level;
      p.spAttempts += 1;
      const recalled = action.level === "mastered"; // Mastered = "I recalled this correctly before revealing"
      p.spStreak = recalled ? Math.min(RETIRE_AT, p.spStreak + 1) : 0;
      if (p.spStreak >= RETIRE_AT) p.spDone = true;
      logEvent({
        mode: "speaking",
        cardId: current.cardId,
        result: recalled ? "recalled" : "not-recalled",
        level: action.level,
        pointsDelta: 0,
      });
      remember("speaking", current.cardId);
      if (!isVariation(current.cardId)) {
        effects.push({
          lang: s.lang,
          cardId: current.cardId,
          level: action.level,
          at: action.at,
        });
        if (
          s.lang === "nl" &&
          action.level === "mastered" &&
          variationsFor(current.cardId).length === 10 &&
          !s.variations[current.cardId]?.manualOff
        )
          s.variations[current.cardId] ??= {
            enabled: true,
            unlocked: 2,
            manualOff: false,
          };
      }
      releaseChildren(s, parentFor(current.cardId));
      s.speaking.done = unfinished(s, "speaking").length === 0;
      const nextId = resolveNext(
        availablePractice(s, "speaking"),
        action.next?.cardId,
        current.cardId,
      );
      s.speaking.current = nextId
        ? {
            cardId: nextId,
            attemptId:
              action.next?.cardId === nextId
                ? action.next.attemptId
                : `${action.id}-n`,
            revealed: false,
            chosen:
              s.lang === "nl"
                ? isVariation(nextId)
                  ? (progress(nextId).level ?? DEFAULT_LEVEL)
                  : ((action.next?.cardId === nextId
                      ? action.next.level
                      : undefined) ??
                    progress(nextId).level ??
                    DEFAULT_LEVEL)
                : null,
          }
        : null;
      break;
    }
    case "quiz/open": {
      if (s.quiz.current) return reject(input, "busy");
      const card = deckCard(s.lang, action.cardId);
      if (!card || !allowed(action.cardId, "quiz"))
        return reject(input, "invalid");
      const order = isTokenPermutation(card.text, action.tokenOrder, s.lang)
        ? action.tokenOrder
        : shuffledTokenOrder(card.text, seededRandom(action.attemptId), s.lang);
      s.quiz.current = {
        cardId: action.cardId,
        attemptId: action.attemptId,
        tokenOrder: order,
        answer: [],
        outcome: null,
      };
      break;
    }
    case "quiz/draft": {
      const current = s.quiz.current;
      if (current?.attemptId !== action.attemptId || current.outcome)
        return reject(input, "stale");
      if (
        !isValidDraft(
          deckCard(s.lang, current.cardId)?.text ?? "",
          action.answer,
          s.lang,
        )
      )
        return reject(input, "invalid");
      current.answer = [...action.answer];
      break;
    }
    case "quiz/submit": {
      const current = s.quiz.current;
      if (current?.attemptId !== action.attemptId || current.outcome)
        return reject(input, "stale"); // the same attempt can be scored only once
      const card = deckCard(s.lang, current.cardId);
      if (!card || !isTokenPermutation(card.text, action.answer, s.lang))
        return reject(input, "incomplete");
      if (!allowed(current.cardId, "quiz")) return reject(input, "invalid");
      const correct = isOrderAnswerCorrect(card.text, action.answer, s.lang);
      const p = progress(current.cardId);
      if (correct) {
        p.qCorrect += 1;
        p.qStreak = Math.min(RETIRE_AT, p.qStreak + 1);
        p.qLastWrong = false;
        if (p.qStreak >= RETIRE_AT) p.qDone = true;
      } else {
        p.qWrong += 1;
        p.qStreak = 0;
        p.qLastWrong = true;
      }
      if (isVariation(current.cardId))
        p.level =
          p.qStreak >= 10
            ? "mastered"
            : p.qStreak >= 5
              ? "easy"
              : p.qStreak >= 3
                ? "medium"
                : "difficult";
      releaseChildren(s, parentFor(current.cardId));
      const points = correct ? QUIZ_POINTS : 0;
      s.quiz.points += points;
      s.quiz.done = unfinished(s, "quiz").length === 0;
      current.answer = [...action.answer];
      current.outcome = { correct, points };
      remember("quiz", current.cardId);
      logEvent({
        mode: "quiz",
        cardId: current.cardId,
        result: correct ? "correct" : "wrong",
        pointsDelta: points,
      });
      break;
    }
    case "quiz/continue": {
      const current = s.quiz.current;
      if (current?.attemptId !== action.attemptId)
        return reject(input, "stale");
      if (!current.outcome) return reject(input, "incomplete");
      const nextId = resolveNext(
        availablePractice(s, "quiz"),
        action.next?.cardId,
        current.cardId,
      );
      if (!nextId) {
        s.quiz.current = null;
        break;
      }
      const nextCard = deckCard(s.lang, nextId)!;
      const proposedFor = action.next?.cardId === nextId ? action.next : null;
      const attemptId = proposedFor?.attemptId ?? `${action.id}-n`;
      const order =
        proposedFor &&
        isTokenPermutation(nextCard.text, proposedFor.tokenOrder, s.lang)
          ? proposedFor.tokenOrder
          : shuffledTokenOrder(nextCard.text, seededRandom(attemptId), s.lang);
      s.quiz.current = {
        cardId: nextId,
        attemptId,
        tokenOrder: order,
        answer: [],
        outcome: null,
      };
      break;
    }
  }

  s.applied.push(action.id);
  if (s.applied.length > APPLIED_LOG_LIMIT)
    s.applied.splice(0, s.applied.length - APPLIED_LOG_LIMIT);
  s.updatedAt = stamp;
  if (s.status === "active" && isComplete(s)) {
    s.status = "archived";
    s.completedAt = stamp;
  }
  return { session: s, applied: true, effects };
}

/** Applies several actions in order; used by the server and when a device replays its offline queue. */
export function applyActions(
  session: Session,
  actions: readonly Action[],
  now: Date = new Date(),
) {
  let current = session;
  const applied: string[] = [];
  const rejected: { id: string; reason: Rejection }[] = [];
  const effects: LevelEffect[] = [];
  for (const action of actions) {
    const result = applyAction(current, action, now);
    current = result.session;
    if (result.applied) {
      applied.push(action.id);
      effects.push(...result.effects);
    } else rejected.push({ id: action.id, reason: result.reason! });
  }
  return { session: current, applied, rejected, effects };
}

export const tokensForCard = (lang: Lang, cardId: string) =>
  sentenceTokens(deckCard(lang, cardId)?.text ?? "", lang);
export type { Mode };
