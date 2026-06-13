import { NextRequest } from "next/server";

import {
  apiError,
  handlePreflight,
  proxyToBackend,
  requireApiKey,
} from "@/lib/api/gateway";

// GET /api/v1/search?query=...&limit=...&source=...&year_from=...&year_to=...
// Public, key-authed multi-source paper search. Proxies to the engine's
// GET /api/search and passes through all query parameters.
export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request);
  if (auth instanceof Response) return auth;

  const params = request.nextUrl.searchParams;
  if (!params.get("query")) {
    return apiError(400, "Missing required 'query' parameter.");
  }

  return proxyToBackend(`/api/search?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export function OPTIONS() {
  return handlePreflight();
}
