import { newReview, type Level, type Review } from '@/lib/flashcards/engine';
import { applyActions, isComplete, unfinished } from './engine';
import type { Lang } from '@/lib/lang';
import { MAX_ACTIONS_PER_REQUEST, MAX_ACTIVE_SESSIONS, actionSchema, newSessionSchema, type Action, type LevelEffect, type Rejection, type Session } from './types';

/** Server-side session logic, independent of the database so it can be tested with an in-memory repository. */
export type StoredSession = { session: Session; slot: number | null };

export interface SessionRepo {
  list(owner: string): Promise<StoredSession[]>;
  get(owner: string, id: string): Promise<StoredSession | null>;
  /** Inserts atomically. Active sessions need a free slot (1..MAX_ACTIVE_SESSIONS); `exists` means the same id was already stored. */
  insert(owner: string, session: Session): Promise<{ ok: true; stored: StoredSession } | { ok: false; reason: 'limit' } | { ok: false; reason: 'exists'; existing: StoredSession }>;
  /** Compare-and-swap on `rev`. Returns false if the stored revision changed (or the session was deleted) in the meantime. */
  replace(owner: string, id: string, expectedRev: number, next: Session): Promise<boolean>;
  remove(owner: string, id: string): Promise<boolean>;
}
export interface ReviewRepo {
  /** Applies one Speaking rating to the learner's global card level for that language and returns the stored record. */
  applyLevel(owner: string, lang: Lang, cardId: string, level: Level, at: string): Promise<Review>;
}

export function applyLevelToReview(existing: Review | undefined, cardId: string, level: Level, at: string): Review {
  const base = existing ?? newReview(cardId, new Date(at));
  const newer = !existing || at >= existing.updatedAt; // an older offline rating must not undo a later one made elsewhere
  return {
    ...base, level: newer ? level : base.level, seen: base.seen + 1,
    masteredCount: base.masteredCount + (level === 'mastered' ? 1 : 0),
    updatedAt: newer ? at : base.updatedAt,
  };
}

/** Makes imported/created session state internally consistent before it is stored. */
export function normalizeSession(input: Session): Session {
  const s = structuredClone(input);
  s.rev = 0;
  s.speaking.done = unfinished(s, 'speaking').length === 0;
  s.quiz.done = unfinished(s, 'quiz').length === 0;
  if (isComplete(s)) { s.status = 'archived'; s.completedAt ??= s.updatedAt; }
  else { s.status = 'active'; s.completedAt = null; }
  return s;
}

export type CreateResult =
  | { status: 'created' | 'exists'; session: Session }
  | { status: 'limit'; message: string }
  | { status: 'invalid'; message: string };

/** Creates a session (or imports one from a guest device). Idempotent on the session id. */
export async function createSession(repo: SessionRepo, owner: string, raw: unknown): Promise<CreateResult> {
  const parsed = newSessionSchema.safeParse(raw); // a new session must name its language
  if (!parsed.success) return { status: 'invalid', message: parsed.error.issues[0]?.message ?? 'Invalid session' };
  const result = await repo.insert(owner, normalizeSession(parsed.data));
  if (result.ok) return { status: 'created', session: result.stored.session };
  if (result.reason === 'exists') return { status: 'exists', session: result.existing.session };
  return { status: 'limit', message: `You already have ${MAX_ACTIVE_SESSIONS} active sessions. Finish or delete one first.` };
}

export async function listSessions(repo: SessionRepo, owner: string): Promise<Session[]> {
  return (await repo.list(owner)).map(stored => stored.session);
}

export type ActionsResult =
  | { status: 'ok'; session: Session; applied: string[]; rejected: { id: string; reason: Rejection }[]; reviews: Record<string, Review> }
  | { status: 'not-found' }
  | { status: 'invalid'; message: string }
  | { status: 'busy' };

/**
 * Applies a batch of learner actions to a session. Safe to replay (applied action ids are remembered), and
 * safe with several devices at once: each batch is applied to the latest stored revision and written with
 * compare-and-swap, so counters are never overwritten by a stale snapshot.
 */
export async function applySessionActions(repo: SessionRepo, reviews: ReviewRepo, owner: string, id: string, raw: unknown, now: Date = new Date()): Promise<ActionsResult> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ACTIONS_PER_REQUEST) return { status: 'invalid', message: `Send between 1 and ${MAX_ACTIONS_PER_REQUEST} actions.` };
  const actions: Action[] = [];
  for (const item of raw) {
    const parsed = actionSchema.safeParse(item);
    if (!parsed.success) return { status: 'invalid', message: parsed.error.issues[0]?.message ?? 'Invalid action' };
    actions.push(parsed.data);
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const stored = await repo.get(owner, id);
    if (!stored) return { status: 'not-found' };
    const result = applyActions(stored.session, actions, now);
    if (!result.applied.length) return { status: 'ok', session: stored.session, applied: [], rejected: result.rejected, reviews: {} };
    const next: Session = { ...result.session, rev: stored.session.rev + 1 };
    if (!(await repo.replace(owner, id, stored.session.rev, next))) continue; // someone else wrote first: re-read and re-apply
    const updated: Record<string, Review> = {};
    for (const effect of result.effects as LevelEffect[]) updated[effect.cardId] = await reviews.applyLevel(owner, effect.lang, effect.cardId, effect.level, effect.at);
    return { status: 'ok', session: next, applied: result.applied, rejected: result.rejected, reviews: updated };
  }
  return { status: 'busy' };
}

export async function getSession(repo: SessionRepo, owner: string, id: string): Promise<Session | null> {
  return (await repo.get(owner, id))?.session ?? null;
}
/** Deletes only the session. Global card levels and other sessions are untouched. */
export async function deleteSession(repo: SessionRepo, owner: string, id: string): Promise<boolean> {
  return repo.remove(owner, id);
}
