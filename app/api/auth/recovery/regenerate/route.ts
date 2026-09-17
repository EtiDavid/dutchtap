import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { usersCollection } from "@/lib/db/collections";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/auth/recoveryCode";
import { jsonError } from "@/lib/api/respond";

export async function POST() {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  const recoveryCode = generateRecoveryCode();
  const recoveryCodeHash = await hashRecoveryCode(recoveryCode);

  const users = await usersCollection();
  const result = await users.updateOne(
    { _id: new ObjectId(session.userId) },
    { $set: { recoveryCodeHash, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) return jsonError("Not signed in", 401);

  return NextResponse.json({ recoveryCode });
}
