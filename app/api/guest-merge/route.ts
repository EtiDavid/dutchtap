import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { ensureIndexes, progressCollection, usersCollection } from "@/lib/db/collections";
import { guestMergeSchema, toProgressRecord } from "@/lib/validation/progress";
import { mergeGuestIntoAccount } from "@/lib/sync/mergeProgress";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";
import type { ProgressRecord } from "@/lib/mastery/types";

/**
 * Merges a signed-in guest's local device progress into their account.
 * Offered when a guest logs into (or just created) an account that
 * already has server-side history, so neither side's progress is
 * silently discarded (spec section 9).
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

  const parsed = guestMergeSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const guest = parsed.data;

  const userId = new ObjectId(session.userId);
  const now = new Date();
  const [progress, users] = await Promise.all([progressCollection(), usersCollection()]);
  await ensureIndexes();

  const [existingDocs, user] = await Promise.all([
    progress.find({ userId }).toArray(),
    users.findOne({ _id: userId }),
  ]);
  if (!user) return jsonError("Not signed in", 401);

  const accountProgressByKey: Record<string, ProgressRecord> = {};
  for (const doc of existingDocs) {
    const { _id, userId: _userId, updatedAt, ...record } = doc;
    accountProgressByKey[record.conceptKey] = record;
  }

  const guestProgressByKey: Record<string, ProgressRecord> = {};
  for (const [key, record] of Object.entries(guest.progressByKey)) {
    guestProgressByKey[key] = toProgressRecord(record);
  }

  const merged = mergeGuestIntoAccount(
    {
      schemaVersion: 1,
      progressByKey: guestProgressByKey,
      lifetimeScore: guest.lifetimeScore,
      totalCorrect: guest.totalCorrect,
      totalWrong: guest.totalWrong,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      progressByKey: accountProgressByKey,
      lifetimeScore: user.lifetimeScore,
      totalCorrect: user.totalCorrect,
      totalWrong: user.totalWrong,
    },
  );

  const entries = Object.values(merged.progressByKey);
  if (entries.length > 0) {
    await progress.bulkWrite(
      entries.map((record) => ({
        updateOne: {
          filter: { userId, conceptKey: record.conceptKey },
          update: { $set: { ...record, userId, updatedAt: now } },
          upsert: true,
        },
      })),
    );
  }

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        lifetimeScore: merged.lifetimeScore,
        totalCorrect: merged.totalCorrect,
        totalWrong: merged.totalWrong,
        updatedAt: now,
      },
    },
  );

  return NextResponse.json({
    progressByKey: merged.progressByKey,
    lifetimeScore: merged.lifetimeScore,
    totalCorrect: merged.totalCorrect,
    totalWrong: merged.totalWrong,
  });
}
