import { beforeEach, describe, expect, it } from 'vitest';
import { CARDS, newReview, rateLevel } from '@/lib/flashcards/engine';
import { MemoryReviewRepo, MemorySessionRepo } from '@/lib/sessions/memoryRepo';
import { applySessionActions, createSession, deleteSession, getSession, listSessions } from '@/lib/sessions/service';
import { MAX_ACTIVE_SESSIONS, MAX_ACTIONS_PER_REQUEST, type Session } from '@/lib/sessions/types';
import { at, correctAnswer, makeAction, makeSession, NOW, orderFor, uid } from './helpers/sessions';

const A = '65f000000000000000000001';
const B = '65f000000000000000000002';
let repo: MemorySessionRepo;
let reviews: MemoryReviewRepo;
beforeEach(() => { repo = new MemorySessionRepo(); reviews = new MemoryReviewRepo(); });

const created = async (owner = A, session = makeSession(3)) => {
  const result = await createSession(repo, owner, session);
  if (result.status !== 'created') throw new Error(`not created: ${result.status}`);
  return result.session;
};
const send = (owner: string, id: string, ...actions: ReturnType<typeof makeAction>[]) => applySessionActions(repo, reviews, owner, id, actions, NOW);

/** Plays a session to completion by sending real actions through the server logic, as a device would. */
async function completeOnServer(owner: string, id: string) {
  for (let guard = 0; guard < 400; guard++) {
    const stored = (await getSession(repo, owner, id))!;
    if (stored.status === 'archived') return stored;
    const actions: ReturnType<typeof makeAction>[] = [];
    if (!stored.speaking.done) {
      const current = stored.speaking.current;
      const attemptId = current?.attemptId ?? uid('att');
      if (!current) actions.push(makeAction({ type: 'speaking/open', cardId: stored.cardIds.find(c => !stored.cards[c].spDone)!, attemptId }));
      if (!current?.revealed) actions.push(makeAction({ type: 'speaking/reveal', attemptId }));
      actions.push(makeAction({ type: 'speaking/choose', attemptId, level: 'mastered' }), makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }));
    } else {
      const current = stored.quiz.current;
      const cardId = current?.cardId ?? stored.cardIds.find(c => !stored.cards[c].qDone)!;
      const attemptId = current?.attemptId ?? uid('att');
      if (!current) actions.push(makeAction({ type: 'quiz/open', cardId, attemptId, tokenOrder: orderFor(cardId) }));
      if (!current?.outcome) actions.push(makeAction({ type: 'quiz/submit', attemptId, answer: correctAnswer(cardId) }));
      actions.push(makeAction({ type: 'quiz/continue', attemptId, next: null }));
    }
    const reply = await send(owner, id, ...actions);
    if (reply.status !== 'ok') throw new Error(`server replied ${reply.status}`);
  }
  throw new Error('session did not complete');
}

