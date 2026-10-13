import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { MongoReviewRepo, MongoSessionRepo } from './mongoRepo';
import { jsonError } from '@/lib/api/respond';
import { ID_PATTERN } from './ids';

/** The signed-in owner and repositories for a request, or the error response to return. */
export async function sessionContext() {
  const signedIn = await getSession();
  if (!signedIn) return { error: jsonError('Not signed in', 401) } as const;
  const db = await getDb();
  return { owner: signedIn.userId, repo: new MongoSessionRepo(db), reviews: new MongoReviewRepo(db) } as const;
}
export const validId = (id: string) => ID_PATTERN.test(id);

export async function readJson(request: Request): Promise<unknown | undefined> {
  try { return await request.json(); } catch { return undefined; }
}
