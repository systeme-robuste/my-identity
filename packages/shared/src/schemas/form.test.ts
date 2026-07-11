/**
 * Unit tests for `schemas/form.ts` — Zod validation for forms.
 */
import { describe, it, expect } from "vitest";
import { formFieldTypeSchema, createFormSchema, submitFormSchema } from "./form.ts";

describe("formFieldTypeSchema", () => {
  it("accepts all valid types", () => {
    for (const t of ["text", "email", "phone", "select", "checkbox", "number", "url", "file"]) {
      expect(formFieldTypeSchema.safeParse(t).success).toBe(true);
    }
  });
  it("rejects unknown", () => {
    expect(formFieldTypeSchema.safeParse("rating").success).toBe(false);
  });
});

describe("createFormSchema", () => {
  const valid = {
    name: "Contact",
    fields: [
      { name: "email", label: "Email", type: "email" as const, required: true, order: 0 },
      { name: "message", label: "Message", type: "textarea" as const, required: false, order: 1 },
    ],
  };
  it("accepts a valid form", () => {
    expect(createFormSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty fields", () => {
    expect(createFormSchema.safeParse({ ...valid, fields: [] }).success).toBe(false);
  });
  it("rejects field name not snake_case", () => {
    expect(
      createFormSchema.safeParse({
        ...valid,
        fields: [{ name: "Email", label: "Email", type: "email", required: true, order: 0 }],
      }).success
    ).toBe(false);
  });
  it("rejects placeholder too long", () => {
    expect(
      createFormSchema.safeParse({
        ...valid,
        fields: [
          { name: "email", label: "Email", type: "email", required: true, placeholder: "x".repeat(121), order: 0 },
        ],
      }).success
    ).toBe(false);
  });
});

describe("submitFormSchema", () => {
  it("accepts an empty submission", () => {
    expect(submitFormSchema.safeParse({}).success).toBe(true);
  });
  it("accepts a data object", () => {
    expect(submitFormSchema.safeParse({ data: { email: "a@b.co" } }).success).toBe(true);
  });
  it("rejects data of wrong type", () => {
    expect(submitFormSchema.safeParse({ data: "not object" }).success).toBe(false);
  });
  it("rejects invalid turnstile token", () => {
    expect(submitFormSchema.safeParse({ turnstileToken: "" }).success).toBe(false);
  });
});