describe('creating and importing sessions on the server', () => {
  it('stores a valid session once and treats a repeat of the same id as idempotent', async () => {
    const session = makeSession(4);
    expect((await createSession(repo, A, session)).status).toBe('created');
    expect((await createSession(repo, A, session)).status).toBe('exists');
    expect(await listSessions(repo, A)).toHaveLength(1);
  });
  it('rejects malformed sessions, unknown card ids, duplicate ids and inconsistent state', async () => {
    const good = makeSession(3);
    for (const bad of [null, {}, { ...good, cardIds: ['nope'] }, { ...good, cardIds: [good.cardIds[0], good.cardIds[0]] }, { ...good, name: '' },
      { ...good, study: { ...good.study, order: [good.cardIds[0]] } }, { ...good, cards: { ...good.cards, 'shopping-50': good.cards[good.cardIds[0]] } },
      { ...good, id: 'x' }, { ...good, speaking: { current: { cardId: CARDS[40].id, attemptId: uid('att'), revealed: false, chosen: null }, done: false } }]) {
      expect((await createSession(repo, A, bad)).status).toBe('invalid');
    }
    expect(await listSessions(repo, A)).toHaveLength(0);
  });
  it('normalises imported state: server revision, completion and status are recomputed', async () => {
    const tampered = { ...makeSession(2), rev: 99, status: 'archived' as const, completedAt: at, speaking: { current: null, done: true }, quiz: { current: null, done: true, points: 0 } };
    const stored = await createSession(repo, A, tampered);
    expect(stored.status).toBe('created');
    const session = (stored as { session: Session }).session;
    expect(session.rev).toBe(0);
    expect(session.status).toBe('active'); // cards are not actually finished
    expect(session.speaking.done).toBe(false);
  });
  it('allows at most five ACTIVE sessions, and finished sessions do not use a slot', async () => {
    const ids: string[] = [];
    for (let i = 0; i < MAX_ACTIVE_SESSIONS; i++) ids.push((await created(A, makeSession(1, i))).id);
    const sixth = await createSession(repo, A, makeSession(1, 9));
    expect(sixth).toMatchObject({ status: 'limit' });
    expect((sixth as { message: string }).message).toMatch(/5 active sessions/);
    expect(await listSessions(repo, A)).toHaveLength(5);
    expect((await completeOnServer(A, ids[0])).status).toBe('archived'); // finishing frees its slot
    expect((await createSession(repo, A, makeSession(1, 9))).status).toBe('created');
    expect((await createSession(repo, A, makeSession(1, 10))).status).toBe('limit');
    expect(await listSessions(repo, A)).toHaveLength(6); // five active + one finished kept as history
  });
  it('enforces the limit atomically when many requests create sessions at the same time', async () => {
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, i) => createSession(repo, A, makeSession(1, i))));
    expect(attempts.filter(r => r.status === 'created')).toHaveLength(MAX_ACTIVE_SESSIONS);
    expect(attempts.filter(r => r.status === 'limit')).toHaveLength(12 - MAX_ACTIVE_SESSIONS);
    expect(await listSessions(repo, A)).toHaveLength(MAX_ACTIVE_SESSIONS);
    // another account is unaffected by the first one's limit
    expect((await createSession(repo, B, makeSession(1, 0))).status).toBe('created');
  });
  it('treats a simultaneous repeat of the same session id as one session', async () => {
    const session = makeSession(2);
    const results = await Promise.all([createSession(repo, A, session), createSession(repo, A, session), createSession(repo, A, session)]);
    expect(results.filter(r => r.status === 'created')).toHaveLength(1);
    expect(await listSessions(repo, A)).toHaveLength(1);
  });
});

describe('ownership and validation', () => {
  it('never exposes, changes or deletes another account\'s sessions', async () => {
    const mine = await created(A);
    expect(await listSessions(repo, B)).toEqual([]);
    expect(await getSession(repo, B, mine.id)).toBeNull();
    expect(await send(B, mine.id, makeAction({ type: 'study/next' }))).toEqual({ status: 'not-found' });
    expect(await deleteSession(repo, B, mine.id)).toBe(false);
    expect(await getSession(repo, A, mine.id)).not.toBeNull();
    expect((await getSession(repo, A, mine.id))!.study.pos).toBe(0);
  });
  it('the same session id can exist independently for two accounts', async () => {
    const shared = makeSession(2);
    expect((await createSession(repo, A, shared)).status).toBe('created');
    expect((await createSession(repo, B, shared)).status).toBe('created');
    await send(A, shared.id, makeAction({ type: 'study/next' }));
    expect((await getSession(repo, B, shared.id))!.study.pos).toBe(0);
  });
  it('rejects invalid action batches', async () => {
    const s = await created();
    for (const raw of [[], 'nope', null, [{}], [{ id: 'x', at, type: 'study/next' }], [{ id: uid('a'), at: 'yesterday', type: 'study/next' }],
      [{ id: uid('a'), at, type: 'speaking/open', cardId: 'not-a-card', attemptId: uid('x') }], Array.from({ length: MAX_ACTIONS_PER_REQUEST + 1 }, () => makeAction({ type: 'study/next' }))]) {
      expect((await applySessionActions(repo, reviews, A, s.id, raw, NOW)).status).toBe('invalid');
    }
  });
  it('rejects a card that does not belong to the session even though it is a real card', async () => {
    const s = await created();
    const outsider = CARDS.find(c => !s.cardIds.includes(c.id))!.id;
    const result = await send(A, s.id, makeAction({ type: 'speaking/open', cardId: outsider, attemptId: uid('att') }));
    expect(result).toMatchObject({ status: 'ok', applied: [], rejected: [{ reason: 'invalid' }] });
    const quiz = await send(A, s.id, makeAction({ type: 'quiz/open', cardId: outsider, attemptId: uid('att'), tokenOrder: orderFor(outsider) }));
    expect(quiz).toMatchObject({ applied: [], rejected: [{ reason: 'invalid' }] });
  });
});

