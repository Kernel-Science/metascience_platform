import { NextRequest } from "next/server";

import {
  apiError,
  BACKEND_URL,
  handlePreflight,
  proxyToBackend,
  requireApiKey,
} from "@/lib/api/gateway";

// POST /api/v1/trends
// Body: { query: string, limit?: number }   -> we search, then analyze trends
//   or  { papers: [...] }                    -> analyze the supplied papers
// Returns clustering + AI trend synthesis for the topic.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  // Passthrough mode: caller already has papers.
  if (Array.isArray(body?.papers)) {
    return proxyToBackend(`/api/analyze/trends`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papers: body.papers }),
    });
  }

  // Query mode: search first, then analyze the results.
  if (!body?.query || typeof body.query !== "string") {
    return apiError(
      400,
      "Provide either 'query' (string) or 'papers' (array).",
    );
  }

  const limit =
    Number(body.limit) > 0 ? Math.min(Number(body.limit), 200) : 100;
  const params = new URLSearchParams({
    query: body.query,
    limit: String(limit),
  });

  try {
    const searchRes = await fetch(`${BACKEND_URL}/api/search?${params}`, {
      headers: { "Content-Type": "application/json" },
    });
    const searchData = await searchRes.json();
    const papers = searchData?.papers ?? [];

    if (!Array.isArray(papers) || papers.length === 0) {
      return apiError(404, "No papers found for that query.");
    }

    return proxyToBackend(`/api/analyze/trends`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papers }),
    });
  } catch {
    return apiError(502, "Upstream research engine is unavailable.");
  }
}

export function OPTIONS() {
  return handlePreflight();
}
