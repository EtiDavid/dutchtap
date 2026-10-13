import { describe, expect, it } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { SessionStore, storageKeyFor, type Scope } from '@/lib/sessions/store';
import { MAX_ACTIVE_SESSIONS, type ActionInput, type Session } from '@/lib/sessions/types';
import { FakeServer } from './helpers/fakeServer';
import { MemoryStorage } from './helpers/memoryStorage';
import { correctAnswer, makeSession, NOW, orderFor, uid } from './helpers/sessions';

const guestScope: Scope = { kind: 'guest' };
const userScope = (username: string): Scope => ({ kind: 'user', username });
const never = { set: () => 0, clear: () => undefined }; // no automatic timers: tests call sync() themselves

function device(scope: Scope, server?: FakeServer, storage = new MemoryStorage()) {
  const store = new SessionStore({ scope, storage, fetch: server ? server.fetch : null, now: () => NOW, timers: never });
  return { store, storage };
}
async function started(scope: Scope, server?: FakeServer, storage = new MemoryStorage()) {
  const d = device(scope, server, storage); await d.store.start(); return d;
}
const speak = (store: SessionStore, id: string, level: 'mastered' | 'easy' | 'medium' | 'difficult' = 'mastered') => {
  const s = store.get(id)!;
  const cardId = s.speaking.current?.cardId ?? s.cardIds.find(c => !s.cards[c].spDone)!;
  const attemptId = s.speaking.current?.attemptId ?? uid('att');
  if (!s.speaking.current) store.dispatch(id, { type: 'speaking/open', cardId, attemptId });
  store.dispatch(id, { type: 'speaking/reveal', attemptId });
  store.dispatch(id, { type: 'speaking/choose', attemptId, level });
  return store.dispatch(id, { type: 'speaking/submit', attemptId, level, next: null });
};
const quiz = (store: SessionStore, id: string, correct = true) => {
  const s = store.get(id)!;
  const cardId = s.quiz.current?.cardId ?? s.cardIds.find(c => !s.cards[c].qDone)!;
  const attemptId = s.quiz.current?.attemptId ?? uid('att');
  if (!s.quiz.current) store.dispatch(id, { type: 'quiz/open', cardId, attemptId, tokenOrder: orderFor(cardId) });
  const answer = correct ? correctAnswer(cardId) : [...correctAnswer(cardId)].reverse();
  store.dispatch(id, { type: 'quiz/submit', attemptId, answer });
  return attemptId;
};

