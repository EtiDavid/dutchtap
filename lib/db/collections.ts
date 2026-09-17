import type { Collection } from "mongodb";
import { getDb } from "./mongodb";
import type { ProgressDocument, SessionDocument, UserDocument } from "./types";

export async function usersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

export async function progressCollection(): Promise<Collection<ProgressDocument>> {
  const db = await getDb();
  return db.collection<ProgressDocument>("progress");
}

export async function sessionsCollection(): Promise<Collection<SessionDocument>> {
  const db = await getDb();
  return db.collection<SessionDocument>("sessions");
}

/** Idempotent index setup. Safe to call on every cold start. */
export async function ensureIndexes(): Promise<void> {
  const [users, progress] = await Promise.all([usersCollection(), progressCollection()]);
  await Promise.all([
    users.createIndex({ usernameLower: 1 }, { unique: true }),
    progress.createIndex({ userId: 1, conceptKey: 1 }, { unique: true }),
  ]);
}
