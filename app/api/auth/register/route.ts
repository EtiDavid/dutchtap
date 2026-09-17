import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { passwordSchema, usernameSchema } from "@/lib/validation/auth";
import { guestMergeSchema, toProgressRecord } from "@/lib/validation/progress";
import type { ProgressRecord } from "@/lib/mastery/types";
import { ensureIndexes, progressCollection, usersCollection } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/auth/recoveryCode";
import { setSessionCookie } from "@/lib/auth/session";
import { mergeGuestIntoAccount } from "@/lib/sync/mergeProgress";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";
import type { UserDocument } from "@/lib/db/types";

const bodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  guestProgress: guestMergeSchema.partial({ progressByKey: true }).optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { username, password, guestProgress } = parsed.data;
  const usernameLower = username.toLowerCase();

  const users = await usersCollection();
  await ensureIndexes();

  const existing = await users.findOne({ usernameLower });
  if (existing) return jsonError("That username is already taken", 409);

  const [passwordHash, recoveryCode] = await Promise.all([hashPassword(password), Promise.resolve(generateRecoveryCode())]);
  const recoveryCodeHash = await hashRecoveryCode(recoveryCode);

  const guestProgressByKey: Record<string, ProgressRecord> = {};
  for (const [key, record] of Object.entries(guestProgress?.progressByKey ?? {})) {
    guestProgressByKey[key] = toProgressRecord(record);
  }

  const merged = guestProgress
    ? mergeGuestIntoAccount(
        {
          schemaVersion: 1,
          progressByKey: guestProgressByKey,
          lifetimeScore: guestProgress.lifetimeScore,
          totalCorrect: guestProgress.totalCorrect,
          totalWrong: guestProgress.totalWrong,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { progressByKey: {}, lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 },
      )
    : { progressByKey: {}, lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 };

  const userId = new ObjectId();
  const now = new Date();
  const userDoc: UserDocument = {
    _id: userId,
    username,
    usernameLower,
    passwordHash,
    recoveryCodeHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    lifetimeScore: merged.lifetimeScore,
    totalCorrect: merged.totalCorrect,
    totalWrong: merged.totalWrong,
    settings: { haptics: true },
    failedLoginAttempts: 0,
    loginLockedUntil: null,
    failedRecoveryAttempts: 0,
    recoveryLockedUntil: null,
  };

  await users.insertOne(userDoc);

  const progressEntries = Object.values(merged.progressByKey);
  if (progressEntries.length > 0) {
    const progress = await progressCollection();
    await progress.bulkWrite(
      progressEntries.map((record) => ({
        updateOne: {
          filter: { userId, conceptKey: record.conceptKey },
          update: { $set: { ...record, userId, updatedAt: now } },
          upsert: true,
        },
      })),
    );
  }

  await setSessionCookie({ userId: userId.toHexString(), username });

  return NextResponse.json({ username, recoveryCode }, { status: 201 });
}
