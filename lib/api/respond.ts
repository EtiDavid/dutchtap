import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues[0]?.message ?? "Invalid request";
  return jsonError(message, 400);
}
