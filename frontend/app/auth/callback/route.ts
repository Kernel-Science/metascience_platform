import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/research?tab=search";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`,
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=exchange_failed&description=${encodeURIComponent(error.message)}`,
        );
      }

      if (!data.session) {
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=no_session&description=No session was created`,
        );
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=unexpected&description=${encodeURIComponent(String(error))}`,
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=missing_code&description=No authorization code provided`,
  );
}
