import { describe, expect, it } from 'vitest';
import { createSessionFromIds } from '@/lib/sessions/engine';
import { MemoryReviewRepo, MemorySessionRepo } from '@/lib/sessions/memoryRepo';
import { applySessionActions, createSession, listSessions } from '@/lib/sessions/service';
import { MAX_ACTIVE_SESSIONS, newSessionSchema, sessionSchema } from '@/lib/sessions/types';
import { CARDS } from '@/lib/flashcards/engine';
import { cardsFor } from '@/lib/content/cards';
import { makeAction, makeSession, NOW, uid } from './helpers/sessions';

const A = '65f000000000000000000001';
const ids = (n: number, from = 0) => CARDS.slice(from, from + n).map(c => c.id);
const french = (n: number, i = 0) => createSessionFromIds({ id: uid('ses'), now: NOW, name: `French ${i}`, cardIds: ids(n, i * 3), topic: 'all', startingLevel: 'difficult', lang: 'fr' });

describe('French sessions', () => {
  it('create with an immutable French language and count towards the same five-session limit as Dutch', async () => {
    const repo = new MemorySessionRepo();
    for (let i = 0; i < 3; i++) expect((await createSession(repo, A, french(2, i))).status).toBe('created');
    for (let i = 0; i < 2; i++) expect((await createSession(repo, A, makeSession(1, i))).status).toBe('created');
    expect((await createSession(repo, A, french(2, 9))).status).toBe('limit');
    expect((await createSession(repo, A, makeSession(1, 9))).status).toBe('limit');
    const all = await listSessions(repo, A);
    expect(all.filter(s => s.lang === 'fr')).toHaveLength(3);
    expect(all.filter(s => s.lang === 'nl')).toHaveLength(2);
  });
  it('enforces the limit atomically across languages under simultaneous creates', async () => {
    const repo = new MemorySessionRepo();
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, i) => createSession(repo, A, i % 2 ? french(1, i) : makeSession(1, i))));
    expect(attempts.filter(r => r.status === 'created')).toHaveLength(MAX_ACTIVE_SESSIONS);
    expect(await listSessions(repo, A)).toHaveLength(MAX_ACTIVE_SESSIONS);
  });
  it('rejects sessions with an unknown language and only treats a missing language as legacy Dutch', () => {
    const fr = french(2);
    expect(newSessionSchema.safeParse({ ...fr, lang: 'de' }).success).toBe(false);
    expect(newSessionSchema.safeParse({ ...fr, lang: undefined }).success).toBe(false);
    const { lang: _lang, ...legacy } = makeSession(2);
    const parsed = sessionSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.lang).toBe('nl');
    expect(sessionSchema.safeParse({ ...legacy, lang: 'xx' }).success).toBe(false);
  });
  it('level changes in a French session update only French reviews', async () => {
    const repo = new MemorySessionRepo();
    const reviews = new MemoryReviewRepo();
    const s = french(1);
    await createSession(repo, A, s);
    const cardId = s.cardIds[0];
    const attemptId = uid('att');
    const reply = await applySessionActions(repo, reviews, A, s.id, [
      makeAction({ type: 'speaking/open', cardId, attemptId }), makeAction({ type: 'speaking/reveal', attemptId }),
      makeAction({ type: 'speaking/choose', attemptId, level: 'mastered' }), makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }),
    ], NOW);
    expect(reply.status).toBe('ok');
    expect(reviews.rows.has(`${A}\u0000fr\u0000${cardId}`)).toBe(true);
    expect(reviews.rows.has(`${A}\u0000nl\u0000${cardId}`)).toBe(false);
  });
  it('can be built for every French card', () => {
    expect(cardsFor('fr')).toHaveLength(600);
  });
});
