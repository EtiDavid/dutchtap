import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoClient, ObjectId, type Db } from 'mongodb';
import { MongoReviewRepo, MongoSessionRepo } from '@/lib/sessions/mongoRepo';
import { applySessionActions, createSession, deleteSession, getSession, listSessions } from '@/lib/sessions/service';
import { MAX_ACTIVE_SESSIONS } from '@/lib/sessions/types';
import { correctAnswer, makeAction, makeSession, NOW, orderFor, uid } from './helpers/sessions';

/**
 * Integration tests against a REAL MongoDB. They run only when TEST_MONGODB_URI points at a local database
 * (for example `docker run -d -p 127.0.0.1:27018:27017 mongo:7`) and use a throwaway database that is dropped afterwards.
 * They refuse to run against anything that is not localhost, so they can never touch the production Atlas database.
 */
const uri = process.env.TEST_MONGODB_URI;
const local = !!uri && /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(uri);
const maybe = local ? describe : describe.skip;

maybe('MongoDB sessions (integration)', () => {
  let client: MongoClient; let db: Db; let repo: MongoSessionRepo; let reviews: MongoReviewRepo;
  const owner = () => new ObjectId().toHexString();
  beforeAll(async () => {
    client = await new MongoClient(uri!).connect();
    db = client.db(`dutchtap_test_${Date.now()}`);
    repo = new MongoSessionRepo(db); reviews = new MongoReviewRepo(db);
  });
  afterAll(async () => { await db?.dropDatabase(); await client?.close(); });

  it('enforces the five-active limit with unique indexes when many requests race', async () => {
    const a = owner(); const b = owner();
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => createSession(repo, a, makeSession(1, i))));
    expect(results.filter(r => r.status === 'created')).toHaveLength(MAX_ACTIVE_SESSIONS);
    expect(results.filter(r => r.status === 'limit')).toHaveLength(15);
    expect(await listSessions(repo, a)).toHaveLength(MAX_ACTIVE_SESSIONS);
    expect((await createSession(repo, b, makeSession(1, 0))).status).toBe('created'); // another owner has its own five slots
  });

  it('treats simultaneous creates of the same session id as a single session', async () => {
    const a = owner(); const session = makeSession(2);
    const results = await Promise.all(Array.from({ length: 6 }, () => createSession(repo, a, session)));
    expect(results.filter(r => r.status === 'created')).toHaveLength(1);
    expect(results.filter(r => r.status === 'exists')).toHaveLength(5);
    expect(await listSessions(repo, a)).toHaveLength(1);
  });

  it('keeps owners isolated for reading, writing and deleting', async () => {
    const a = owner(); const b = owner();
    const made = await createSession(repo, a, makeSession(2));
    const id = (made as { session: { id: string } }).session.id;
    expect(await getSession(repo, b, id)).toBeNull();
    expect(await listSessions(repo, b)).toEqual([]);
    expect((await applySessionActions(repo, reviews, b, id, [makeAction({ type: 'study/next' })], NOW)).status).toBe('not-found');
    expect(await deleteSession(repo, b, id)).toBe(false);
    expect(await getSession(repo, a, id)).not.toBeNull();
  });

  it('loses no counters when two devices send actions at the same moment', async () => {
    const a = owner(); const made = await createSession(repo, a, makeSession(5));
    const session = (made as { session: ReturnType<typeof makeSession> }).session;
    const cards = session.cardIds;
    const device = (cardId: string, attemptId: string) => applySessionActions(repo, reviews, a, session.id, [
      makeAction({ type: 'quiz/open', cardId, attemptId, tokenOrder: orderFor(cardId) }),
      makeAction({ type: 'quiz/submit', attemptId, answer: correctAnswer(cardId) }),
    ], NOW);
    // Four requests race: a quiz answer and three Study steps. Every one must be applied exactly once.
    const study = () => applySessionActions(repo, reviews, a, session.id, [makeAction({ type: 'study/next' })], NOW);
    const replies = await Promise.all([device(cards[0], 'attempt-mongo-001'), study(), study(), study()]);
    expect(replies.every(r => r.status === 'ok')).toBe(true);
    const stored = (await getSession(repo, a, session.id))!;
    expect(stored.study.pos).toBe(3); // all three study steps counted
    expect(stored.cards[cards[0]].qCorrect).toBe(1); expect(stored.quiz.points).toBe(10);
    expect(stored.applied.length).toBe(5);
    expect(stored.rev).toBeGreaterThanOrEqual(4);
  });

  it('replaying the same request is harmless', async () => {
    const a = owner(); const made = await createSession(repo, a, makeSession(2));
    const session = (made as { session: ReturnType<typeof makeSession> }).session;
    const id = session.cardIds[0];
    const batch = [makeAction({ type: 'quiz/open', cardId: id, attemptId: 'attempt-mongo-002', tokenOrder: orderFor(id) }), makeAction({ type: 'quiz/submit', attemptId: 'attempt-mongo-002', answer: correctAnswer(id) })];
    await Promise.all([applySessionActions(repo, reviews, a, session.id, batch, NOW), applySessionActions(repo, reviews, a, session.id, batch, NOW), applySessionActions(repo, reviews, a, session.id, batch, NOW)]);
    const stored = (await getSession(repo, a, session.id))!;
    expect(stored.quiz.points).toBe(10); expect(stored.cards[id].qCorrect).toBe(1);
  });

  it('updates the global level once, replacing an older-format record and keeping newer counters', async () => {
    const a = owner(); const made = await createSession(repo, a, makeSession(2));
    const session = (made as { session: ReturnType<typeof makeSession> }).session;
    const id = session.cardIds[0];
    await db.collection('flashcardReviews').insertOne({ userId: new ObjectId(a), id, stage: 2, dueAt: NOW.toISOString(), updatedAt: '2026-01-01T00:00:00.000Z', recalls: 3, attempts: 4, lastRewardDate: null, points: 20 });
    const attemptId = 'attempt-mongo-003';
    const batch = [makeAction({ type: 'speaking/open', cardId: id, attemptId }), makeAction({ type: 'speaking/reveal', attemptId }), makeAction({ type: 'speaking/choose', attemptId, level: 'mastered' }), makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null })];
    await applySessionActions(repo, reviews, a, session.id, batch, NOW);
    await applySessionActions(repo, reviews, a, session.id, batch, NOW);
    const docs = await db.collection('flashcardReviews').find({ userId: new ObjectId(a), id }).toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ level: 'mastered', masteredCount: 1, seen: 1 });
    expect(docs[0]).not.toHaveProperty('stage');
  });

  it('finishing a session frees its slot, and deleting one removes only that session', async () => {
    const a = owner();
    const ids: string[] = [];
    for (let i = 0; i < MAX_ACTIVE_SESSIONS; i++) ids.push(((await createSession(repo, a, makeSession(1, i))) as { session: { id: string } }).session.id);
    expect((await createSession(repo, a, makeSession(1, 20))).status).toBe('limit');
    const first = (await getSession(repo, a, ids[0]))!;
    const card = first.cardIds[0];
    for (let i = 0; i < 10; i++) {
      const sp = uid('att'); const qz = uid('att');
      const current = (await getSession(repo, a, ids[0]))!;
      await applySessionActions(repo, reviews, a, ids[0], [
        makeAction({ type: 'speaking/open', cardId: card, attemptId: sp }), makeAction({ type: 'speaking/reveal', attemptId: current.speaking.current?.attemptId ?? sp }),
        makeAction({ type: 'speaking/choose', attemptId: current.speaking.current?.attemptId ?? sp, level: 'mastered' }), makeAction({ type: 'speaking/submit', attemptId: current.speaking.current?.attemptId ?? sp, level: 'mastered', next: null }),
      ].filter((_, idx) => !(current.speaking.current && idx === 0)), NOW);
      void qz;
    }
    for (let i = 0; i < 10; i++) {
      const current = (await getSession(repo, a, ids[0]))!.quiz.current;
      const attemptId = current?.attemptId ?? uid('att');
      await applySessionActions(repo, reviews, a, ids[0], [
        ...(current ? [] : [makeAction({ type: 'quiz/open', cardId: card, attemptId, tokenOrder: orderFor(card) })]),
        makeAction({ type: 'quiz/submit', attemptId, answer: correctAnswer(card) }), makeAction({ type: 'quiz/continue', attemptId, next: null }),
      ], NOW);
    }
    expect((await getSession(repo, a, ids[0]))!.status).toBe('archived');
    expect((await createSession(repo, a, makeSession(1, 21))).status).toBe('created');
    expect(await deleteSession(repo, a, ids[1])).toBe(true);
    expect(await listSessions(repo, a)).toHaveLength(5); // 3 older active + the new one + the finished one kept as history
    expect((await getSession(repo, a, ids[0]))).not.toBeNull();
    expect(await db.collection('flashcardReviews').countDocuments({ userId: new ObjectId(a) })).toBe(1); // the global level survived the deletion
  });
});
