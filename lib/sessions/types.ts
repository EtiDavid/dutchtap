import { z } from "zod";
import { COLLECTIONS, WORK_AREAS, collectionAvailable, validTopic } from "@/lib/content/collections";
import { CARDS, CATEGORIES, LEVELS, type Level } from "@/lib/flashcards/engine";
import { ID_PATTERN } from "./ids";
import { DEFAULT_LANG, LANGS, type Lang } from "@/lib/lang";
import {
  variationFor,
  parentFor,
  variationsFor,
} from "@/lib/variations/content";
import { modelFor } from "@/lib/practice/communication";
import { variationCard } from "@/lib/variations/content";
import { cardFor } from "@/lib/content/cards";
import { hasContent } from "@/lib/content/cards";

export const MAX_ACTIVE_SESSIONS = 5;
export const MAX_SESSION_CARDS = 100;
/** Consecutive successes needed to retire a card from Speaking or Quiz inside one session. */
export const RETIRE_AT = 10;
export const QUIZ_POINTS = 10;
export const EVENT_LOG_LIMIT = 200;
export const APPLIED_LOG_LIMIT = 500;
export const MAX_ACTIONS_PER_REQUEST = 60;

export type Mode = "study" | "speaking" | "quiz";
export const MODES: readonly Mode[] = ["study", "speaking", "quiz"];
export type Topic = "all" | keyof typeof CATEGORIES | keyof typeof WORK_AREAS;
export const TOPICS = ["all", ...Object.keys(CATEGORIES), ...Object.keys(WORK_AREAS)] as readonly string[];

const deckIds = new Set(CARDS.map((card) => card.id));
const cardId = z.string().refine((id) => deckIds.has(id), "Unknown card");
const practiceId = z
  .string()
  .refine(
    (id) => deckIds.has(id) || !!variationFor(id),
    "Unknown practice card",
  );
const idString = z.string().regex(ID_PATTERN);
const isoDate = z.iso.datetime();
const small = z.number().int().min(0).max(RETIRE_AT);
const count = z.number().int().min(0).max(1_000_000);

export const cardProgressSchema = z.object({
  spStreak: small,
  spDone: z.boolean(),
  spAttempts: count,
  qStreak: small,
  qDone: z.boolean(),
  qCorrect: count,
  qWrong: count,
  qLastWrong: z.boolean(),
  level: z.enum(LEVELS).optional(),
  quizAnswerRotation: z
    .object({
      remaining: z.array(z.string().max(80)).max(30),
      last: z.string().max(80),
    })
    .optional(),
});
export type CardProgress = z.infer<typeof cardProgressSchema>;

export const eventSchema = z.object({
  id: idString,
  mode: z.enum(["speaking", "quiz"]),
  cardId: practiceId,
  result: z.enum(["recalled", "not-recalled", "correct", "wrong"]),
  level: z.enum(LEVELS).optional(),
  pointsDelta: z.number().int().min(0).max(1000),
  at: isoDate,
});
export type SessionEvent = z.infer<typeof eventSchema>;

const speakingCurrent = z.object({
  cardId: practiceId,
  attemptId: idString,
  revealed: z.boolean(),
  chosen: z.enum(LEVELS).nullable(),
});
const quizCurrent = z.object({
  answerId: z.string().max(80).optional(),
  cardId: practiceId,
  attemptId: idString,
  tokenOrder: z
    .array(z.string().regex(/^t\d{1,2}$/))
    .min(1)
    .max(40),
  answer: z.array(z.string().regex(/^t\d{1,2}$/)).max(40),
  outcome: z
    .object({
      correct: z.boolean(),
      points: z.number().int().min(0).max(1000),
      answerId: z.string().max(80).optional(),
    })
    .nullable(),
});
export type SpeakingCurrent = z.infer<typeof speakingCurrent>;
export type QuizCurrent = z.infer<typeof quizCurrent>;