describe('guest sessions on this device', () => {
  it('keeps the chosen cards, study order and position exactly through a reload', async () => {
    const { store, storage } = await started(guestScope);
    const s = makeSession(6);
    store.create(s);
    store.dispatch(s.id, { type: 'study/next' }); store.dispatch(s.id, { type: 'study/next' });
    const before = store.get(s.id)!;
    const reloaded = await started(guestScope, undefined, storage);
    const after = reloaded.store.get(s.id)!;
    expect(after.cardIds).toEqual(s.cardIds);
    expect(after.study).toEqual(before.study);
    expect(after.study.pos).toBe(2);
  });
  it('restores Speaking (revealed + chosen rating) and the partial word-order answer after a reload', async () => {
    const { store, storage } = await started(guestScope);
    const s = makeSession(3); store.create(s);
    const spId = s.cardIds[0];
    store.dispatch(s.id, { type: 'speaking/open', cardId: spId, attemptId: 'attempt-store-s1' });
    store.dispatch(s.id, { type: 'speaking/reveal', attemptId: 'attempt-store-s1' });
    store.dispatch(s.id, { type: 'speaking/choose', attemptId: 'attempt-store-s1', level: 'medium' });
    const qId = s.cardIds[1]; const order = orderFor(qId);
    store.dispatch(s.id, { type: 'quiz/open', cardId: qId, attemptId: 'attempt-store-q1', tokenOrder: order });
    store.dispatch(s.id, { type: 'quiz/draft', attemptId: 'attempt-store-q1', answer: [order[0], order[1]] });
    const restored = (await started(guestScope, undefined, storage)).store.get(s.id)!;
    expect(restored.speaking.current).toEqual({ cardId: spId, attemptId: 'attempt-store-s1', revealed: true, chosen: 'medium' });
    expect(restored.quiz.current).toMatchObject({ cardId: qId, tokenOrder: order, answer: [order[0], order[1]], outcome: null });
  });
  it('a refresh after a correct answer does not score again', async () => {
    const { store, storage } = await started(guestScope);
    const s = makeSession(2); store.create(s);
    const attemptId = quiz(store, s.id);
    expect(store.get(s.id)!.quiz.points).toBe(10);
    const reloaded = (await started(guestScope, undefined, storage)).store;
    expect(reloaded.get(s.id)!.quiz.points).toBe(10);
    // a back/forward or double submit of the same attempt is rejected, not counted
    const again = reloaded.dispatch(s.id, { type: 'quiz/submit', attemptId, answer: correctAnswer(s.cardIds[0]) });
    expect(again.applied).toBe(false);
    expect(reloaded.get(s.id)!.quiz.points).toBe(10);
  });
  it('enforces the five-active limit locally without discarding anything, and finished sessions do not count', async () => {
    const { store } = await started(guestScope);
    for (let i = 0; i < MAX_ACTIVE_SESSIONS; i++) expect(store.create(makeSession(1, i)).ok).toBe(true);
    const sixth = store.create(makeSession(1, 9));
    expect(sixth).toMatchObject({ ok: false, code: 'limit' });
    expect(store.getSnapshot().sessions).toHaveLength(5);
    const finished = { ...makeSession(1, 20), status: 'archived' as const, completedAt: NOW.toISOString(), speaking: { current: null, done: true }, quiz: { current: null, done: true, points: 0 } };
    expect(store.create(finished).ok).toBe(true); // archived history does not use a slot
  });
  it('deleting removes only that session', async () => {
    const { store } = await started(guestScope);
    const a = makeSession(2); const b = makeSession(2, 5); store.create(a); store.create(b);
    store.remove(a.id);
    expect(store.get(a.id)).toBeUndefined(); expect(store.get(b.id)).toBeDefined();
  });
  it('a new session can share cards with another but keeps separate counters', async () => {
    const { store } = await started(guestScope);
    const a = makeSession(3); const b = { ...makeSession(3), id: uid('ses') };
    store.create(a); store.create(b);
    speak(store, a.id, 'mastered');
    expect(Object.values(store.get(a.id)!.cards).some(c => c.spStreak > 0)).toBe(true);
    expect(Object.values(store.get(b.id)!.cards).every(c => c.spStreak === 0)).toBe(true);
  });
  it('a practise-again copy has the same cards and fresh counters, subject to the limit', async () => {
    const { store } = await started(guestScope);
    const a = makeSession(3); store.create(a); speak(store, a.id);
    const again = store.practiseAgain(a.id);
    expect(again.ok).toBe(true);
    if (again.ok) { expect([...again.session.cardIds].sort()).toEqual([...a.cardIds].sort()); expect(Object.values(again.session.cards).every(c => c.spStreak === 0)).toBe(true); }
    for (let i = 0; i < 3; i++) store.create(makeSession(1, 10 + i));
    expect(store.practiseAgain(a.id)).toMatchObject({ ok: false, code: 'limit' });
  });
  it('survives corrupted or hostile saved data without crashing, and says so', async () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeyFor(guestScope), '{not json');
    const bad = await started(guestScope, undefined, storage);
    expect(bad.store.getSnapshot().sessions).toEqual([]);
    expect(bad.store.getSnapshot().notices[0].text).toMatch(/could not be read/);
    const good = makeSession(2);
    storage.setItem(storageKeyFor(guestScope), JSON.stringify({ v: 1, sessions: { [good.id]: good, evil: { id: 'evil', cardIds: ['not-a-card'] } } }));
    const partial = await started(guestScope, undefined, storage);
    expect(partial.store.getSnapshot().sessions.map(s => s.id)).toEqual([good.id]);
  });
  it('keeps working when device storage is blocked, and reports it', async () => {
    const storage = new MemoryStorage(); storage.broken = true;
    const { store } = await started(guestScope, undefined, storage);
    const s = makeSession(2); store.create(s);
    expect(store.getSnapshot().storageOk).toBe(false);
    store.dispatch(s.id, { type: 'study/next' });
    expect(store.get(s.id)!.study.pos).toBe(1);
  });
  it('guests never sync, and report that progress lives on this device', async () => {
    const server = new FakeServer();
    const { store } = await started(guestScope, server);
    store.create(makeSession(2)); await store.sync();
    expect(server.calls).toEqual([]);
    expect(store.getSnapshot().status).toBe('local');
  });
});

