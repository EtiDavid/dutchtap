import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { usersCollection } from "@/lib/db/collections";
import { jsonError } from "@/lib/api/respond";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  const users = await usersCollection();
  const user = await users.findOne({ _id: new ObjectId(session.userId) });
  if (!user) return jsonError("Not signed in", 401);

  return NextResponse.json({
    username: user.username,
    lifetimeScore: user.lifetimeScore,
    totalCorrect: user.totalCorrect,
    totalWrong: user.totalWrong,
  });
}
