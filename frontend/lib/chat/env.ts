import fs from "fs";
import path from "path";

// Mirror of the backend's `load_dotenv(override=True)` decision: the dev shell
// has been seen exporting an *empty* ANTHROPIC_API_KEY, which Next.js lets
// shadow the real key in .env.local. If the env var is missing/empty, patch it
// from .env.local so the chat route works regardless of shell state.
export function ensureAnthropicKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return;
  try {
    const envFile = fs.readFileSync(
      path.join(process.cwd(), ".env.local"),
      "utf8",
    );
    const m = envFile.match(/^ANTHROPIC_API_KEY=(.+)$/m);

    if (m) {
      process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local — nothing to patch; the SDK will raise a clear auth error.
  }
}
