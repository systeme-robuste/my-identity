/**
 * KV facade. Returns the native Cloudflare `KVNamespace` on Workers, or a
 * Upstash-Redis-backed implementation on Node.
 *
 * Both implementations expose the same surface (`get` / `put` / `delete`
 * / `list` / `getWithMetadata`) so call sites are runtime-agnostic.
 */

import type { BindingsEnv, KVNamespace } from "./types.ts";
import { getRuntime } from "./runtime.ts";

/**
 * Cached instances keyed by namespace name (SESSIONS, RATE_LIMIT, etc.).
 * On Workers, the binding is a singleton passed by the runtime.
 * On Node, the Upstash client is constructed lazily per namespace.
 */
const cache = new Map<string, KVNamespace>();

export function getKV(env: BindingsEnv, bindingName: keyof BindingsEnv): KVNamespace {
  const runtime = getRuntime();

  if (runtime === "cloudflare") {
    const binding = env[bindingName] as KVNamespace | undefined;
    if (!binding) {
      throw new Error(
        `[bindings] KV binding '${String(bindingName)}' is not defined in wrangler.toml`
      );
    }
    return binding;
  }

  // Node runtime: Upstash Redis
  const cached = cache.get(String(bindingName));
  if (cached) return cached;

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      `[bindings] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for Node runtime`
    );
  }

  const instance = createUpstashKV(env, String(bindingName));
  cache.set(String(bindingName), instance);
  return instance;
}

/**
 * Creates a KVNamespace-compatible wrapper around Upstash Redis.
 * Uses a prefix per binding so multiple "namespaces" coexist in a single
 * Redis database (Upstash free tier is one DB per project).
 */
function createUpstashKV(env: BindingsEnv, namespace: string): KVNamespace {
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const prefix = `kv:${namespace}:`;

  return {
    async get(key: string): Promise<string | null> {
      const v = await redis.get<string>(prefix + key);
      return v ?? null;
    },
    async getWithMetadata(key: string): Promise<{ value: string | null; metadata: any }> {
      const v = await redis.get<string>(prefix + key);
      // Upstash doesn't expose native metadata on GET; we encode it into the value.
      // For pure-metadata cases, store a JSON wrapper { value, metadata }.
      if (!v) return { value: null, metadata: null };
      try {
        const parsed = JSON.parse(v);
        if (parsed && typeof parsed === "object" && "__v" in parsed) {
          return { value: parsed.__v, metadata: parsed.__m ?? null };
        }
      } catch {}
      return { value: v, metadata: null };
    },
    async put(
      key: string,
      value: string | ArrayBuffer | ReadableStream,
      options?: { expirationTtl?: number; expiration?: number | Date; metadata?: any }
    ): Promise<void> {
      let v: string;
      if (typeof value === "string") v = value;
      else if (value instanceof ArrayBuffer) v = new TextDecoder().decode(value);
      else v = "[binary]"; // ReadableStream is rare in our use cases

      const wrapped =
        options?.metadata !== undefined
          ? JSON.stringify({ __v: v, __m: options.metadata })
          : v;

      const ttl = options?.expirationTtl;
      if (ttl) {
        await redis.set(prefix + key, wrapped, { ex: ttl });
      } else if (options?.expiration) {
        const exp = options.expiration instanceof Date
          ? Math.floor(options.expiration.getTime() / 1000)
          : options.expiration;
        const now = Math.floor(Date.now() / 1000);
        await redis.set(prefix + key, wrapped, { ex: Math.max(1, exp - now) });
      } else {
        await redis.set(prefix + key, wrapped);
      }
    },
    async delete(key: string): Promise<void> {
      await redis.del(prefix + key);
    },
    async list({ prefix: p, cursor, limit = 1000 }: {
      prefix?: string;
      cursor?: string;
      limit?: number;
    } = {}): Promise<{ keys: { name: string; metadata?: any }[]; cursor?: string; list_complete: boolean }> {
      // SCAN is not exposed by Upstash REST; we use KEYS with caution.
      // For our scale (<10k keys per namespace) this is fine.
      const pattern = prefix + (p ?? "") + "*";
      const keys = await redis.keys(pattern);
      return {
        keys: keys.slice(0, limit).map((k) => ({ name: k.slice(prefix.length) })),
        list_complete: true,
      };
    },
  } as unknown as KVNamespace;
}
