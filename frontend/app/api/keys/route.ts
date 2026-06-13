import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api/keys";

/**
 * In-app API key management for the signed-in user. These routes use the
 * cookie-session Supabase client, so Row Level Security scopes every query to
 * the current user automatically. (The public API at /api/v1 is separate and
 * uses the service-role client to verify keys.)
 */

// GET /api/keys — list the current user's active keys (no secrets returned).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data ?? [] });
}

// POST /api/keys — create a key. Returns the raw secret exactly once.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let name = "API key";
  try {
    const body = await request.json();
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, 80);
    }
  } catch {
    // No/invalid body — fall back to the default name.
  }

  const { raw, prefix, hash } = await generateApiKey();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // `key` is the only time the raw secret is ever exposed.
  return NextResponse.json({ ...data, key: raw }, { status: 201 });
}
