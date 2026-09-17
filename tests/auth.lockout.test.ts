import { describe, expect, it } from "vitest";
import { isLocked, MAX_FAILED_ATTEMPTS, nextLockoutState } from "@/lib/auth/lockout";

describe("login/recovery lockout", () => {
  it("does not lock before the max attempt threshold", () => {
    let state = { failedAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      state = nextLockoutState(state.failedAttempts);
      expect(state.lockedUntil).toBeNull();
    }
  });

  it("locks once the max attempt threshold is reached", () => {
    const state = nextLockoutState(MAX_FAILED_ATTEMPTS - 1);
    expect(state.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
    expect(state.lockedUntil).not.toBeNull();
  });

  it("isLocked is true for a future lock time and false for past/null", () => {
    expect(isLocked(new Date(Date.now() + 60_000))).toBe(true);
    expect(isLocked(new Date(Date.now() - 60_000))).toBe(false);
    expect(isLocked(null)).toBe(false);
  });
});
