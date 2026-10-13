import { z } from 'zod';
import { CARDS, CATEGORIES, LEVELS, type Level } from '@/lib/flashcards/engine';
import { ID_PATTERN } from './ids';

export const MAX_ACTIVE_SESSIONS = 5;
export const MAX_SESSION_CARDS = 100;
/** Consecutive successes needed to retire a card from Speaking or Quiz inside one session. */
export const RETIRE_AT = 10;
export const QUIZ_POINTS = 10;
export const EVENT_LOG_LIMIT = 200;
export const APPLIED_LOG_LIMIT = 500;
export const MAX_ACTIONS_PER_REQUEST = 60;

export type Mode = 'study' | 'speaking' | 'quiz';
export const MODES: readonly Mode[] = ['study', 'speaking', 'quiz'];
export type Topic = 'all' | keyof typeof CATEGORIES;
export const TOPICS = ['all', ...Object.keys(CATEGORIES)] as readonly string[];

const deckIds = new Set(CARDS.map(card => card.id));
const cardId = z.string().refine(id => deckIds.has(id), 'Unknown card');
const idString = z.string().regex(ID_PATTERN);
const isoDate = z.iso.datetime();
const small = z.number().int().min(0).max(RETIRE_AT);
const count = z.number().int().min(0).max(1_000_000);

export const cardProgressSchema = z.object({
  spStreak: small, spDone: z.boolean(), spAttempts: count,
  qStreak: small, qDone: z.boolean(), qCorrect: count, qWrong: count, qLastWrong: z.boolean(),
});
export type CardProgress = z.infer<typeof cardProgressSchema>;

export const eventSchema = z.object({
  id: idString, mode: z.enum(['speaking', 'quiz']), cardId,
  result: z.enum(['recalled', 'not-recalled', 'correct', 'wrong']),
  level: z.enum(LEVELS).optional(), pointsDelta: z.number().int().min(0).max(1000), at: isoDate,
});
export type SessionEvent = z.infer<typeof eventSchema>;

const speakingCurrent = z.object({ cardId, attemptId: idString, revealed: z.boolean(), chosen: z.enum(LEVELS).nullable() });
const quizCurrent = z.object({
  cardId, attemptId: idString,
  tokenOrder: z.array(z.string().regex(/^t\d{1,2}$/)).min(1).max(40),
  answer: z.array(z.string().regex(/^t\d{1,2}$/)).max(40),
  outcome: z.object({ correct: z.boolean(), points: z.number().int().min(0).max(1000) }).nullable(),
});
export type SpeakingCurrent = z.infer<typeof speakingCurrent>;
export type QuizCurrent = z.infer<typeof quizCurrent>;

export const sessionSchema = z.object({
  id: idString,
  name: z.string().trim().min(1).max(80),
  cardIds: z.array(cardId).min(1).max(MAX_SESSION_CARDS),
  topic: z.string().refine(t => TOPICS.includes(t)),
  startingLevel: z.enum(LEVELS),
  createdAt: isoDate, updatedAt: isoDate,
  status: z.enum(['active', 'archived']),
  completedAt: isoDate.nullable(),
  rev: z.number().int().min(0),
  study: z.object({ order: z.array(cardId).min(1).max(MAX_SESSION_CARDS), pos: z.number().int().min(0), round: z.number().int().min(1) }),
  speaking: z.object({ current: speakingCurrent.nullable(), done: z.boolean() }),
  quiz: z.object({ current: quizCurrent.nullable(), done: z.boolean(), points: count }),
  cards: z.record(z.string(), cardProgressSchema),
  events: z.array(eventSchema).max(EVENT_LOG_LIMIT),
  applied: z.array(idString).max(APPLIED_LOG_LIMIT),
}).superRefine((s, ctx) => {
  const ids = new Set(s.cardIds);
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (ids.size !== s.cardIds.length) fail('Duplicate card ids');
  if (Object.keys(s.cards).some(id => !ids.has(id))) fail('Progress for a card outside the session');
  if (s.study.order.length !== s.cardIds.length || s.study.order.some(id => !ids.has(id)) || new Set(s.study.order).size !== s.cardIds.length) fail('Study order is not a permutation of the session cards');
  if (s.study.pos >= s.study.order.length) fail('Study position out of range');
  for (const current of [s.speaking.current, s.quiz.current]) if (current && !ids.has(current.cardId)) fail('Current card outside the session');
});
export type Session = z.infer<typeof sessionSchema>;

const actionBase = { id: idString, at: isoDate };
const attempt = z.object({ cardId, attemptId: idString });
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ ...actionBase, type: z.literal('study/next'), nextOrder: z.array(cardId).max(MAX_SESSION_CARDS).optional() }),
  z.object({ ...actionBase, type: z.literal('speaking/open'), cardId, attemptId: idString }),
  z.object({ ...actionBase, type: z.literal('speaking/reveal'), attemptId: idString }),
  z.object({ ...actionBase, type: z.literal('speaking/choose'), attemptId: idString, level: z.enum(LEVELS) }),
  z.object({ ...actionBase, type: z.literal('speaking/submit'), attemptId: idString, level: z.enum(LEVELS), next: attempt.nullable() }),
  z.object({ ...actionBase, type: z.literal('quiz/open'), cardId, attemptId: idString, tokenOrder: z.array(z.string().regex(/^t\d{1,2}$/)).min(1).max(40) }),
  z.object({ ...actionBase, type: z.literal('quiz/draft'), attemptId: idString, answer: z.array(z.string().regex(/^t\d{1,2}$/)).max(40) }),
  z.object({ ...actionBase, type: z.literal('quiz/submit'), attemptId: idString, answer: z.array(z.string().regex(/^t\d{1,2}$/)).min(1).max(40) }),
  z.object({ ...actionBase, type: z.literal('quiz/continue'), attemptId: idString, next: attempt.extend({ tokenOrder: z.array(z.string().regex(/^t\d{1,2}$/)).min(1).max(40) }).nullable() }),
  z.object({ ...actionBase, type: z.literal('rename'), name: z.string().trim().min(1).max(80) }),
]);
export type Action = z.infer<typeof actionSchema>;
export type ActionInput = Action extends infer A ? (A extends { id: string; at: string } ? Omit<A, 'id' | 'at'> : never) : never;

/** A change to the learner's global card level caused by a Speaking rating. */
export type LevelEffect = { cardId: string; level: Level; at: string };
export type Rejection = 'duplicate' | 'archived' | 'stale' | 'invalid' | 'busy' | 'incomplete' | 'not-revealed' | 'not-chosen';
export type ApplyResult = { session: Session; applied: boolean; reason?: Rejection; effects: LevelEffect[] };
