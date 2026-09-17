import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { usersCollection } from "@/lib/db/collections";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { isLocked, nextLockoutState } from "@/lib/auth/lockout";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { username, password } = parsed.data;
  const usernameLower = username.toLowerCase();

  const users = await usersCollection();
  const user = await users.findOne({ usernameLower });

  // Generic message either way, so login never reveals whether a username exists.
  const invalidCredentials = () => jsonError("Invalid username or password", 401);

  if (!user) return invalidCredentials();

  if (isLocked(user.loginLockedUntil)) {
    return jsonError("Too many failed attempts. Try again later.", 429);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const { failedAttempts, lockedUntil } = nextLockoutState(user.failedLoginAttempts);
    await users.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: failedAttempts, loginLockedUntil: lockedUntil } },
    );
    return invalidCredentials();
  }

  await users.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, loginLockedUntil: null, lastLoginAt: new Date() } },
  );

  await setSessionCookie({ userId: user._id.toHexString(), username: user.username });

  return NextResponse.json({
    username: user.username,
    lifetimeScore: user.lifetimeScore,
    totalCorrect: user.totalCorrect,
    totalWrong: user.totalWrong,
  });
}
