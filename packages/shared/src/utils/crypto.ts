/**
 * Cryptographic primitives used across the monorepo. All operations are
 * wrappers over the Web Crypto API, which is available natively in
 * Cloudflare Workers, Node 20, Deno, and modern browsers.
 */

/** SHA-256 hex digest of `input` (string or Uint8Array). */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

/** Constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** HMAC-SHA256 of `data` with `secret`, returned as a hex string. */
export async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toHex(new Uint8Array(sig));
}

/** Random URL-safe base64 string of `bytes` bytes (default 32). */
export function randomBase64Url(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
}

/** Hash an IP for storage — we keep the family octets, zero the host. */
export function hashIpForStorage(ip: string): string {
  if (ip.includes(":")) {
    // IPv6 — keep the first 4 groups, zero the rest.
    const parts = ip.split(":");
    return parts
      .map((p, i) => (i < 4 ? p : "0"))
      .join(":")
      .toLowerCase();
  }
  // IPv4 — keep the /24.
  const octets = ip.split(".");
  if (octets.length !== 4) return "0.0.0.0";
  return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
}

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
