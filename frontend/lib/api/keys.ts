import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API key helpers for the public Developer API.
 *
 * Format: `msk_live_<43 url-safe base64 chars>` (32 random bytes).
 *   - "msk" = MetaScience Key, "live" leaves room for a future "test" tier.
 * We store only the SHA-256 hash of the full key plus a short non-secret
 * display prefix; the raw key is returned to the user exactly once.
 */

const KEY_PREFIX = "msk_live_";
// Chars of the full key shown in the dashboard (prefix + first 8 random chars).
const DISPLAY_LEN = KEY_PREFIX.length + 8;

export interface GeneratedKey {
  /** Full secret, shown to the user exactly once. */
  raw: string;
  /** Non-secret display prefix stored for the dashboard. */
  prefix: string;
  /** SHA-256 hex digest of `raw`, the lookup key. */
  hash: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** SHA-256 hex digest using Web Crypto (available in the Next.js runtime). */
export async function hashApiKey(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a fresh API key with its hash and display prefix. */
export async function generateApiKey(): Promise<GeneratedKey> {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const raw = KEY_PREFIX + toBase64Url(random);
  const hash = await hashApiKey(raw);
  return { raw, prefix: raw.slice(0, DISPLAY_LEN), hash };
}

export interface VerifiedKey {
  userId: string;
  keyId: string;
}

/**
 * Verify the API key on an incoming public request.
 *
 * Reads `Authorization: Bearer <key>` or the `x-api-key` header, hashes it,
 * and looks up a non-revoked row via the service-role client. On success it
 * best-effort updates `last_used_at` and returns the owning user + key id.
 * Returns null for any missing/invalid/revoked key.
 */
export async function verifyApiKey(
  request: Request,
): Promise<VerifiedKey | null> {
  const raw = extractKey(request);
  if (!raw) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const hash = await hashApiKey(raw);
  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;

  // Best-effort usage stamp; never block the request on it.
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(undefined, () => undefined);

  return { userId: data.user_id, keyId: data.id };
}

function extractKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const apiKey = request.headers.get("x-api-key");
  return apiKey?.trim() || null;
}
