/**
 * Unit tests for `schemas/site.ts` — Zod validation for sites.
 */
import { describe, it, expect } from "vitest";
import { createSiteSchema, updateSiteSchema, slugSchema, domainSchema } from "./site.ts";

describe("slugSchema", () => {
  it("accepts lowercase alphanum and hyphens", () => {
    expect(slugSchema.safeParse("my-site").success).toBe(true);
    expect(slugSchema.safeParse("abc123").success).toBe(true);
  });
  it("rejects uppercase", () => {
    expect(slugSchema.safeParse("MySite").success).toBe(false);
  });
  it("rejects spaces", () => {
    expect(slugSchema.safeParse("my site").success).toBe(false);
  });
  it("rejects too short", () => {
    expect(slugSchema.safeParse("a").success).toBe(false);
  });
  it("rejects too long", () => {
    expect(slugSchema.safeParse("a".repeat(64)).success).toBe(false);
  });
  it("rejects leading/trailing hyphens", () => {
    expect(slugSchema.safeParse("-my-site").success).toBe(false);
    expect(slugSchema.safeParse("my-site-").success).toBe(false);
  });
});

describe("domainSchema", () => {
  it("accepts a normal domain", () => {
    expect(domainSchema.safeParse("example.com").success).toBe(true);
  });
  it("accepts a subdomain", () => {
    expect(domainSchema.safeParse("blog.example.com").success).toBe(true);
  });
  it("rejects protocol", () => {
    expect(domainSchema.safeParse("https://example.com").success).toBe(false);
  });
  it("rejects path", () => {
    expect(domainSchema.safeParse("example.com/path").success).toBe(false);
  });
  it("rejects empty", () => {
    expect(domainSchema.safeParse("").success).toBe(false);
  });
});

describe("createSiteSchema", () => {
  const valid = {
    slug: "my-site",
    title: "My Site",
    defaultLocale: "fr",
    supportedLocales: ["fr", "en"],
  };

  it("accepts a valid input", () => {
    expect(createSiteSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty title", () => {
    expect(createSiteSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });
  it("rejects empty supportedLocales", () => {
    expect(createSiteSchema.safeParse({ ...valid, supportedLocales: [] }).success).toBe(false);
  });
  it("rejects unsupported locale", () => {
    expect(createSiteSchema.safeParse({ ...valid, defaultLocale: "klingon" }).success).toBe(false);
  });
  it("rejects too many locales", () => {
    expect(
      createSiteSchema.safeParse({
        ...valid,
        supportedLocales: ["fr", "en", "es", "de", "pt", "it", "ja", "zh", "ru"],
      }).success
    ).toBe(false);
  });
  it("rejects too long description", () => {
    expect(
      createSiteSchema.safeParse({ ...valid, description: "x".repeat(501) }).success
    ).toBe(false);
  });
});

describe("updateSiteSchema", () => {
  it("accepts a partial update", () => {
    expect(updateSiteSchema.safeParse({ title: "New" }).success).toBe(true);
  });
  it("accepts status change", () => {
    expect(updateSiteSchema.safeParse({ status: "published" }).success).toBe(true);
  });
  it("rejects invalid status", () => {
    expect(updateSiteSchema.safeParse({ status: "drafty" }).success).toBe(false);
  });
  it("accepts nullable description (to clear)", () => {
    expect(updateSiteSchema.safeParse({ description: null }).success).toBe(true);
  });
});
