import { describe, expect, it } from "vitest";
import { loginSchema, passwordSchema, registerSchema, usernameSchema } from "@/lib/validation/auth";

describe("usernameSchema", () => {
  it("accepts a valid username", () => {
    expect(usernameSchema.safeParse("dutch_learner-1").success).toBe(true);
  });

  it("rejects too short / too long", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("rejects invalid characters (spaces, @, etc.)", () => {
    expect(usernameSchema.safeParse("bad name").success).toBe(false);
    expect(usernameSchema.safeParse("bad@name").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("longenough1").success).toBe(true);
  });
});

describe("registerSchema / loginSchema", () => {
  it("accepts a valid registration payload", () => {
    expect(registerSchema.safeParse({ username: "eti_david", password: "supersecret1" }).success).toBe(true);
  });

  it("rejects registration missing fields", () => {
    expect(registerSchema.safeParse({ username: "eti_david" }).success).toBe(false);
  });

  it("accepts any non-empty password for login (strength is only enforced at registration)", () => {
    expect(loginSchema.safeParse({ username: "eti_david", password: "x" }).success).toBe(true);
  });
});
