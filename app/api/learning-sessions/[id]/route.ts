import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/api/respond';
import { deleteSession, getSession } from '@/lib/sessions/service';
import { sessionContext, validId } from '@/lib/sessions/server';

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const context = await sessionContext();
  if ('error' in context) return context.error;
  const { id } = await ctx.params;
  if (!validId(id)) return jsonError('Session not found', 404);
  const session = await getSession(context.repo, context.owner, id);
  return session ? NextResponse.json({ session }) : jsonError('Session not found', 404);
}

/** Removes the session only. Global card levels and other sessions stay. */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const context = await sessionContext();
  if ('error' in context) return context.error;
  const { id } = await ctx.params;
  if (!validId(id)) return jsonError('Session not found', 404);
  return (await deleteSession(context.repo, context.owner, id)) ? NextResponse.json({ ok: true }) : jsonError('Session not found', 404);
}