describe('account sessions: saving, offline use and retries', () => {
  it('sends a new session and each action to the account, then reports saved', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(3); store.create(s);
    expect(store.getSnapshot().status).toBe('pending');
    await store.sync();
    expect(store.getSnapshot()).toMatchObject({ status: 'saved', pending: 0, error: null });
    expect((await server.repo.get(server.owner, s.id))?.session.name).toBe(s.name);
    speak(store, s.id, 'mastered');
    await store.sync();
    const remote = (await server.repo.get(server.owner, s.id))!.session;
    expect(remote.cards[remote.events[0].cardId].spStreak).toBe(1);
    expect(server.reviews.rows.size).toBe(1); // one global level updated, not the whole deck
  });
  it('keeps working offline, keeps the queue across a reload, then syncs once without duplicates', async () => {
    const server = new FakeServer(); server.online = false;
    const first = await started(userScope('anna'), server);
    const s = makeSession(3); first.store.create(s);
    await first.store.sync();
    expect(first.store.getSnapshot()).toMatchObject({ status: 'failed' });
    expect(first.store.getSnapshot().pending).toBeGreaterThan(0);
    speak(first.store, s.id, 'mastered'); quiz(first.store, s.id, true);
    const queued = first.store.getSnapshot().pending;
    // refresh while still offline
    const second = await started(userScope('anna'), server, first.storage);
    expect(second.store.getSnapshot().pending).toBe(queued);
    expect(second.store.get(s.id)!.quiz.points).toBe(10);
    server.online = true;
    await second.store.sync();
    expect(second.store.getSnapshot()).toMatchObject({ status: 'saved', pending: 0 });
    const remote = (await server.repo.get(server.owner, s.id))!.session;
    expect(remote.quiz.points).toBe(10);
    expect(remote.events).toHaveLength(2);
    expect(server.reviews.rows.size).toBe(1);
    // syncing again changes nothing
    await second.store.sync();
    expect((await server.repo.get(server.owner, s.id))!.session.quiz.points).toBe(10);
  });
  it('a response lost after the server applied it is replayed safely (no double points or ratings)', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(2); store.create(s); await store.sync();
    quiz(store, s.id, true); speak(store, s.id, 'mastered');
    server.dropResponses = 1; // the actions request is applied by the server but the answer never arrives
    await store.sync();
    expect(store.getSnapshot().status).toBe('failed');
    expect(store.getSnapshot().pending).toBeGreaterThan(0);
    await store.sync();
    const remote = (await server.repo.get(server.owner, s.id))!.session;
    expect(remote.quiz.points).toBe(10);
    expect(remote.cards[remote.events.find(e => e.mode === 'speaking')!.cardId].spAttempts).toBe(1);
    expect((server.reviews.rows.get(`${server.owner}\u0000${remote.events.find(e => e.mode === 'speaking')!.cardId}`))!.seen).toBe(1);
    expect(store.get(s.id)!.quiz.points).toBe(10);
  });
  it('a lost response while creating a session does not create a second copy', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(2); store.create(s);
    server.dropResponses = 1;
    await store.sync();
    await store.sync();
    expect(await server.repo.list(server.owner)).toHaveLength(1);
    expect(store.getSnapshot().sessions).toHaveLength(1);
  });
  it('reports a signed-out account instead of pretending the write was synced', async () => {
    const server = new FakeServer(); server.signedIn = false;
    const { store } = await started(userScope('anna'), server);
    store.create(makeSession(2)); await store.sync();
    expect(store.getSnapshot().status).toBe('failed');
    expect(store.getSnapshot().error).toMatch(/signed out/i);
    expect(store.getSnapshot().pending).toBeGreaterThan(0);
    server.signedIn = true; await store.sync();
    expect(store.getSnapshot().status).toBe('saved');
  });
  it('an action rejected by the server does not leave a phantom rating on the device', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(2); store.create(s); await store.sync();
    const other = await started(userScope('anna'), server);
    await other.store.sync();
    // device 1 opens a Speaking attempt; device 2 had already opened a different one first
    other.store.dispatch(s.id, { type: 'speaking/open', cardId: s.cardIds[1], attemptId: 'attempt-conflict-b' });
    await other.store.sync();
    store.dispatch(s.id, { type: 'speaking/open', cardId: s.cardIds[0], attemptId: 'attempt-conflict-a' });
    store.dispatch(s.id, { type: 'speaking/reveal', attemptId: 'attempt-conflict-a' });
    store.dispatch(s.id, { type: 'speaking/choose', attemptId: 'attempt-conflict-a', level: 'mastered' });
    store.dispatch(s.id, { type: 'speaking/submit', attemptId: 'attempt-conflict-a', level: 'mastered', next: null });
    await store.sync();
    const remote = (await server.repo.get(server.owner, s.id))!.session;
    expect(remote.events).toHaveLength(0);
    expect(remote.speaking.current?.attemptId).toBe('attempt-conflict-b');
    expect(server.reviews.rows.size).toBe(0); // the stale rating never reached the global levels
    expect(store.get(s.id)!.speaking.current?.attemptId).toBe('attempt-conflict-b');
    expect(store.get(s.id)!.events).toHaveLength(0);
  });
  it('coalesces repeated partial answers so only the latest draft is sent', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(2); store.create(s); await store.sync();
    const id = s.cardIds[0]; const order = orderFor(id);
    store.dispatch(s.id, { type: 'quiz/open', cardId: id, attemptId: 'attempt-draft-001', tokenOrder: order });
    for (let n = 1; n <= order.length; n++) store.dispatch(s.id, { type: 'quiz/draft', attemptId: 'attempt-draft-001', answer: order.slice(0, n) });
    expect(store.getSnapshot().pending).toBe(2); // open + one draft
    await store.sync();
    expect((await server.repo.get(server.owner, s.id))!.session.quiz.current!.answer).toEqual(order);
  });
  it('shows the saved / pending / failed state honestly', async () => {
    const server = new FakeServer();
    const { store } = await started(userScope('anna'), server);
    expect(store.getSnapshot().status).toBe('saved');
    const s = makeSession(2); store.create(s);
    expect(store.getSnapshot().status).toBe('pending');
    server.online = false; await store.sync();
    expect(store.getSnapshot().status).toBe('failed');
    server.online = true; await store.sync();
    expect(store.getSnapshot().status).toBe('saved');
  });
});

