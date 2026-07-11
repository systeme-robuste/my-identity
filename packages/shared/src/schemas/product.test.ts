/**
 * Unit tests for `schemas/product.ts` — Zod validation for products.
 */
import { describe, it, expect } from "vitest";
import { createProductSchema, updateProductSchema } from "./product.ts";

const valid = {
  name: "T-shirt",
  slug: "tshirt",
  type: "physical" as const,
  priceCents: 2500,
};

describe("createProductSchema", () => {
  it("accepts a valid product", () => {
    expect(createProductSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts a digital product with no shipping", () => {
    expect(
      createProductSchema.safeParse({ ...valid, type: "digital", requiresShipping: false }).success
    ).toBe(true);
  });
  it("rejects negative price", () => {
    expect(createProductSchema.safeParse({ ...valid, priceCents: -1 }).success).toBe(false);
  });
  it("rejects price over 1M USD", () => {
    expect(createProductSchema.safeParse({ ...valid, priceCents: 100_000_01 }).success).toBe(false);
  });
  it("rejects invalid type", () => {
    expect(createProductSchema.safeParse({ ...valid, type: "imaginary" }).success).toBe(false);
  });
  it("rejects too many images", () => {
    const images = Array.from({ length: 21 }, (_, i) => `https://img.example/${i}.jpg`);
    expect(createProductSchema.safeParse({ ...valid, imageUrls: images }).success).toBe(false);
  });
  it("rejects non-URL image", () => {
    expect(createProductSchema.safeParse({ ...valid, imageUrls: ["not-a-url"] }).success).toBe(false);
  });
  it("rejects negative inventory", () => {
    expect(createProductSchema.safeParse({ ...valid, inventory: -1 }).success).toBe(false);
  });
  it("rejects weight over 1 ton", () => {
    expect(createProductSchema.safeParse({ ...valid, weightGrams: 1_000_001 }).success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts a partial update", () => {
    expect(updateProductSchema.safeParse({ name: "New" }).success).toBe(true);
  });
  it("accepts status change", () => {
    expect(updateProductSchema.safeParse({ status: "active" }).success).toBe(true);
  });
  it("rejects invalid status", () => {
    expect(updateProductSchema.safeParse({ status: "live" }).success).toBe(false);
  });
});
