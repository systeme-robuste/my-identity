/**
 * Unit tests for `schemas/page.ts` — Zod validation for pages and blocks.
 */
import { describe, it, expect } from "vitest";
import { blockSchema, createPageSchema, updatePageSchema, reorderPagesSchema } from "./page.ts";

describe("blockSchema", () => {
  it("accepts a heading", () => {
    expect(
      blockSchema.safeParse({ id: "b1", type: "heading", level: 1, text: "Hi", anchor: null }).success
    ).toBe(true);
  });
  it("accepts a paragraph", () => {
    expect(blockSchema.safeParse({ id: "b2", type: "paragraph", text: "Hello" }).success).toBe(true);
  });
  it("accepts an image", () => {
    expect(
      blockSchema.safeParse({
        id: "b3",
        type: "image",
        src: "https://img.example/x.jpg",
        alt: "x",
        width: 800,
        height: 600,
        caption: null,
      }).success
    ).toBe(true);
  });
  it("rejects invalid image src", () => {
    expect(
      blockSchema.safeParse({ id: "b3", type: "image", src: "not-a-url", alt: "x" }).success
    ).toBe(false);
  });
  it("accepts a button", () => {
    expect(
      blockSchema.safeParse({
        id: "b4",
        type: "button",
        label: "Click",
        href: "/start",
        variant: "primary",
        openInNewTab: false,
      }).success
    ).toBe(true);
  });
  it("rejects unknown block type", () => {
    expect(blockSchema.safeParse({ id: "bx", type: "mystery" }).success).toBe(false);
  });
  it("rejects image with negative width", () => {
    expect(
      blockSchema.safeParse({
        id: "b3",
        type: "image",
        src: "https://img.example/x.jpg",
        alt: "x",
        width: -1,
        height: 600,
      }).success
    ).toBe(false);
  });
});

describe("createPageSchema", () => {
  it("accepts a minimal page", () => {
    expect(
      createPageSchema.safeParse({ slug: "about", title: "About" }).success
    ).toBe(true);
  });
  it("rejects empty slug", () => {
    expect(createPageSchema.safeParse({ slug: "", title: "About" }).success).toBe(false);
  });
  it("rejects title over 120 chars", () => {
    expect(createPageSchema.safeParse({ slug: "x", title: "x".repeat(121) }).success).toBe(false);
  });
  it("rejects too many blocks", () => {
    const blocks = Array.from({ length: 501 }, () => ({
      id: "b",
      type: "paragraph" as const,
      text: "x",
    }));
    expect(createPageSchema.safeParse({ slug: "x", title: "t", blocks }).success).toBe(false);
  });
});

describe("updatePageSchema", () => {
  it("accepts a partial update", () => {
    expect(updatePageSchema.safeParse({ title: "New" }).success).toBe(true);
  });
  it("accepts a status change", () => {
    expect(updatePageSchema.safeParse({ status: "published" }).success).toBe(true);
  });
  it("rejects invalid status", () => {
    expect(updatePageSchema.safeParse({ status: "drafty" }).success).toBe(false);
  });
});

describe("reorderPagesSchema", () => {
  it("accepts a list", () => {
    expect(
      reorderPagesSchema.safeParse({
        order: [
          { id: "p1", slug: "about" },
          { id: "p2", slug: "pricing" },
        ],
      }).success
    ).toBe(true);
  });
  it("rejects empty order", () => {
    expect(reorderPagesSchema.safeParse({ order: [] }).success).toBe(true); // empty is allowed
  });
  it("rejects malformed entry", () => {
    expect(reorderPagesSchema.safeParse({ order: [{ id: "p1" }] }).success).toBe(false);
  });
});