describe('several devices and accounts', () => {
  it('two devices progress in different modes and neither loses the other\'s counters', async () => {
    const server = new FakeServer();
    const phone = await started(userScope('anna'), server);
    const s = makeSession(3); phone.store.create(s); await phone.store.sync();
    const laptop = await started(userScope('anna'), server);
    expect(laptop.store.get(s.id)).toBeDefined();
    speak(phone.store, s.id, 'mastered');
    quiz(laptop.store, s.id, true);
    await Promise.all([phone.store.sync(), laptop.store.sync()]);
    await phone.store.sync(); await laptop.store.sync();
    for (const d of [phone, laptop]) {
      const view = d.store.get(s.id)!;
      expect(view.quiz.points).toBe(10);
      expect(view.events.map(e => e.mode).sort()).toEqual(['quiz', 'speaking']);
    }
    const remote = (await server.repo.get(server.owner, s.id))!.session;
    expect(remote.quiz.points).toBe(10); expect(remote.events).toHaveLength(2);
  });
  it('a session deleted on one device disappears from the other, with a notice, and is not resurrected', async () => {
    const server = new FakeServer();
    const phone = await started(userScope('anna'), server);
    const s = makeSession(2); phone.store.create(s); await phone.store.sync();
    const laptop = await started(userScope('anna'), server);
    phone.store.remove(s.id); await phone.store.sync();
    laptop.store.dispatch(s.id, { type: 'study/next' }); // offline-ish work on the deleted session
    await laptop.store.sync();
    expect(laptop.store.get(s.id)).toBeUndefined();
    expect(laptop.store.getSnapshot().notices.some(n => /deleted on another device/.test(n.text))).toBe(true);
    expect(await server.repo.list(server.owner)).toHaveLength(0);
  });
  it('when two devices race for the last slot, the loser is kept on the device with an explanation, not discarded', async () => {
    const server = new FakeServer();
    const seed = await started(userScope('anna'), server);
    for (let i = 0; i < MAX_ACTIVE_SESSIONS - 1; i++) seed.store.create(makeSession(1, i));
    await seed.store.sync();
    const phone = await started(userScope('anna'), server); const laptop = await started(userScope('anna'), server);
    const a = makeSession(1, 10); const b = makeSession(1, 11);
    phone.store.create(a); laptop.store.create(b);
    await phone.store.sync(); await laptop.store.sync();
    expect(await server.repo.list(server.owner)).toHaveLength(MAX_ACTIVE_SESSIONS);
    const snapshot = laptop.store.getSnapshot();
    expect(snapshot.refused[b.id]).toMatch(/already has 5 active sessions/);
    expect(laptop.store.get(b.id)).toBeDefined(); // nothing silently discarded
    expect(snapshot.notices.some(n => /kept on this device/.test(n.text))).toBe(true);
    laptop.store.dispatch(b.id, { type: 'study/next' }); // still usable
    // free a slot, then retry
    phone.store.remove(a.id); await phone.store.sync();
    laptop.store.retryRefused(b.id); await laptop.store.sync();
    expect(laptop.store.getSnapshot().refused[b.id]).toBeUndefined();
    expect((await server.repo.get(server.owner, b.id))?.session.id).toBe(b.id);
    expect(await server.repo.list(server.owner)).toHaveLength(MAX_ACTIVE_SESSIONS);
    expect((await server.repo.get(server.owner, b.id))!.session.study.round).toBe(2); // work done while refused was kept and replayed
  });
  it('offline progress on a session created offline updates global levels exactly once when synced', async () => {
    const server = new FakeServer(); server.online = false;
    const { store } = await started(userScope('anna'), server);
    const s = makeSession(2); store.create(s);
    speak(store, s.id, 'mastered');
    server.online = true; await store.sync();
    expect(server.reviews.rows.size).toBe(1);
    expect([...server.reviews.rows.values()][0]).toMatchObject({ level: 'mastered', seen: 1, masteredCount: 1 });
  });
  it('account A\'s sessions are never shown to account B or to a guest on the same browser', async () => {
    const storage = new MemoryStorage();
    const serverA = new FakeServer('65f0000000000000000000a1'); const serverB = new FakeServer('65f0000000000000000000b2');
    const a = await started(userScope('anna'), serverA, storage);
    a.store.create(makeSession(2)); await a.store.sync();
    const b = await started(userScope('ben'), serverB, storage);
    expect(b.store.getSnapshot().sessions).toEqual([]);
    const guest = await started(guestScope, undefined, storage);
    expect(guest.store.getSnapshot().sessions).toEqual([]);
    guest.store.create(makeSession(1, 4));
    expect((await started(userScope('anna'), serverA, storage)).store.getSnapshot().sessions).toHaveLength(1);
    expect((await started(userScope('ben'), serverB, storage)).store.getSnapshot().sessions).toEqual([]);
    expect(storageKeyFor(userScope('Anna'))).toBe(storageKeyFor(userScope('anna')));
  });
});

