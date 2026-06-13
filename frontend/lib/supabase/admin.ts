import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only, privileged operations.
 *
 * This bypasses Row Level Security, so it must NEVER be imported into client
 * components or exposed to the browser. We use it to verify incoming API keys
 * (a public API request has no user session, so RLS can't be relied on).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-only env var). Returns null when
 * it isn't configured so the public API can fail closed with a clear error
 * rather than crashing.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
