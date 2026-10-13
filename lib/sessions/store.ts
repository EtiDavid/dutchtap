import { z } from 'zod';
import type { Level, Review, Reviews } from '@/lib/flashcards/engine';
import { reviewSchema } from '@/lib/flashcards/validation';
import { applyAction, applyActions, practiseAgain } from './engine';
import { newId } from './ids';
import {
  MAX_ACTIONS_PER_REQUEST, MAX_ACTIVE_SESSIONS, actionSchema, sessionSchema,
  type Action, type ActionInput, type LevelEffect, type Mode, type Rejection, type Session,
} from './types';

/**
 * Local-first session store. Every learner action is applied to the saved session immediately and written to
 * this device; for signed-in learners the same actions are queued and sent to the account idempotently, so a
 * dropped connection, a refresh or a retry can never lose or double-count progress.
 */
export type Scope = { kind: 'guest' } | { kind: 'user'; username: string };
export const scopeKey = (scope: Scope) => (scope.kind === 'guest' ? 'guest' : `user:${scope.username.toLowerCase()}`);
export const storageKeyFor = (scope: Scope) => `dutchtap:sessions:v1:${scopeKey(scope)}`;
export const SUMMARY_KEY = 'dutchtap:sessions:summary:v1';
/** Fired on this page whenever the saved sessions change, so the navigation bar can refresh its "session waiting" dot. */
export const SESSIONS_CHANGED = 'dutchtap:sessions-changed';

export type SyncStatus = 'local' | 'saved' | 'pending' | 'syncing' | 'failed';
export type Notice = { id: string; text: string };
export type Snapshot = {
  ready: boolean; sessions: Session[]; status: SyncStatus; pending: number; error: string | null;
  notices: Notice[]; refused: Record<string, string>; lastOpened: { id: string; mode: Mode } | null; storageOk: boolean; online: boolean;
};

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
type Timers = { set: (fn: () => void, ms: number) => unknown; clear: (handle: unknown) => void };

const stateSchema = z.object({
  v: z.literal(1),
  sessions: z.record(z.string(), z.unknown()),
  pendingCreate: z.array(z.string()).default([]),
  initial: z.record(z.string(), z.unknown()).default({}),
  pendingActions: z.record(z.string(), z.array(z.unknown())).default({}),
  pendingDelete: z.array(z.string()).default([]),
  refused: z.record(z.string(), z.string()).default({}),
  lastOpened: z.object({ id: z.string(), mode: z.enum(['study', 'speaking', 'quiz']) }).nullable().default(null),
});
type Persisted = { v: 1; sessions: Record<string, Session>; pendingCreate: string[]; initial: Record<string, Session>; pendingActions: Record<string, Action[]>; pendingDelete: string[]; refused: Record<string, string>; lastOpened: Snapshot['lastOpened'] };
const empty = (): Persisted => ({ v: 1, sessions: {}, pendingCreate: [], initial: {}, pendingActions: {}, pendingDelete: [], refused: {}, lastOpened: null });

/** Reads saved state defensively: anything invalid is dropped rather than crashing, and reported. */
export function parsePersisted(raw: string | null): { state: Persisted; dropped: number } {
  if (!raw) return { state: empty(), dropped: 0 };
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return { state: empty(), dropped: 1 }; }
  const top = stateSchema.safeParse(json);
  if (!top.success) return { state: empty(), dropped: 1 };
  const state = empty(); let dropped = 0;
  for (const [id, value] of Object.entries(top.data.sessions)) {
    const parsed = sessionSchema.safeParse(value);
    if (parsed.success && parsed.data.id === id) state.sessions[id] = parsed.data; else dropped++;
  }
  state.pendingCreate = top.data.pendingCreate.filter(id => state.sessions[id]);
  for (const [id, value] of Object.entries(top.data.initial)) {
    const parsed = sessionSchema.safeParse(value);
    if (parsed.success && state.sessions[id]) state.initial[id] = parsed.data;
  }
  state.pendingDelete = top.data.pendingDelete;
  for (const [id, list] of Object.entries(top.data.pendingActions)) {
    const actions = list.map(a => actionSchema.safeParse(a)).filter(r => r.success).map(r => r.data!);
    if (actions.length && state.sessions[id]) state.pendingActions[id] = actions; else if (list.length) dropped += list.length - actions.length;
  }
  state.refused = Object.fromEntries(Object.entries(top.data.refused).filter(([id]) => state.sessions[id]));
  state.lastOpened = top.data.lastOpened && state.sessions[top.data.lastOpened.id] ? top.data.lastOpened : null;
  return { state, dropped };
}

