import { ObjectId } from "mongodb";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

export function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