describe('applying actions', () => {
  it('applies a batch, bumps the revision and returns the authoritative session', async () => {
    const s = await created();
    const result = await send(A, s.id, makeAction({ type: 'study/next' }), makeAction({ type: 'study/next' }));
    expect(result.status).toBe('ok');
    const ok = result as Extract<typeof result, { status: 'ok' }>;
    expect(ok.applied).toHaveLength(2);
    expect(ok.session.rev).toBe(1);
    expect(ok.session.study.pos).toBe(2);
  });
  it('is safe to replay: the same actions never apply (or score) twice', async () => {
    const s = await created();
    const open = makeAction({ type: 'quiz/open', cardId: s.cardIds[0], attemptId: 'attempt-svc-0001', tokenOrder: orderFor(s.cardIds[0]) });
    const submit = makeAction({ type: 'quiz/submit', attemptId: 'attempt-svc-0001', answer: correctAnswer(s.cardIds[0]) });
    await send(A, s.id, open, submit);
    const replay = await send(A, s.id, open, submit) as Extract<Awaited<ReturnType<typeof send>>, { status: 'ok' }>;
    expect(replay.applied).toEqual([]);
    expect(replay.rejected.map(r => r.reason)).toEqual(['duplicate', 'duplicate']);
    const stored = (await getSession(repo, A, s.id))!;
    expect(stored.quiz.points).toBe(10);
    expect(stored.cards[s.cardIds[0]].qCorrect).toBe(1);
    expect(stored.rev).toBe(1); // the replay wrote nothing
  });
  it('updates the global card level once per applied Speaking rating, and not on replay', async () => {
    const s = await created();
    const attemptId = 'attempt-svc-0002';
    const batch = [
      makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId }),
      makeAction({ type: 'speaking/reveal', attemptId }),
      makeAction({ type: 'speaking/choose', attemptId, level: 'mastered' }),
      makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }),
    ];
    const first = await send(A, s.id, ...batch) as Extract<Awaited<ReturnType<typeof send>>, { status: 'ok' }>;
    expect(first.reviews[s.cardIds[0]]).toMatchObject({ level: 'mastered', masteredCount: 1, seen: 1 });
    await send(A, s.id, ...batch);
    expect(reviews.rows.get(`${A}\u0000${s.cardIds[0]}`)).toMatchObject({ level: 'mastered', masteredCount: 1, seen: 1 });
    // Study, Quiz and rejected actions never touch global levels
    await send(A, s.id, makeAction({ type: 'study/next' }));
    expect(reviews.rows.size).toBe(1);
  });
  it('preserves existing global v2 levels and counters, adding to them', async () => {
    const s = await created();
    const existing = { ...rateLevel(s.cardIds[0], newReview(s.cardIds[0], NOW), 'easy', NOW), masteredCount: 4, seen: 7 };
    reviews.seed(A, { ...existing, updatedAt: '2026-10-01T00:00:00.000Z' });
    const attemptId = 'attempt-svc-0003';
    const result = await send(A, s.id,
      makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId }), makeAction({ type: 'speaking/reveal', attemptId }),
      makeAction({ type: 'speaking/choose', attemptId, level: 'medium' }), makeAction({ type: 'speaking/submit', attemptId, level: 'medium', next: null })) as Extract<Awaited<ReturnType<typeof send>>, { status: 'ok' }>;
    expect(result.reviews[s.cardIds[0]]).toMatchObject({ level: 'medium', masteredCount: 4, seen: 8 });
  });
  it('an older offline rating does not undo a newer one made on another device', async () => {
    const s = await created();
    reviews.seed(A, { ...newReview(s.cardIds[0], NOW), level: 'difficult', updatedAt: '2026-10-14T00:00:00.000Z', seen: 1 });
    const attemptId = 'attempt-svc-0004';
    const old = (type: 'speaking/open' | 'speaking/reveal') => makeAction(type === 'speaking/open' ? { type, cardId: s.cardIds[0], attemptId } : { type, attemptId });
    await send(A, s.id, old('speaking/open'), old('speaking/reveal'), makeAction({ type: 'speaking/choose', attemptId, level: 'easy' }), makeAction({ type: 'speaking/submit', attemptId, level: 'easy', next: null }));
    expect(reviews.rows.get(`${A}\u0000${s.cardIds[0]}`)).toMatchObject({ level: 'difficult', seen: 2 });
  });
  it('two devices working at once never lose counters (compare-and-swap with re-apply)', async () => {
    const s = await created(A, makeSession(2));
    const [x, y] = s.cardIds;
    let interleaved = false;
    repo.beforeReplace = (owner, id) => { // device B writes between device A's read and write
      if (interleaved) return; interleaved = true;
      void owner; void id;
      const row = (repo as unknown as { rows: Map<string, { session: Session; slot: number }> }).rows.get(`${A}\u0000${s.id}`)!;
      const bumped = structuredClone(row.session); bumped.rev += 1; bumped.study.pos += 1; bumped.applied.push('other-device-action-1'); bumped.updatedAt = at;
      (repo as unknown as { rows: Map<string, unknown> }).rows.set(`${A}\u0000${s.id}`, { session: bumped, slot: row.slot });
    };
    const result = await send(A, s.id, makeAction({ type: 'quiz/open', cardId: x, attemptId: 'attempt-svc-0005', tokenOrder: orderFor(x) }), makeAction({ type: 'quiz/submit', attemptId: 'attempt-svc-0005', answer: correctAnswer(x) })) as Extract<Awaited<ReturnType<typeof send>>, { status: 'ok' }>;
    expect(result.applied).toHaveLength(2);
    const stored = (await getSession(repo, A, s.id))!;
    expect(stored.study.pos).toBe(1); // the other device's change survived
    expect(stored.cards[x].qCorrect).toBe(1); // and so did this one
    expect(stored.quiz.points).toBe(10);
    expect(stored.rev).toBe(2);
    void y;
  });
  it('does not resurrect a session deleted on another device, and reports not-found', async () => {
    const s = await created();
    expect(await deleteSession(repo, A, s.id)).toBe(true);
    expect(await send(A, s.id, makeAction({ type: 'study/next' }))).toEqual({ status: 'not-found' });
    expect(await listSessions(repo, A)).toEqual([]);
    expect(await deleteSession(repo, A, s.id)).toBe(false);
  });
  it('deleting a session leaves global levels and other sessions untouched', async () => {
    const s = await created(A, makeSession(2));
    const other = await created(A, makeSession(2, 5));
    const attemptId = 'attempt-svc-0006';
    await send(A, s.id, makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId }), makeAction({ type: 'speaking/reveal', attemptId }), makeAction({ type: 'speaking/choose', attemptId, level: 'easy' }), makeAction({ type: 'speaking/submit', attemptId, level: 'easy', next: null }));
    await deleteSession(repo, A, s.id);
    expect(reviews.rows.get(`${A}\u0000${s.cardIds[0]}`)).toMatchObject({ level: 'easy' });
    expect(await getSession(repo, A, other.id)).not.toBeNull();
  });
  it('a finished session is archived, frees its slot, and Study keeps working afterwards', async () => {
    const full: Session[] = [];
    for (let i = 0; i < MAX_ACTIVE_SESSIONS; i++) full.push(await created(A, makeSession(1, i)));
    const finished = await completeOnServer(A, full[0].id);
    expect(finished).toMatchObject({ status: 'archived', speaking: { done: true }, quiz: { done: true } });
    expect(finished.completedAt).not.toBeNull();
    expect((await createSession(repo, A, makeSession(1, 30))).status).toBe('created'); // slot freed
    expect((await send(A, finished.id, makeAction({ type: 'study/next' }))).status).toBe('ok');
    const reopened = (await getSession(repo, A, finished.id))!;
    expect(reopened.status).toBe('archived'); // reopening never restarts or resets counters
    expect(reopened.cards[finished.cardIds[0]]).toMatchObject({ spDone: true, qDone: true, spStreak: 10, qStreak: 10 });
  });
});

describe('global levels are separate from sessions', () => {
  it('answering the Quiz never changes global levels', async () => {
    const s = await created();
    const id = s.cardIds[0];
    await send(A, s.id, makeAction({ type: 'quiz/open', cardId: id, attemptId: 'attempt-svc-0007', tokenOrder: orderFor(id) }), makeAction({ type: 'quiz/submit', attemptId: 'attempt-svc-0007', answer: correctAnswer(id) }));
    expect(reviews.rows.size).toBe(0);
  });
});
