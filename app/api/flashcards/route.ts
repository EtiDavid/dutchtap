import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { reviewSchema, syncSchema } from '@/lib/flashcards/validation';
import { jsonError, zodErrorResponse } from '@/lib/api/respond';
import type { Review } from '@/lib/flashcards/engine';
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError('Not signed in',401);
  const db = await getDb();
  const docs = await db.collection<Review & {userId: ObjectId}>('flashcardReviews').find({userId:new ObjectId(session.userId)}).toArray();
  // Records saved by the earlier rating-based flashcards no longer match the schema and are skipped.
  const reviews: Record<string,Review> = {};
  for (const {_id,userId,...rest} of docs) { void _id; void userId; const parsed = reviewSchema.safeParse(rest); if (parsed.success) reviews[parsed.data.id] = parsed.data; }
  return Response.json({reviews});
}
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError('Not signed in',401);
  let raw: unknown;
  try { raw = await request.json(); } catch { return jsonError('Invalid JSON',400); }
  const parsed = syncSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const collection = (await getDb()).collection<Review & {userId:ObjectId}>('flashcardReviews');
  await collection.createIndex({userId:1,id:1},{unique:true});
  const userId = new ObjectId(session.userId);
  for (const record of parsed.data.records) {
    // Ensure the row exists, then atomically reject older device snapshots.
    await collection.updateOne({userId,id:record.id},{$setOnInsert:{...record,userId}},{upsert:true});
    // $unset clears fields left over from the earlier schedule-based records.
    await collection.updateOne({userId,id:record.id,updatedAt:{$lte:record.updatedAt}},{$set:record,$unset:{stage:'',dueAt:'',recalls:'',attempts:'',lastRewardDate:'',points:''}});
  }
  return Response.json({ok:true});
}
