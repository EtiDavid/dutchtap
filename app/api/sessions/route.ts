import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { sessionsCollection } from "@/lib/db/collections";
import { sessionSummarySchema } from "@/lib/validation/progress";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Not signed in", 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = sessionSummarySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const summary = parsed.data;

  const sessions = await sessionsCollection();
  await sessions.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(session.userId),
    mode: summary.mode,
    startedAt: new Date(summary.startedAt),
    endedAt: new Date(summary.endedAt),
    questions: summary.questions,
    correct: summary.correct,
    wrong: summary.wrong,
    scoreEarned: summary.scoreEarned,
    accuracy: summary.accuracy,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
