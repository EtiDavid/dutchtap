import { MemoryReviewRepo, MemorySessionRepo } from '@/lib/sessions/memoryRepo';
import { applySessionActions, createSession, deleteSession, getSession, listSessions } from '@/lib/sessions/service';
import { MemoryStorage } from './memoryStorage';

/**
 * Runs the REAL server logic (service + in-memory repositories) behind a fetch-compatible function, so client tests
 * can exercise offline use, lost responses, sign-out and several devices without a network or a database.
 */
export class FakeServer {
  repo = new MemorySessionRepo();
  reviews = new MemoryReviewRepo();
  /** When false every request fails like a lost connection. */
  online = true;
  signedIn = true;
  /** Number of upcoming requests that are applied by the server but whose response never reaches the device. */
  dropResponses = 0;
  calls: string[] = [];
  constructor(public owner = '65f0000000000000000000a1') {}

  fetch = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    this.calls.push(`${method} ${input}`);
    if (!this.online) throw new TypeError('Failed to fetch');
    const reply = await this.handle(method, input, init?.body ? JSON.parse(String(init.body)) : undefined);
    if (this.dropResponses > 0 && reply.status < 300) { this.dropResponses--; throw new TypeError('Response lost'); }
    return reply;
  };

  private json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }

  private async handle(method: string, path: string, body: unknown): Promise<Response> {
    if (!this.signedIn) return this.json({ error: 'Not signed in' }, 401);
    const parts = path.replace(/^\/api\/learning-sessions\/?/, '').split('/').filter(Boolean);
    if (parts.length === 0) {
      if (method === 'GET') return this.json({ sessions: await listSessions(this.repo, this.owner) });
      const result = await createSession(this.repo, this.owner, (body as { session?: unknown })?.session);
      if (result.status === 'invalid') return this.json({ error: result.message }, 400);
      if (result.status === 'limit') return this.json({ error: result.message, code: 'limit' }, 409);
      return this.json({ session: result.session }, result.status === 'created' ? 201 : 200);
    }
    const [id, sub] = parts;
    if (sub === 'actions' && method === 'POST') {
      const result = await applySessionActions(this.repo, this.reviews, this.owner, id, (body as { actions?: unknown })?.actions);
      if (result.status === 'not-found') return this.json({ error: 'Session not found' }, 404);
      if (result.status === 'invalid') return this.json({ error: result.message }, 400);
      if (result.status === 'busy') return this.json({ error: 'busy' }, 503);
      return this.json({ session: result.session, applied: result.applied, rejected: result.rejected, reviews: result.reviews });
    }
    if (method === 'DELETE') return (await deleteSession(this.repo, this.owner, id)) ? this.json({ ok: true }) : this.json({ error: 'Session not found' }, 404);
    const session = await getSession(this.repo, this.owner, id);
    return session ? this.json({ session }) : this.json({ error: 'Session not found' }, 404);
  }
}
export { MemoryStorage };
