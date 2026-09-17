import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { ensureIndexes, progressCollection, usersCollection } from "@/lib/db/collections";
import { progressSyncSchema, toProgressRecord } from "@/lib/validation/progress";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";
import type { ProgressRecord } from "@/lib/mastery/types";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  const userId = new ObjectId(session.userId);
  const [progress, users] = await Promise.all([progressCollection(), usersCollection()]);
  const [records, user] = await Promise.all([
    progress.find({ userId }).toArray(),
    users.findOne({ _id: userId }),
  ]);

  if (!user) return jsonError("Not signed in", 401);

  const progressByKey: Record<string, ProgressRecord> = {};
  for (const doc of records) {
    const { _id, userId: _userId, updatedAt: _updatedAt, ...record } = doc;
    progressByKey[record.conceptKey] = record;
  }

  return NextResponse.json({
    progressByKey,
    lifetimeScore: user.lifetimeScore,
    totalCorrect: user.totalCorrect,
    totalWrong: user.totalWrong,
  });
}

/**
 * Accepts a batch of updated progress records from the client (which
 * computes mastery/repetition state locally using the same deterministic
 * engine as the server). We validate shape and internal consistency here
 * rather than replaying every answer server-side — a documented v1
 * tradeoff; see docs/ARCHITECTURE.md.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = progressSyncSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { records, lifetimeScore, totalCorrect, totalWrong } = parsed.data;

  const userId = new ObjectId(session.userId);
  const now = new Date();
  const [progress, users] = await Promise.all([progressCollection(), usersCollection()]);
  await ensureIndexes();

  if (records.length > 0) {
    await progress.bulkWrite(
      records.map((raw) => {
        const record = toProgressRecord(raw);
        return {
          updateOne: {
            filter: { userId, conceptKey: record.conceptKey },
            update: { $set: { ...record, userId, updatedAt: now } },
            upsert: true,
          },
        };
      }),
    );
  }

  await users.updateOne(
    { _id: userId },
    { $set: { lifetimeScore, totalCorrect, totalWrong, updatedAt: now } },
  );

  return NextResponse.json({ ok: true });
}
