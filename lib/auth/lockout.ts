export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function isLocked(lockedUntil: Date | null): boolean {
  return !!lockedUntil && lockedUntil.getTime() > Date.now();
}

export function nextLockoutState(failedAttempts: number): { failedAttempts: number; lockedUntil: Date | null } {
  const failed = failedAttempts + 1;
  if (failed >= MAX_FAILED_ATTEMPTS) {
    return { failedAttempts: failed, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) };
  }
  return { failedAttempts: failed, lockedUntil: null };
}