export class SessionStore {
  readonly scope: Scope;
  private storage: StorageLike | null;
  private fetchImpl: Fetch | null;
  private now: () => Date;
  private timers: Timers;
  private state: Persisted = empty();
  private listeners = new Set<() => void>();
  private snapshot: Snapshot;
  private syncing: Promise<void> | null = null;
  private syncAgain = false;
  private retryHandle: unknown = null;
  private retryDelay = 4000;
  private debounceHandle: unknown = null;
  private noticeCounter = 0;
  private notices: Notice[] = [];
  private error: string | null = null;
  private storageOk = true;
  private online = true;
  private loaded = false;
  private levelListener: ((effects: LevelEffect[]) => void) | null = null;
  private reviewsListener: ((reviews: Record<string, Review>) => void) | null = null;

  constructor(options: { scope: Scope; storage?: StorageLike | null; fetch?: Fetch | null; now?: () => Date; timers?: Timers }) {
    this.scope = options.scope;
    this.storage = options.storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : options.storage;
    this.fetchImpl = options.fetch === undefined ? (typeof fetch !== 'undefined' ? ((input, init) => fetch(input, init)) : null) : options.fetch;
    this.now = options.now ?? (() => new Date());
    this.timers = options.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>) };
    this.snapshot = this.buildSnapshot();
  }

  // ---- reading ---------------------------------------------------------------------------------------------
  getSnapshot = (): Snapshot => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  get(id: string): Session | undefined { return this.state.sessions[id]; }
  private get isAccount() { return this.scope.kind === 'user'; }
  activeCount() { return Object.values(this.state.sessions).filter(s => s.status === 'active').length; }
  onLevelEffects(listener: ((effects: LevelEffect[]) => void) | null) { this.levelListener = listener; }
  onServerReviews(listener: ((reviews: Record<string, Review>) => void) | null) { this.reviewsListener = listener; }
  setOnline(online: boolean) { this.online = online; if (online) { this.retryDelay = 4000; void this.sync(); } this.publish(); }

  private pendingCount() {
    return this.state.pendingCreate.length + this.state.pendingDelete.length + Object.values(this.state.pendingActions).reduce((n, list) => n + list.length, 0);
  }
  private status(): SyncStatus {
    if (!this.isAccount) return 'local';
    if (this.syncing) return 'syncing';
    if (this.error) return 'failed';
    return this.pendingCount() > 0 ? 'pending' : 'saved';
  }
  private buildSnapshot(): Snapshot {
    const sessions = Object.values(this.state.sessions).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      ready: this.loaded, sessions, status: this.status(), pending: this.pendingCount(), error: this.error, notices: [...this.notices],
      refused: { ...this.state.refused }, lastOpened: this.state.lastOpened, storageOk: this.storageOk, online: this.online,
    };
  }
  private publish() { this.snapshot = this.buildSnapshot(); for (const listener of [...this.listeners]) listener(); }
  private notify(text: string) { this.notices = [...this.notices, { id: `n${++this.noticeCounter}`, text }].slice(-5); }
  dismissNotice(id: string) { this.notices = this.notices.filter(n => n.id !== id); this.publish(); }

  // ---- loading and saving ----------------------------------------------------------------------------------
  /** Loads the device copy immediately, then (for accounts) brings it in line with the server. */
  async start(): Promise<void> {
    const raw = (() => { try { return this.storage?.getItem(storageKeyFor(this.scope)) ?? null; } catch { this.storageOk = false; return null; } })();
    const { state, dropped } = parsePersisted(raw);
    this.state = state; this.loaded = true;
    if (dropped) this.notify('Some saved session data could not be read and was skipped. Your card levels are unaffected.');
    this.publish();
    if (this.isAccount) await this.sync();
  }
  private persist() {
    try {
      this.storage?.setItem(storageKeyFor(this.scope), JSON.stringify(this.state));
      const active = Object.values(this.state.sessions).filter(s => s.status === 'active').length;
      this.storage?.setItem(SUMMARY_KEY, JSON.stringify({ scope: scopeKey(this.scope), active, last: this.state.lastOpened }));
      this.storageOk = true;
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSIONS_CHANGED));
    } catch { this.storageOk = false; }
  }
  private commit() { this.persist(); this.publish(); }

  // ---- local changes ---------------------------------------------------------------------------------------
  /** Adds a new session. Refuses (without discarding anything) when five active sessions already exist. */
  create(session: Session): { ok: true; session: Session } | { ok: false; code: 'limit' | 'exists'; message: string } {
    if (this.state.sessions[session.id]) return { ok: false, code: 'exists', message: 'This session already exists.' };
    if (session.status === 'active' && this.activeCount() >= MAX_ACTIVE_SESSIONS) {
      return { ok: false, code: 'limit', message: `You already have ${MAX_ACTIVE_SESSIONS} active sessions. Finish or delete one first.` };
    }
    this.state.sessions[session.id] = session;
    if (this.isAccount) { this.state.pendingCreate.push(session.id); this.state.initial[session.id] = structuredClone(session); }
    this.state.pendingDelete = this.state.pendingDelete.filter(id => id !== session.id);
    this.commit(); this.scheduleSync();
    return { ok: true, session };
  }

  /** Applies one learner action immediately. Rejected actions (stale, duplicate, not allowed) change nothing and are not queued. */
  dispatch(sessionId: string, input: ActionInput): { applied: boolean; reason?: Rejection; session?: Session; effects: LevelEffect[] } {
    const session = this.state.sessions[sessionId];
    if (!session) return { applied: false, reason: 'invalid', effects: [] };
    const action = actionSchema.parse({ id: newId(), at: this.now().toISOString(), ...input }) as Action;
    const result = applyAction(session, action, this.now());
    if (!result.applied) return { applied: false, reason: result.reason, session, effects: [] };
    this.state.sessions[sessionId] = result.session;
    if (this.isAccount) {
      const queue = (this.state.pendingActions[sessionId] ??= []);
      const last = queue[queue.length - 1];
      if (action.type === 'quiz/draft' && last?.type === 'quiz/draft' && last.attemptId === action.attemptId) queue[queue.length - 1] = action; // only the latest draft matters
      else queue.push(action);
    }
    this.commit(); this.scheduleSync();
    if (result.effects.length) this.levelListener?.(result.effects);
    return { applied: true, session: result.session, effects: result.effects };
  }

  remove(sessionId: string) {
    if (!this.state.sessions[sessionId]) return;
    delete this.state.sessions[sessionId];
    delete this.state.pendingActions[sessionId];
    delete this.state.refused[sessionId]; delete this.state.initial[sessionId];
    const unsentCreate = this.state.pendingCreate.includes(sessionId);
    this.state.pendingCreate = this.state.pendingCreate.filter(id => id !== sessionId);
    if (this.isAccount && !unsentCreate && !this.state.pendingDelete.includes(sessionId)) this.state.pendingDelete.push(sessionId);
    if (this.state.lastOpened?.id === sessionId) this.state.lastOpened = null;
    this.commit(); this.scheduleSync();
  }

  rename(sessionId: string, name: string) { return this.dispatch(sessionId, { type: 'rename', name }); }
  setLastOpened(id: string, mode: Mode) {
    const last = this.state.lastOpened;
    if (last?.id === id && last.mode === mode) return;
    this.state.lastOpened = { id, mode }; this.persist(); this.publish();
  }
  /** Starts a new session over the same cards with fresh counters, subject to the five-active limit. */
  practiseAgain(sessionId: string) {
    const source = this.state.sessions[sessionId];
    if (!source) return { ok: false as const, code: 'missing' as const, message: 'That session no longer exists.' };
    return this.create(practiseAgain(source, { now: this.now() }));
  }

  /** Copies guest sessions into this account, oldest first. Surplus sessions stay on the device; nothing is discarded. */
  importFrom(guest: SessionStore): { imported: number; duplicates: number; skipped: number } {
    let imported = 0, duplicates = 0, skipped = 0;
    const candidates = guest.getSnapshot().sessions.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const session of candidates) {
      if (this.state.sessions[session.id]) { duplicates++; guest.remove(session.id); continue; }
      const result = this.create(session);
      if (result.ok) { imported++; guest.remove(session.id); } else skipped++;
    }
    return { imported, duplicates, skipped };
  }

  // ---- syncing with the account ------------------------------------------------------------------------------
  private scheduleSync(delay = 350) {
    if (!this.isAccount || !this.fetchImpl) return;
    if (this.debounceHandle) this.timers.clear(this.debounceHandle);
    this.debounceHandle = this.timers.set(() => { this.debounceHandle = null; void this.sync(); }, delay);
  }
  private scheduleRetry() {
    if (this.retryHandle) this.timers.clear(this.retryHandle);
    this.retryHandle = this.timers.set(() => { this.retryHandle = null; void this.sync(); }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 60_000);
  }

  /** Sends queued work and refreshes from the server. Safe to call at any time; concurrent calls share one run. */
  sync(): Promise<void> {
    if (!this.isAccount || !this.fetchImpl) return Promise.resolve();
    if (this.syncing) { this.syncAgain = true; return this.syncing; }
    const run = (async () => {
      await Promise.resolve(); // let `syncing` be assigned before the first status is published
      this.publish();
      try {
        do { this.syncAgain = false; await this.syncOnce(); } while (this.syncAgain);
        this.error = null; this.retryDelay = 4000;
        if (this.retryHandle) { this.timers.clear(this.retryHandle); this.retryHandle = null; }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Could not sync';
        this.scheduleRetry();
      } finally {
        this.syncing = null; this.commit();
      }
    })();
    this.syncing = run;
    return run;
  }

  private async call(path: string, init?: RequestInit): Promise<Response> {
    const response = await this.fetchImpl!(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
    if (response.status === 401) throw new Error('You are signed out. Sign in again to sync.');
    return response;
  }

  private async syncOnce() {
    const s = this.state;
    // 1. deletions made on this device
    for (const id of [...s.pendingDelete]) {
      const response = await this.call(`/api/learning-sessions/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 404) s.pendingDelete = s.pendingDelete.filter(x => x !== id);
      else throw new Error('Could not delete the session on your account yet.');
    }
    // 2. sessions created (or imported) on this device
    for (const id of [...s.pendingCreate]) {
      const session = s.initial[id] ?? s.sessions[id];
      if (!session || !s.sessions[id]) { s.pendingCreate = s.pendingCreate.filter(x => x !== id); delete s.initial[id]; continue; }
      // The as-created snapshot is sent first; this device's actions are replayed on top afterwards, so each takes effect once.
      const response = await this.call('/api/learning-sessions', { method: 'POST', body: JSON.stringify({ session }) });
      if (response.ok) { s.pendingCreate = s.pendingCreate.filter(x => x !== id); delete s.initial[id]; continue; }
      if (response.status === 409) {
        s.pendingCreate = s.pendingCreate.filter(x => x !== id); // the as-created snapshot is kept for "Retry"
        s.refused[id] = `Not synced: your account already has ${MAX_ACTIVE_SESSIONS} active sessions. This one is saved on this device only. Finish or delete another session, then use "Retry".`;
        this.notify(`"${session.name}" could not be added to your account because you already have ${MAX_ACTIVE_SESSIONS} active sessions. It is kept on this device.`);
        continue;
      }
      if (response.status === 400) { s.pendingCreate = s.pendingCreate.filter(x => x !== id); delete s.initial[id]; s.refused[id] = 'Not synced: the server could not accept this session.'; continue; }
      throw new Error('Could not save the new session to your account yet.');
    }
    // 3. actions
    for (const id of Object.keys(s.pendingActions)) {
      while (s.pendingActions[id]?.length && s.sessions[id] && !s.refused[id] && !s.pendingCreate.includes(id)) {
        const batch = s.pendingActions[id].slice(0, MAX_ACTIONS_PER_REQUEST);
        const response = await this.call(`/api/learning-sessions/${id}/actions`, { method: 'POST', body: JSON.stringify({ actions: batch }) });
        if (response.status === 404) { this.dropSession(id, 'A session was deleted on another device, so it was removed here too.'); break; }
        if (response.status === 400) { s.pendingActions[id] = s.pendingActions[id].slice(batch.length); this.notify('Some progress could not be saved to your account and was skipped.'); continue; }
        if (!response.ok) throw new Error('Could not save your progress to your account yet.');
        const body = await response.json() as { session: unknown; reviews?: Record<string, unknown> };
        const sent = new Set(batch.map(a => a.id));
        s.pendingActions[id] = s.pendingActions[id].filter(a => !sent.has(a.id));
        const server = sessionSchema.safeParse(body.session);
        if (server.success) s.sessions[id] = this.withPending(server.data, s.pendingActions[id]);
        const reviews: Record<string, Review> = {};
        for (const [cardId, value] of Object.entries(body.reviews ?? {})) { const parsed = reviewSchema.safeParse(value); if (parsed.success) reviews[cardId] = parsed.data; }
        if (Object.keys(reviews).length) this.reviewsListener?.(reviews);
      }
      if (s.pendingActions[id] && !s.pendingActions[id].length) delete s.pendingActions[id];
    }
    // 4. bring the device copy in line with the account
    const list = await this.call('/api/learning-sessions');
    if (!list.ok) throw new Error('Could not load your sessions from your account.');
    const remote = ((await list.json()) as { sessions: unknown[] }).sessions.map(item => sessionSchema.safeParse(item)).filter(r => r.success).map(r => r.data!);
    const remoteIds = new Set(remote.map(r => r.id));
    for (const server of remote) {
      if (s.pendingDelete.includes(server.id)) continue;
      s.sessions[server.id] = this.withPending(server, s.pendingActions[server.id] ?? []);
      delete s.refused[server.id];
    }
    for (const id of Object.keys(s.sessions)) {
      if (remoteIds.has(id) || s.pendingCreate.includes(id) || s.refused[id]) continue;
      this.dropSession(id, `"${s.sessions[id].name}" was deleted on another device, so it was removed here too.`);
    }
  }

  /** Server state as the base, with this device's unsent actions applied on top (already-applied ones are skipped). */
  private withPending(base: Session, pending: Action[]): Session {
    return pending.length ? applyActions(base, pending, this.now()).session : base;
  }
  private dropSession(id: string, notice: string) {
    const name = this.state.sessions[id]?.name;
    delete this.state.sessions[id]; delete this.state.pendingActions[id]; delete this.state.refused[id]; delete this.state.initial[id];
    this.state.pendingCreate = this.state.pendingCreate.filter(x => x !== id);
    if (this.state.lastOpened?.id === id) this.state.lastOpened = null;
    if (name) this.notify(notice);
  }

  /** Re-attempts a session that the server refused earlier (for example after another session was finished). */
  retryRefused(id: string) {
    const session = this.state.sessions[id];
    if (!session || !this.state.refused[id]) return;
    delete this.state.refused[id];
    this.state.pendingCreate.push(id);
    this.commit(); void this.sync();
  }
}

export type { Level, Reviews };
