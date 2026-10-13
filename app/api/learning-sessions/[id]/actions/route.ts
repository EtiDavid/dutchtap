import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/api/respond';
import { applySessionActions } from '@/lib/sessions/service';
import { readJson, sessionContext, validId } from '@/lib/sessions/server';

/** Applies a batch of learner actions. Replaying a batch is harmless: each action id is applied once. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const context = await sessionContext();
  if ('error' in context) return context.error;
  const { id } = await ctx.params;
  if (!validId(id)) return jsonError('Session not found', 404);
  const body = await readJson(request) as { actions?: unknown } | undefined;
  if (!body || typeof body !== 'object') return jsonError('Invalid JSON', 400);
  const result = await applySessionActions(context.repo, context.reviews, context.owner, id, body.actions);
  if (result.status === 'not-found') return jsonError('Session not found', 404);
  if (result.status === 'invalid') return jsonError(result.message, 400);
  if (result.status === 'busy') return jsonError('Session is busy, try again', 503);
  return NextResponse.json({ session: result.session, applied: result.applied, rejected: result.rejected, reviews: result.reviews });
}