const langSchema = z.enum(LANGS);
const sessionShape = z.object({
  collection: z.enum(COLLECTIONS).default("everyday"),
  id: idString,
  name: z.string().trim().min(1).max(80),
  cardIds: z.array(cardId).min(1).max(MAX_SESSION_CARDS),
  topic: z.string().refine((t) => TOPICS.includes(t)),
  startingLevel: z.enum(LEVELS),
  createdAt: isoDate,
  updatedAt: isoDate,
  status: z.enum(["active", "archived"]),
  completedAt: isoDate.nullable(),
  rev: z.number().int().min(0),
  study: z.object({
    order: z.array(cardId).min(1).max(MAX_SESSION_CARDS),
    pos: z.number().int().min(0),
    round: z.number().int().min(1),
  }),
  speaking: z.object({
    current: speakingCurrent.nullable(),
    done: z.boolean(),
  }),
  quiz: z.object({
    current: quizCurrent.nullable(),
    done: z.boolean(),
    points: count,
  }),
  cards: z.record(z.string(), cardProgressSchema),
  variations: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean(),
        unlocked: z.number().int().min(1).max(10),
        manualOff: z.boolean().default(false),
      }),
    )
    .default({}),
  childProgress: z.record(z.string(), cardProgressSchema).default({}),
  history: z
    .object({
      study: z.array(practiceId).max(100),
      speaking: z.array(practiceId).max(100),
      quiz: z.array(practiceId).max(100),
    })
    .default({ study: [], speaking: [], quiz: [] }),
  quizReview: z
    .array(z.object({ cardId: practiceId, answerId: z.string().max(80) }))
    .max(100)
    .optional(),
  events: z.array(eventSchema).max(EVENT_LOG_LIMIT),
  applied: z.array(idString).max(APPLIED_LOG_LIMIT),
});
type SessionShape = z.infer<typeof sessionShape> & { lang: Lang };
function checkSession(s: SessionShape, ctx: z.RefinementCtx) {
  const ids = new Set(s.cardIds);
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!collectionAvailable(s.lang, s.collection)) fail("Collection is unavailable in this language");
  if (!validTopic(s.collection, s.topic)) fail("Topic is outside this collection");
  if (s.cardIds.some(id => cardFor(s.lang, id)?.collection !== s.collection)) fail("Card outside selected collection");
  if (s.collection === "workplace" && s.topic !== "all" && s.cardIds.some(id => cardFor(s.lang, id)?.category !== s.topic)) fail("Card outside selected workplace area");
  // Every card must exist in the session's own language: a French session can never hold a card that has no French content.
  for (const id of new Set([
    ...s.cardIds,
    ...s.study.order,
    ...[s.speaking.current, s.quiz.current].flatMap((c) =>
      c ? [c.cardId] : [],
    ),
  ]))
    if (!(
      hasContent(s.lang, id) ||
      (s.lang === "nl" && !!variationFor(id) && ids.has(parentFor(id)))
    ))
      fail(`Card ${id} is not available in this language`);
  if (
    s.lang !== "nl" &&
    (Object.keys(s.variations).length || Object.keys(s.childProgress).length)
  )
    fail("Variations are Dutch only");
  if (
    Object.keys(s.variations).some(
      (id) => !ids.has(id) || variationsFor(id).length !== 10,
    )
  )
    fail("Unknown variation family");
  if (
    Object.keys(s.childProgress).some(
      (id) => !variationFor(id) || !ids.has(parentFor(id)),
    )
  )
    fail("Child outside selected families");
  if (
    s.lang !== "nl" &&
    Object.values(s.history).some((list) =>
      list.some((id) => !!variationFor(id)),
    )
  )
    fail("French history cannot contain Dutch variations");
  if (
    Object.values(s.history).some((list) =>
      list.some((id) => !ids.has(parentFor(id))),
    )
  )
    fail("History outside session");
  const resolvePractice = (id: string) =>
    s.lang === "nl" && variationFor(id)
      ? variationCard(id)
      : cardFor(s.lang, id);
  if (s.quiz.current?.answerId) {
    const c = resolvePractice(s.quiz.current.cardId);
    if (!c || !modelFor(c, s.quiz.current.answerId))
      fail("Unknown answer for current card");
  }
  if (s.quiz.current?.outcome?.answerId) {
    const c = resolvePractice(s.quiz.current.cardId);
    if (!c || !modelFor(c, s.quiz.current.outcome.answerId))
      fail("Unknown feedback answer");
  }
  if (
    s.quizReview?.some((r) => {
      const c = resolvePractice(r.cardId);
      return !ids.has(parentFor(r.cardId)) || !c || !modelFor(c, r.answerId);
    })
  )
    fail("Invalid quiz review");
  for (const [id, p] of [
    ...Object.entries(s.cards),
    ...Object.entries(s.childProgress),
  ]) {
    if (p.quizAnswerRotation) {
      const c = resolvePractice(id);
      const r = p.quizAnswerRotation;
      if (
        !c ||
        new Set(r.remaining).size !== r.remaining.length ||
        [...r.remaining, r.last].some((a) => !modelFor(c, a))
      )
        fail("Invalid answer rotation");
    }
  }
  if (ids.size !== s.cardIds.length) fail("Duplicate card ids");
  if (Object.keys(s.cards).some((id) => !ids.has(id)))
    fail("Progress for a card outside the session");
  if (
    s.study.order.length !== s.cardIds.length ||
    s.study.order.some((id) => !ids.has(id)) ||
    new Set(s.study.order).size !== s.cardIds.length
  )
    fail("Study order is not a permutation of the session cards");
  if (s.study.pos >= s.study.order.length) fail("Study position out of range");
  for (const current of [s.speaking.current, s.quiz.current]) {
    if (current && !ids.has(parentFor(current.cardId)))
      fail("Current card outside the session");
    if (current && variationFor(current.cardId)) {
      const family = s.variations[parentFor(current.cardId)];
      if (
        !family?.enabled ||
        !variationsFor(parentFor(current.cardId))
          .slice(0, family.unlocked)
          .some((v) => v.id === current.cardId)
      )
        fail("Current variation is locked or disabled");
    }
  }
  if (
    s.events.some(
      (event) =>
        !ids.has(parentFor(event.cardId)) ||
        (s.lang !== "nl" && !!variationFor(event.cardId)),
    )
  )
    fail("Event outside session or language");
}
/**
 * A session has ONE immutable language. Records saved before French existed carry no language and are Dutch, so reading
 * stored data treats a missing language as 'nl'. New requests must name their language: an unknown or malformed one is rejected.
 */
