/**
 * Runtime detection. Returns "cloudflare" if running on Workers
 * (where `caches` and `globalThis.WebSocketPair` exist), otherwise "node".
 *
 * Can be overridden by the `RUNTIME` env var for explicit control.
 */

export type Runtime = "cloudflare" | "node";

export function getRuntime(): Runtime {
  const forced = (typeof process !== "undefined" ? process.env?.RUNTIME : undefined) as
    | Runtime
    | undefined;
  if (forced === "cloudflare" || forced === "node") return forced;

  // Auto-detect: Cloudflare Workers exposes WebSocketPair and caches on globalThis
  // @ts-ignore - this is a runtime check
  if (typeof WebSocketPair !== "undefined" && typeof caches !== "undefined") {
    return "cloudflare";
  }
  return "node";
}

export function isCloudflare(): boolean {
  return getRuntime() === "cloudflare";
}

export function isNode(): boolean {
  return getRuntime() === "node";
}