describe('importing guest sessions into an account', () => {
  it('copies guest sessions on request, keeps their progress, dedupes and removes only what was imported', async () => {
    const server = new FakeServer(); const storage = new MemoryStorage();
    const guest = await started(guestScope, undefined, storage);
    const s1 = makeSession(2); const s2 = makeSession(2, 4);
    guest.store.create(s1); guest.store.create(s2); speak(guest.store, s1.id, 'mastered');
    const account = await started(userScope('anna'), server, storage);
    const result = account.store.importFrom(guest.store);
    expect(result).toEqual({ imported: 2, duplicates: 0, skipped: 0 });
    expect(guest.store.getSnapshot().sessions).toHaveLength(0);
    await account.store.sync();
    const remote = (await server.repo.get(server.owner, s1.id))!.session;
    expect(remote.events).toHaveLength(1);
    // importing the same guest sessions again (e.g. restored from a backup) does not duplicate them
    const again = await started(guestScope, undefined, new MemoryStorage()); again.store.create(s1);
    expect(account.store.importFrom(again.store)).toEqual({ imported: 0, duplicates: 1, skipped: 0 });
    expect(await server.repo.list(server.owner)).toHaveLength(2);
  });
  it('honours the five-active limit: surplus guest sessions stay on the device, nothing is silently discarded', async () => {
    const server = new FakeServer(); const storage = new MemoryStorage();
    const guest = await started(guestScope, undefined, storage);
    for (let i = 0; i < 5; i++) guest.store.create(makeSession(1, i));
    const account = await started(userScope('anna'), server, storage);
    for (let i = 0; i < 3; i++) account.store.create(makeSession(1, 20 + i));
    const result = account.store.importFrom(guest.store);
    expect(result).toEqual({ imported: 2, duplicates: 0, skipped: 3 });
    expect(guest.store.getSnapshot().sessions).toHaveLength(3);
    expect(account.store.getSnapshot().sessions).toHaveLength(5);
  });
});

describe('level effects', () => {
  it('reports each Speaking rating once so the device can update the global level', async () => {
    const { store } = await started(guestScope);
    const s = makeSession(2); store.create(s);
    const seen: { cardId: string; level: string }[] = [];
    store.onLevelEffects(effects => seen.push(...effects));
    speak(store, s.id, 'easy');
    expect(seen).toHaveLength(1); expect(seen[0].level).toBe('easy');
    store.dispatch(s.id, { type: 'study/next' } as ActionInput); quiz(store, s.id, true);
    expect(seen).toHaveLength(1); // Study and Quiz never change global levels
    void CARDS;
  });
});

export type { Session };
