import { applyLevelToReview, type ReviewRepo, type SessionRepo, type StoredSession } from './service';
import { MAX_ACTIVE_SESSIONS, type Session } from './types';
import type { Review } from '@/lib/flashcards/engine';
import type { Lang } from '@/lib/lang';

/** In-memory repositories with the same guarantees as the MongoDB ones (unique id and unique active slot per owner). Used by tests. */
export class MemorySessionRepo implements SessionRepo {
  private rows = new Map<string, StoredSession>();
  /** Test hook: runs before every compare-and-swap so a test can simulate another device writing first. */
  beforeReplace?: (owner: string, id: string) => void;
  private key = (owner: string, id: string) => `${owner}\u0000${id}`;
  async list(owner: string) { return [...this.rows.entries()].filter(([k]) => k.startsWith(`${owner}\u0000`)).map(([, v]) => structuredClone(v)); }
  async get(owner: string, id: string) { const row = this.rows.get(this.key(owner, id)); return row ? structuredClone(row) : null; }
  async insert(owner: string, session: Session) {
    const existing = this.rows.get(this.key(owner, session.id));
    if (existing) return { ok: false as const, reason: 'exists' as const, existing: structuredClone(existing) };
    let slot: number | null = null;
    if (session.status === 'active') {
      const taken = new Set([...this.rows.entries()].filter(([k, v]) => k.startsWith(`${owner}\u0000`) && v.slot !== null).map(([, v]) => v.slot));
      for (let candidate = 1; candidate <= MAX_ACTIVE_SESSIONS; candidate++) if (!taken.has(candidate)) { slot = candidate; break; }
      if (slot === null) return { ok: false as const, reason: 'limit' as const };
    }
    const stored = { session: structuredClone(session), slot };
    this.rows.set(this.key(owner, session.id), stored);
    return { ok: true as const, stored: structuredClone(stored) };
  }
  async replace(owner: string, id: string, expectedRev: number, next: Session) {
    this.beforeReplace?.(owner, id);
    const row = this.rows.get(this.key(owner, id));
    if (!row || row.session.rev !== expectedRev) return false;
    this.rows.set(this.key(owner, id), { session: structuredClone(next), slot: next.status === 'active' ? row.slot : null });
    return true;
  }
  async remove(owner: string, id: string) { return this.rows.delete(this.key(owner, id)); }
}

export class MemoryReviewRepo implements ReviewRepo {
  rows = new Map<string, Review>();
  async applyLevel(owner: string, lang: Lang, cardId: string, level: Review['level'], at: string) {
    const key = `${owner}\u0000${lang}\u0000${cardId}`;
    const next = applyLevelToReview(this.rows.get(key), cardId, level, at);
    this.rows.set(key, next);
    return structuredClone(next);
  }
  seed(owner: string, review: Review, lang: Lang = 'nl') { this.rows.set(`${owner}\u0000${lang}\u0000${review.id}`, review); }
  get(owner: string, lang: Lang, cardId: string) { return this.rows.get(`${owner}\u0000${lang}\u0000${cardId}`); }
}
