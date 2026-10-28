import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { jsonError, zodErrorResponse } from '@/lib/api/respond';
import { cleanMixed, mixedSyncSchema } from '@/lib/grammarMixed';

const NAME = 'grammarMixedProgress';
const indexed = new WeakSet<object>();
async function collection() {
  const db = await getDb();
  const c = db.collection(NAME);
  if (!indexed.has(db)) { await c.createIndex({ userId: 1, id: 1 }, { unique: true }); indexed.add(db); }
  return c;
}

/** Mixed-grammar answers for the signed-in learner. Separate from card levels: answering here never rates a card. */
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError('Not signed in', 401);
  const docs = await (await collection()).find({ userId: new ObjectId(session.userId) }).toArray();
  const raw: Record<string, unknown> = {};
  for (const { _id, userId, id, ...stat } of docs) { void _id; void userId; raw[String(id)] = stat; }
  return Response.json({ progress: cleanMixed(raw) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError('Not signed in', 401);
  let raw: unknown;
  try { raw = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const parsed = mixedSyncSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const c = await collection();
  const userId = new ObjectId(session.userId);
  for (const { id, stat } of parsed.data.records) {
    // Ensure the row exists, then atomically reject an older device snapshot.
    await c.updateOne({ userId, id }, { $setOnInsert: { ...stat, userId, id } }, { upsert: true });
    await c.updateOne({ userId, id, at: { $lte: stat.at } }, { $set: stat });
  }
  return Response.json({ ok: true });
}
