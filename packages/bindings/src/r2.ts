/**
 * R2 facade. Returns the native Cloudflare `R2Bucket` on Workers, or an
 * S3-compatible implementation on Node (works with Cloudflare R2, AWS S3,
 * Backblaze B2, MinIO, etc.).
 */

import type { BindingsEnv, R2Bucket } from "./types.ts";
import { getRuntime } from "./runtime.ts";

const cache = new Map<string, R2Bucket>();

export function getR2(env: BindingsEnv, bindingName: keyof BindingsEnv): R2Bucket {
  const runtime = getRuntime();

  if (runtime === "cloudflare") {
    const binding = env[bindingName] as R2Bucket | undefined;
    if (!binding) {
      throw new Error(
        `[bindings] R2 binding '${String(bindingName)}' is not defined in wrangler.toml`
      );
    }
    return binding;
  }

  const cached = cache.get(String(bindingName));
  if (cached) return cached;

  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error(
      `[bindings] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME must be set for Node runtime`
    );
  }

  const instance = createS3R2(env);
  cache.set(String(bindingName), instance);
  return instance;
}

function createS3R2(env: BindingsEnv): R2Bucket {
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } =
    require("@aws-sdk/client-s3") as typeof import("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner") as typeof import("@aws-sdk/s3-request-presigner");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const Bucket = env.R2_BUCKET_NAME!;

  return {
    async put(
      key: string,
      value: ArrayBuffer | ReadableStream | string,
      options?: { httpMetadata?: { contentType?: string; cacheControl?: string }; customMetadata?: Record<string, string> }
    ): Promise<R2Object> {
      let Body: Buffer;
      if (typeof value === "string") Body = Buffer.from(value, "utf-8");
      else if (value instanceof ArrayBuffer) Body = Buffer.from(value);
      else throw new Error("[bindings] R2.put: ReadableStream not yet supported on Node runtime");

      const cmd = new PutObjectCommand({
        Bucket,
        Key: key,
        Body,
        ContentType: options?.httpMetadata?.contentType,
        CacheControl: options?.httpMetadata?.cacheControl,
        Metadata: options?.customMetadata,
      });
      const res = await s3.send(cmd);
      return {
        key,
        versionId: res.VersionId,
        size: Body.length,
        etag: res.ETag?.replace(/"/g, ""),
        httpEtag: res.ETag,
        uploaded: new Date(),
        httpMetadata: options?.httpMetadata ?? {},
        customMetadata: options?.customMetadata ?? {},
      } as unknown as R2Object;
    },
    async get(key: string): Promise<R2ObjectBody | null> {
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
        const buf = await streamToBuffer(res.Body as ReadableStream);
        return {
          key,
          versionId: res.VersionId,
          size: buf.length,
          etag: res.ETag?.replace(/"/g, ""),
          httpEtag: res.ETag,
          uploaded: res.LastModified ?? new Date(),
          httpMetadata: { contentType: res.ContentType, cacheControl: res.CacheControl },
          customMetadata: res.Metadata ?? {},
          body: bufToReadable(buf),
          bodyUsed: false,
          arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
          text: async () => buf.toString("utf-8"),
          json: async () => JSON.parse(buf.toString("utf-8")),
          blob: async () => new Blob([buf]),
        } as unknown as R2ObjectBody;
      } catch (e: any) {
        if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NoSuchKey") return null;
        throw e;
      }
    },
    async head(key: string): Promise<R2Object | null> {
      try {
        const res = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
        return {
          key,
          versionId: res.VersionId,
          size: res.ContentLength ?? 0,
          etag: res.ETag?.replace(/"/g, ""),
          httpEtag: res.ETag,
          uploaded: res.LastModified ?? new Date(),
          httpMetadata: { contentType: res.ContentType, cacheControl: res.CacheControl },
          customMetadata: res.Metadata ?? {},
        } as unknown as R2Object;
      } catch (e: any) {
        if (e?.$metadata?.httpStatusCode === 404) return null;
        throw e;
      }
    },
    async delete(key: string | string[]): Promise<void> {
      const keys = Array.isArray(key) ? key : [key];
      for (const k of keys) {
        await s3.send(new DeleteObjectCommand({ Bucket, Key: k }));
      }
    },
    async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<any> {
      const res = await s3.send(new ListObjectsV2Command({
        Bucket,
        Prefix: options?.prefix,
        MaxKeys: options?.limit,
        ContinuationToken: options?.cursor,
      }));
      return {
        objects: (res.Contents ?? []).map((o: any) => ({
          key: o.Key,
          size: o.Size,
          etag: o.ETag?.replace(/"/g, ""),
          uploaded: o.LastModified,
        })),
        truncated: res.IsTruncated ?? false,
        cursor: res.NextContinuationToken,
        delimitedPrefixes: res.CommonPrefixes?.map((p: any) => p.Prefix) ?? [],
      };
    },
    async createPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
      return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn });
    },
  } as unknown as R2Bucket;
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  if (Buffer.isBuffer(stream)) return stream;
  if (stream instanceof ArrayBuffer) return Buffer.from(stream);
  // Node Readable stream
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function bufToReadable(buf: Buffer): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buf));
      controller.close();
    },
  });
}
