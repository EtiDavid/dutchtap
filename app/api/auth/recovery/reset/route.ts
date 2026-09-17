import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { usersCollection } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";
import { verifyRecoveryCode } from "@/lib/auth/recoveryCode";
import { isLocked, nextLockoutState } from "@/lib/auth/lockout";
import { jsonError, zodErrorResponse } from "@/lib/api/respond";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { username, recoveryCode, newPassword } = parsed.data;
  const usernameLower = username.toLowerCase();

  const users = await usersCollection();
  const user = await users.findOne({ usernameLower });

  const invalidRecovery = () => jsonError("Invalid username or recovery code", 401);

  if (!user) return invalidRecovery();
  if (isLocked(user.recoveryLockedUntil)) {
    return jsonError("Too many failed attempts. Try again later.", 429);
  }

  const valid = await verifyRecoveryCode(recoveryCode, user.recoveryCodeHash);
  if (!valid) {
    const { failedAttempts, lockedUntil } = nextLockoutState(user.failedRecoveryAttempts);
    await users.updateOne(
      { _id: user._id },
      { $set: { failedRecoveryAttempts: failedAttempts, recoveryLockedUntil: lockedUntil } },
    );
    return invalidRecovery();
  }

  const passwordHash = await hashPassword(newPassword);
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
        failedRecoveryAttempts: 0,
        recoveryLockedUntil: null,
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({ ok: true });
}
