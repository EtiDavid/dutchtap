import { describe, expect, it } from "vitest";
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from "@/lib/auth/recoveryCode";

describe("recovery code", () => {
  it("generates a code in XXXX-XXXX-XXXX-XXXX shape", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("avoids visually ambiguous characters (0, O, 1, I)", () => {
    const code = generateRecoveryCode();
    expect(code).not.toMatch(/[01OI]/);
  });

  it("generates different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRecoveryCode()));
    expect(codes.size).toBeGreaterThan(15);
  });

  it("is never stored in plaintext — only a hash is produced", async () => {
    const code = generateRecoveryCode();
    const hash = await hashRecoveryCode(code);
    expect(hash).not.toContain(code);
    expect(hash).not.toBe(code);
  });

  it("verifies a matching code regardless of case/whitespace", async () => {
    const code = generateRecoveryCode();
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code.toLowerCase(), hash)).toBe(true);
    expect(await verifyRecoveryCode(`  ${code}  `, hash)).toBe(true);
  });

  it("rejects a non-matching code", async () => {
    const hash = await hashRecoveryCode(generateRecoveryCode());
    expect(await verifyRecoveryCode("WRONG-CODE-WRONG-CODE", hash)).toBe(false);
  });
});
