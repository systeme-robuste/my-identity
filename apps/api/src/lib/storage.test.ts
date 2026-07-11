/**
 * Unit tests for `lib/storage.ts` — R2 media upload wrapper.
 *
 * Mocks the R2Bucket with a Map-based stub.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { uploadMedia, deleteMedia } from "./storage.ts";
import { ApiError } from "./errors.ts";
import type { R2Bucket, R2Object, R2PutOptions } from "@cloudflare/workers-types";

function makeMockR2(): R2Bucket {
  const store = new Map<string, ArrayBuffer>();
  return {
    put: vi.fn(async (key: string, value: ArrayBuffer | ReadableStream, _opts?: R2PutOptions) => {
      if (value instanceof ArrayBuffer) {
        store.set(key, value);
      } else {
        // ReadableStream path — for tests we skip
        throw new Error("stream not supported in test");
      }
      return {} as R2Object;
    }),
    get: vi.fn(async (key: string) => {
      const v = store.get(key);
      return v ? ({} as R2Object) : null;
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(),
    head: vi.fn(),
    createPresignedUrl: vi.fn(),
    resumeUpload: vi.fn(),
    _internalStore: store,
  } as unknown as R2Bucket;
}

const PUBLIC_BASE = "https://media.myidentity.app";

let bucket: R2Bucket;

beforeEach(() => {
  bucket = makeMockR2();
});

describe("uploadMedia", () => {
  it("uploads a valid image and returns key + public URL", async () => {
    const body = new TextEncoder().encode("fake-png-data").buffer;
    const result = await uploadMedia(bucket, PUBLIC_BASE, "site_abc", body, "image/png", "test.png");
    expect(result.key).toMatch(/^site_abc\/\d{4}\/\d{2}\/[0-9A-Z]{26}\.png$/);
    expect(result.publicUrl).toBe(`${PUBLIC_BASE}/${result.key}`);
    expect(result.size).toBe(body.byteLength);
    expect(result.contentType).toBe("image/png");
  });

  it("rejects unsupported MIME types", async () => {
    const body = new TextEncoder().encode("x").buffer;
    await expect(
      uploadMedia(bucket, PUBLIC_BASE, "s", body, "application/octet-stream", "x.bin")
    ).rejects.toThrow(ApiError);
  });

  it("rejects files over 25 MB", async () => {
    const big = new ArrayBuffer(26 * 1024 * 1024);
    await expect(
      uploadMedia(bucket, PUBLIC_BASE, "s", big, "image/png", "big.png")
    ).rejects.toThrow(ApiError);
  });

  it("uses MIME-derived extension when filename is missing", async () => {
    const body = new TextEncoder().encode("x").buffer;
    const result = await uploadMedia(bucket, PUBLIC_BASE, "s", body, "image/jpeg", null);
    expect(result.key.endsWith(".jpg")).toBe(true);
  });

  it("uses MIME-derived extension when filename extension is invalid", async () => {
    const body = new TextEncoder().encode("x").buffer;
    const result = await uploadMedia(bucket, PUBLIC_BASE, "s", body, "image/webp", "name.weird");
    expect(result.key.endsWith(".webp")).toBe(true);
  });

  it("strips trailing slash from public base URL", async () => {
    const body = new TextEncoder().encode("x").buffer;
    const result = await uploadMedia(bucket, `${PUBLIC_BASE}/`, "s", body, "image/png", "a.png");
    expect(result.publicUrl.startsWith(PUBLIC_BASE + "/")).toBe(true);
    expect(result.publicUrl.startsWith(PUBLIC_BASE + "//")).toBe(false);
  });

  it("accepts all allowed MIME types", async () => {
    const types = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif", "application/pdf", "video/mp4", "video/webm"];
    for (const t of types) {
      const body = new TextEncoder().encode("x").buffer;
      const ext = t.split("/")[1].split("+")[0];
      const r = await uploadMedia(bucket, PUBLIC_BASE, "s", body, t, `f.${ext}`);
      expect(r.contentType).toBe(t);
    }
  });
});

describe("deleteMedia", () => {
  it("deletes an existing key", async () => {
    const body = new TextEncoder().encode("x").buffer;
    const r = await uploadMedia(bucket, PUBLIC_BASE, "s", body, "image/png", "a.png");
    await deleteMedia(bucket, r.key);
    const deleted = await bucket.get(r.key);
    expect(deleted).toBeNull();
  });

  it("does not throw on missing key", async () => {
    await expect(deleteMedia(bucket, "nonexistent/key")).resolves.toBeUndefined();
  });
});
