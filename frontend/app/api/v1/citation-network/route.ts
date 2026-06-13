import { NextRequest } from "next/server";

import {
  apiError,
  handlePreflight,
  proxyToBackend,
  requireApiKey,
} from "@/lib/api/gateway";

// POST /api/v1/citation-network
// Body: { doi: string, max_references?: number, max_citations?: number, data_source?: "s2"|"oa" }
// Builds a citation graph (nodes/edges/clusters) seeded on the given DOI.
export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  if (!body?.doi || typeof body.doi !== "string") {
    return apiError(400, "Missing required 'doi' field.");
  }

  return proxyToBackend(`/api/citation-network`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function OPTIONS() {
  return handlePreflight();
}
