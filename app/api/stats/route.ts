import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { progressCollection, usersCollection } from "@/lib/db/collections";
import { computeDetailedStats } from "@/lib/stats/detailed";
import { NOUNS } from "@/data/nouns";
import { jsonError } from "@/lib/api/respond";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  const userId = new ObjectId(session.userId);
  const [progress, users] = await Promise.all([progressCollection(), usersCollection()]);
  const [docs, user] = await Promise.all([progress.find({ userId }).toArray(), users.findOne({ _id: userId })]);
  if (!user) return jsonError("Not signed in", 401);

  const records = docs.map(({ _id, userId: _userId, updatedAt: _updatedAt, ...record }) => record);
  const stats = computeDetailedStats(records, nounIndex, user.lifetimeScore, user.totalCorrect, user.totalWrong);

  return NextResponse.json(stats);
}