export const sessionSchema = sessionShape
  .extend({ lang: langSchema.default(DEFAULT_LANG) })
  .superRefine(checkSession);
export const newSessionSchema = sessionShape
  .extend({ lang: langSchema })
  .superRefine(checkSession);
export type Session = z.infer<typeof sessionSchema>;

const actionBase = { id: idString, at: isoDate };
const attempt = z.object({
  cardId: practiceId,
  attemptId: idString,
  level: z.enum(LEVELS).optional(),
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    ...actionBase,
    type: z.literal("study/next"),
    nextOrder: z.array(cardId).max(MAX_SESSION_CARDS).optional(),
  }),
  z.object({
    ...actionBase,
    type: z.literal("speaking/open"),
    cardId: practiceId,
    attemptId: idString,
    level: z.enum(LEVELS).optional(),
  }),
  z.object({
    ...actionBase,
    type: z.literal("speaking/reveal"),
    attemptId: idString,
  }),
  z.object({
    ...actionBase,
    type: z.literal("speaking/choose"),
    attemptId: idString,
    level: z.enum(LEVELS),
  }),
  z.object({
    ...actionBase,
    type: z.literal("speaking/submit"),
    attemptId: idString,
    level: z.enum(LEVELS),
    next: attempt.nullable(),
  }),
  z.object({
    ...actionBase,
    type: z.literal("quiz/open"),
    rotateAnswers: z.boolean().optional(),
    cardId: practiceId,
    attemptId: idString,
    tokenOrder: z
      .array(z.string().regex(/^t\d{1,2}$/))
      .min(1)
      .max(40),
  }),
  z.object({
    ...actionBase,
    type: z.literal("quiz/draft"),
    attemptId: idString,
    answer: z.array(z.string().regex(/^t\d{1,2}$/)).max(40),
  }),
  z.object({
    ...actionBase,
    type: z.literal("quiz/submit"),
    attemptId: idString,
    answer: z
      .array(z.string().regex(/^t\d{1,2}$/))
      .min(1)
      .max(40),
  }),
  z.object({
    ...actionBase,
    type: z.literal("quiz/continue"),
    rotateAnswers: z.boolean().optional(),
    attemptId: idString,
    next: attempt
      .extend({
        tokenOrder: z
          .array(z.string().regex(/^t\d{1,2}$/))
          .min(1)
          .max(40),
      })
      .nullable(),
  }),
  z.object({
    ...actionBase,
    type: z.literal("variations/toggle"),
    parentId: cardId,
    enabled: z.boolean(),
  }),
  z.object({
    ...actionBase,
    type: z.literal("rename"),
    name: z.string().trim().min(1).max(80),
  }),
]);
export type Action = z.infer<typeof actionSchema>;
export type ActionInput = Action extends infer A
  ? A extends { id: string; at: string }
    ? Omit<A, "id" | "at">
    : never
  : never;

/** A change to the learner's global card level caused by a Speaking rating. */
export type LevelEffect = {
  lang: Lang;
  cardId: string;
  level: Level;
  at: string;
};
export type Rejection =
  | "duplicate"
  | "archived"
  | "stale"
  | "invalid"
  | "busy"
  | "incomplete"
  | "not-revealed"
  | "not-chosen";
export type ApplyResult = {
  session: Session;
  applied: boolean;
  reason?: Rejection;
  effects: LevelEffect[];
};
