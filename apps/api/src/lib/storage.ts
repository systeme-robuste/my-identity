/**
 * R2 wrapper for media uploads. The dashboard uploads through this
 * wrapper; the renderer reads media directly from the public R2 custom
 * domain (`media.myidentity.app`).
 *
 * Object key format: `{siteId}/{yyyy}/{mm}/{ulid}.{ext}`. This keeps
 * the R2 listing flat and prefix-deletes cheap.
 */

import type { R2Bucket } from "@cloudflare/workers-types";
import { ulid } from "@my-identity/shared/utils/id";
import { ApiError } from "./errors.ts";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/webm",
]);

const EXT_BY_MIME: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export interface UploadedMedia {
  key: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

export async function uploadMedia(
  bucket: R2Bucket,
  publicBaseUrl: string,
  siteId: string,
  body: ArrayBuffer,
  contentType: string,
  originalFilename: string | null
): Promise<UploadedMedia> {
  if (!ALLOWED_MIME.has(contentType)) {
    throw new ApiError("unsupported_media_type", `Content-Type '${contentType}' is not allowed`, 415);
  }
  if (body.byteLength > 25 * 1024 * 1024) {
    throw new ApiError("payload_too_large", "File exceeds 25 MB limit", 413);
  }
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = guessExtension(originalFilename, contentType);
  const key = `${siteId}/${yyyy}/${mm}/${ulid()}.${ext}`;
  await bucket.put(key, body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  return {
    key,
    publicUrl: `${publicBaseUrl.replace(/\/$/, "")}/${key}`,
    size: body.byteLength,
    contentType,
  };
}

export async function deleteMedia(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

function guessExtension(filename: string | null, mime: string): string {
  if (filename) {
    const idx = filename.lastIndexOf(".");
    if (idx > 0 && idx < filename.length - 1) {
      const ext = filename.slice(idx + 1).toLowerCase();
      if (/^[a-z0-9]{1,8}$/.test(ext)) return ext;
    }
  }
  return EXT_BY_MIME[mime] ?? "bin";
}
