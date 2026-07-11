/**
 * Unit tests for `schemas/user.ts` — Zod validation for auth & profile.
 */
import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./user.ts";

describe("emailSchema", () => {
  it("accepts a valid email", () => {
    const r = emailSchema.safeParse("alice@example.com");
    expect(r.success).toBe(true);
  });
  it("lowercases and trims", () => {
    const r = emailSchema.safeParse("  ALICE@EXAMPLE.COM  ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("alice@example.com");
  });
  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
    expect(emailSchema.safeParse("a@b").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Strong-pa55!").success).toBe(true);
  });
  it("rejects too short", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
  });
  it("rejects without uppercase", () => {
    expect(passwordSchema.safeParse("weak-pa55!").success).toBe(false);
  });
  it("rejects without lowercase", () => {
    expect(passwordSchema.safeParse("WEAK-PA55!").success).toBe(false);
  });
  it("rejects without digit", () => {
    expect(passwordSchema.safeParse("Strong-pa!!").success).toBe(false);
  });
  it("rejects without symbol", () => {
    expect(passwordSchema.safeParse("Strongpa55X").success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup", () => {
    expect(
      signupSchema.safeParse({
        email: "alice@example.com",
        password: "Strong-pa55!",
        turnstileToken: "tk_abc",
      }).success
    ).toBe(true);
  });
  it("rejects without turnstile token", () => {
    expect(
      signupSchema.safeParse({
        email: "alice@example.com",
        password: "Strong-pa55!",
      }).success
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(loginSchema.safeParse({ email: "alice@example.com", password: "any" }).success).toBe(true);
  });
  it("accepts optional remember", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x", remember: true }).success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires email and turnstile", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co", turnstileToken: "tk" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "x".repeat(30),
        password: "Strong-pa55!",
      }).success
    ).toBe(true);
  });
  it("rejects short token", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "short", password: "Strong-pa55!" }).success
    ).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty update", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });
  it("rejects invalid avatar URL", () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: "not-a-url" }).success).toBe(false);
  });
  it("accepts null avatar (to clear)", () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: null }).success).toBe(true);
  });
});
