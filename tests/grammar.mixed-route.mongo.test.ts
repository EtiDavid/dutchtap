import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoClient, ObjectId, type Db } from 'mongodb';
import { MIXED_CHALLENGES } from '@/lib/grammarMixed';

/**
 * Runs the REAL /api/grammar-mixed handlers against a REAL local MongoDB (same guard as sessions.mongo.test.ts:
 * only localhost, throwaway database, dropped afterwards). Only the cookie session and the connection are stubbed.
 */
const uri = process.env.TEST_MONGODB_URI;
const local = !!uri && /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(uri);
const maybe = local ? describe : describe.skip;

let db: Db;
let signedIn: { userId: string; username: string } | null = null;
vi.mock('@/lib/auth/session', () => ({ getSession: async () => signedIn }));
vi.mock('@/lib/db/mongodb', () => ({ getDb: async () => db }));

const [a, b] = [MIXED_CHALLENGES[0].id, MIXED_CHALLENGES[1].id];
const stat = (n: number, extra: object = {}) => ({ seen: 2, right: 1, streak: 0, lastWrong: true, at: new Date(Date.UTC(2026, 9, 27, 10, n)).toISOString(), ...extra });
const post = async (records: unknown[]) => {
  const { POST } = await import('@/app/api/grammar-mixed/route');
  return POST(new Request('http://x/api/grammar-mixed', { method: 'POST', body: JSON.stringify({ records }) }));
};
const get = async () => {
  const { GET } = await import('@/app/api/grammar-mixed/route');
  const res = await GET();
  return { status: res.status, body: await res.json() };
};

maybe('/api/grammar-mixed (real MongoDB)', () => {
  let client: MongoClient;
  beforeAll(async () => { client = await new MongoClient(uri!).connect(); db = client.db(`dutchtap_test_${Date.now()}`); });
  afterAll(async () => { await db?.dropDatabase(); await client?.close(); });
  beforeEach(() => { signedIn = { userId: new ObjectId().toHexString(), username: 'anna' }; });

  it('rejects signed-out requests', async () => {
    signedIn = null;
    expect((await post([])).status).toBe(401);
    expect((await get()).status).toBe(401);
  });

  it('stores answers and returns them for the same learner only', async () => {
    expect((await post([{ id: a, stat: stat(1) }])).status).toBe(200);
    expect((await get()).body.progress).toEqual({ [a]: stat(1) });
    signedIn = { userId: new ObjectId().toHexString(), username: 'ben' };
    expect((await get()).body.progress).toEqual({});
  });

  it('keeps the newer answer when an older device snapshot arrives later, and accepts a newer one', async () => {
    await post([{ id: a, stat: stat(5, { seen: 6, right: 5, streak: 5, lastWrong: false }) }]);
    await post([{ id: a, stat: stat(2) }]);
    expect((await get()).body.progress[a].seen).toBe(6);
    await post([{ id: a, stat: stat(9, { seen: 7 }) }]);
    expect((await get()).body.progress[a].seen).toBe(7);
  });

  it('is safe when the same record is sent twice at once', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => post([{ id: b, stat: stat(3) }])));
    expect(results.map(r => r.status)).toEqual(Array(8).fill(200));
    expect(await db.collection('grammarMixedProgress').countDocuments({ id: b })).toBe(1);
  });

  it('rejects unknown challenges, untimed or impossible records without storing anything', async () => {
    for (const record of [{ id: 'nope', stat: stat(1) }, { id: a, stat: { ...stat(1), at: undefined } }, { id: a, stat: stat(1, { right: 9 }) }]) {
      expect((await post([record])).status).toBe(400);
    }
    expect((await get()).body.progress).toEqual({});
  });

  it('ignores a stored document that is no longer valid', async () => {
    await db.collection('grammarMixedProgress').insertOne({ userId: new ObjectId(signedIn!.userId), id: a, seen: 'x' });
    await post([{ id: b, stat: stat(1) }]);
    expect(Object.keys((await get()).body.progress)).toEqual([b]);
  });
});
