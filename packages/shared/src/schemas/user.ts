import { z } from "zod";
import { SUPPORTED_LOCALES } from "../constants/locales.ts";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((s) => /[a-z]/.test(s), "Password must contain a lowercase letter")
  .refine((s) => /[A-Z]/.test(s), "Password must contain an uppercase letter")
  .refine((s) => /[0-9]/.test(s), "Password must contain a digit")
  .refine((s) => /[^A-Za-z0-9]/.test(s), "Password must contain a symbol");

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(80).optional(),
  locale: localeSchema.optional(),
  turnstileToken: z.string().min(1).max(2048),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember: z.boolean().optional(),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().min(1).max(2048),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  locale: localeSchema.optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
