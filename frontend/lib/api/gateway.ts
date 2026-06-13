import { NextResponse } from "next/server";

import { verifyApiKey, type VerifiedKey } from "@/lib/api/keys";

/**
 * Shared plumbing for the public Developer API (`/api/v1/*`):
 * key verification, permissive CORS, uniform error shapes, and a proxy to the
 * FastAPI engine. Keeping it here means each v1 route is just a thin adapter.
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

/** Respond to CORS preflight requests. */
export function handlePreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function apiJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function apiError(status: number, message: string): NextResponse {
  return apiJson({ error: message }, status);
}

/**
 * Verify the API key or return a ready-to-send 401. Usage:
 *   const auth = await requireApiKey(request);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireApiKey(
  request: Request,
): Promise<VerifiedKey | NextResponse> {
  const verified = await verifyApiKey(request);
  if (!verified) {
    return apiError(
      401,
      "Invalid or missing API key. Send it as 'Authorization: Bearer <key>' or the 'x-api-key' header.",
    );
  }
  return verified;
}

/**
 * Forward a request to the FastAPI engine and return its JSON response with
 * CORS headers attached. `init` is passed straight through to fetch.
 */
export async function proxyToBackend(
  path: string,
  init?: Parameters<typeof fetch>[1],
): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${BACKEND_URL}${path}`, init);
    const text = await upstream.text();
    const data = text ? safeJson(text) : null;
    return apiJson(data, upstream.status);
  } catch {
    return apiError(502, "Upstream research engine is unavailable.");
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
