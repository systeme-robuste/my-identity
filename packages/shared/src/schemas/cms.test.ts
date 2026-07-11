/**
 * Unit tests for `schemas/cms.ts` — Zod validation for CMS collections/entries.
 */
import { describe, it, expect } from "vitest";
import {
  collectionFieldTypeSchema,
  createCollectionSchema,
  createEntrySchema,
} from "./cms.ts";

describe("collectionFieldTypeSchema", () => {
  it("accepts all valid types", () => {
    for (const t of ["text", "longtext", "richtext", "number", "boolean", "date", "url", "image"]) {
      expect(collectionFieldTypeSchema.safeParse(t).success).toBe(true);
    }
  });
  it("rejects unknown", () => {
    expect(collectionFieldTypeSchema.safeParse("blob").success).toBe(false);
  });
});

describe("createCollectionSchema", () => {
  it("accepts a valid collection", () => {
    const r = createCollectionSchema.safeParse({
      name: "posts",
      label: "Posts",
      fields: [
        { name: "title", label: "Title", type: "text", required: true, unique: false, options: null, referenceCollectionId: null, defaultValue: null, order: 0 },
        { name: "body", label: "Body", type: "longtext", required: false, unique: false, options: null, referenceCollectionId: null, defaultValue: null, order: 1 },
      ],
    });
    expect(r.success).toBe(true);
  });
  it("rejects field name not in snake_case", () => {
    const r = createCollectionSchema.safeParse({
      name: "posts",
      label: "Posts",
      fields: [
        { name: "Title", label: "T", type: "text", required: true, unique: false, options: null, referenceCollectionId: null, defaultValue: null, order: 0 },
      ],
    });
    expect(r.success).toBe(false);
  });
  it("rejects empty fields", () => {
    const r = createCollectionSchema.safeParse({ name: "posts", label: "Posts", fields: [] });
    expect(r.success).toBe(false);
  });
  it("rejects too many fields", () => {
    const fields = Array.from({ length: 101 }, (_, i) => ({
      name: `f${i}`,
      label: `F${i}`,
      type: "text" as const,
      required: false,
      unique: false,
      options: null,
      referenceCollectionId: null,
      defaultValue: null,
      order: i,
    }));
    const r = createCollectionSchema.safeParse({ name: "posts", label: "Posts", fields });
    expect(r.success).toBe(false);
  });
});

describe("createEntrySchema", () => {
  it("accepts an empty entry", () => {
    expect(createEntrySchema.safeParse({}).success).toBe(true);
  });
  it("accepts an entry with data", () => {
    expect(createEntrySchema.safeParse({ data: { title: "Hi" } }).success).toBe(true);
  });
  it("rejects data of wrong type", () => {
    expect(createEntrySchema.safeParse({ data: "not an object" }).success).toBe(false);
  });
  it("accepts null data (for status-only updates)", () => {
    expect(createEntrySchema.safeParse({ data: null }).success).toBe(true);
  });
});
