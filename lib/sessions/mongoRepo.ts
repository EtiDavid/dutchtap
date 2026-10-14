import { MongoServerError, ObjectId, type Collection, type Db } from 'mongodb';
import { reviewSchema } from '@/lib/flashcards/validation';
import type { Lang } from '@/lib/lang';
import { newReview, type Review } from '@/lib/flashcards/engine';
import { applyLevelToReview, type ReviewRepo, type SessionRepo, type StoredSession } from './service';
import { MAX_ACTIVE_SESSIONS, type Session } from './types';

type SessionDoc = { userId: ObjectId; id: string; slot?: number; rev: number; session: Session };
type ReviewDoc = Review & { userId: ObjectId };

const indexed = new WeakSet<Db>();
async function sessionsCollection(db: Db): Promise<Collection<SessionDoc>> {
  const collection = db.collection<SessionDoc>('learningSessions');
  if (!indexed.has(db)) {
    await collection.createIndex({ userId: 1, id: 1 }, { unique: true, name: 'owner_session_id' });
    // At most MAX_ACTIVE_SESSIONS active sessions per owner: an active session holds a slot 1..5, archived ones hold none.
    await collection.createIndex({ userId: 1, slot: 1 }, { unique: true, name: 'owner_active_slot', partialFilterExpression: { slot: { $type: 'number' } } });
    indexed.add(db);
  }
  return collection;
}
// Sessions saved before French existed carry no language: they are Dutch.
const toStored = (doc: SessionDoc): StoredSession => ({ session: { ...doc.session, lang: doc.session.lang ?? 'nl', rev: doc.rev }, slot: doc.slot ?? null });

/** MongoDB-backed sessions. The owner is always the authenticated user's ObjectId; it is never taken from the client. */
export class MongoSessionRepo implements SessionRepo {
  constructor(private db: Db) {}
  private owner = (owner: string) => new ObjectId(owner);
  async list(owner: string) { return (await (await sessionsCollection(this.db)).find({ userId: this.owner(owner) }).toArray()).map(toStored); }
  async get(owner: string, id: string) { const doc = await (await sessionsCollection(this.db)).findOne({ userId: this.owner(owner), id }); return doc ? toStored(doc) : null; }
  async insert(owner: string, session: Session) {
    const collection = await sessionsCollection(this.db);
    const userId = this.owner(owner);
    const existing = await collection.findOne({ userId, id: session.id });
    if (existing) return { ok: false as const, reason: 'exists' as const, existing: toStored(existing) };
    const base = { userId, id: session.id, rev: 0, session: { ...session, rev: 0 } };
    if (session.status !== 'active') { await collection.insertOne(base); return { ok: true as const, stored: { session: base.session, slot: null } }; }
    for (let slot = 1; slot <= MAX_ACTIVE_SESSIONS; slot++) {
      try {
        await collection.insertOne({ ...base, slot });
        return { ok: true as const, stored: { session: base.session, slot } };
      } catch (error) {
        if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
        const pattern = (error as MongoServerError & { keyPattern?: Record<string, number> }).keyPattern ?? {};
        if (!('slot' in pattern)) { // the same session id was inserted concurrently
          const winner = await collection.findOne({ userId, id: session.id });
          if (winner) return { ok: false as const, reason: 'exists' as const, existing: toStored(winner) };
          throw error;
        }
      }
    }
    return { ok: false as const, reason: 'limit' as const };
  }
  async replace(owner: string, id: string, expectedRev: number, next: Session) {
    const collection = await sessionsCollection(this.db);
    const update = next.status === 'active'
      ? { $set: { session: next, rev: expectedRev + 1 } }
      : { $set: { session: next, rev: expectedRev + 1 }, $unset: { slot: '' as const } }; // finished sessions free their slot
    const result = await collection.updateOne({ userId: this.owner(owner), id, rev: expectedRev }, update);
    return result.matchedCount === 1;
  }
  async remove(owner: string, id: string) { return (await (await sessionsCollection(this.db)).deleteOne({ userId: this.owner(owner), id })).deletedCount === 1; }
}

/**
 * Each learning language keeps its own card levels in its own collection: Dutch stays in the original `flashcardReviews`
 * (unchanged, no migration, no index change), other languages use `flashcardReviews_<lang>`. A card id therefore never
 * shares a record, or a unique index, across languages.
 */
export const reviewsCollectionName = (lang: Lang) => (lang === 'nl' ? 'flashcardReviews' : `flashcardReviews_${lang}`);
const reviewsIndexed = new WeakMap<Db, Set<string>>();
export async function reviewsCollection(db: Db, lang: Lang): Promise<Collection<ReviewDoc>> {
  const name = reviewsCollectionName(lang);
  const collection = db.collection<ReviewDoc>(name);
  let done = reviewsIndexed.get(db);
  if (!done) { done = new Set(); reviewsIndexed.set(db, done); }
  if (!done.has(name)) { await collection.createIndex({ userId: 1, id: 1 }, { unique: true }); done.add(name); }
  return collection;
}
export class MongoReviewRepo implements ReviewRepo {
  constructor(private db: Db) {}
  async applyLevel(owner: string, lang: Lang, cardId: string, level: Review['level'], at: string) {
    const collection = await reviewsCollection(this.db, lang);
    const userId = new ObjectId(owner);
    for (let attempt = 0; attempt < 6; attempt++) {
      const doc = await collection.findOne({ userId, id: cardId });
      const parsed = doc ? reviewSchema.safeParse((({ _id, userId: _u, ...rest }) => { void _id; void _u; return rest; })(doc)) : null;
      const existing = parsed?.success ? parsed.data : undefined; // records from the older rating system are replaced
      const next = applyLevelToReview(existing, cardId, level, at);
      if (!doc) {
        try { await collection.insertOne({ ...next, userId }); return next; } catch (error) { if (error instanceof MongoServerError && error.code === 11000) continue; throw error; }
      }
      const result = await collection.replaceOne({ _id: doc._id, updatedAt: doc.updatedAt }, { ...next, userId });
      if (result.matchedCount === 1) return next;
    }
    return newReview(cardId, new Date(at)); // extremely unlikely contention: the client keeps its own record
  }
}
