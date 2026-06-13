import { NextRequest } from "next/server";

import {
  apiError,
  BACKEND_URL,
  CORS_HEADERS,
  handlePreflight,
  requireApiKey,
} from "@/lib/api/gateway";

// POST /api/v1/review  (multipart/form-data, field: file)
// AI peer-review assessment of an uploaded paper (PDF, LaTeX, TXT, DOCX, MD).
// Streams the multipart body straight through to the engine's /api/review/upload.
export const maxDuration = 300; // assessment can take a while

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request);
  if (auth instanceof Response) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "Expected multipart/form-data with a 'file' field.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiError(400, "Missing 'file' field in form data.");
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);

  try {
    const upstream = await fetch(`${BACKEND_URL}/api/review/upload`, {
      method: "POST",
      body: upstreamForm,
    });
    const text = await upstream.text();
    const data = text ? JSON.parse(text) : null;
    return Response.json(data, {
      status: upstream.status,
      headers: CORS_HEADERS,
    });
  } catch {
    return apiError(502, "Upstream research engine is unavailable.");
  }
}

export function OPTIONS() {
  return handlePreflight();
}
