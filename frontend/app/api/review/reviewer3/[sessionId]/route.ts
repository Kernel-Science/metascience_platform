import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "Invalid JSON response from the backend",
      detail: text.slice(0, 500),
    };
  }
}

async function proxy(method: "GET" | "DELETE", sessionId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/review/reviewer3/${encodeURIComponent(sessionId)}`,
      { method },
    );

    const data = await parseResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process request",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  return proxy("GET", sessionId);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  return proxy("DELETE", sessionId);
}
