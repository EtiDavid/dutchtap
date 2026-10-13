import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/api/respond';
import { createSession, listSessions } from '@/lib/sessions/service';
import { readJson, sessionContext } from '@/lib/sessions/server';

export async function GET() {
  const context = await sessionContext();
  if ('error' in context) return context.error;
  return NextResponse.json({ sessions: await listSessions(context.repo, context.owner) });
}

/** Creates a session (the device chose the fixed cards) or imports one from a guest device. Idempotent on the session id. */
export async function POST(request: Request) {
  const context = await sessionContext();
  if ('error' in context) return context.error;
  const body = await readJson(request) as { session?: unknown } | undefined;
  if (!body || typeof body !== 'object') return jsonError('Invalid JSON', 400);
  const result = await createSession(context.repo, context.owner, body.session);
  if (result.status === 'invalid') return jsonError(result.message, 400);
  if (result.status === 'limit') return NextResponse.json({ error: result.message, code: 'limit' }, { status: 409 });
  return NextResponse.json({ session: result.session }, { status: result.status === 'created' ? 201 : 200 });
}
