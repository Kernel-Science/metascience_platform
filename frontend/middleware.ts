import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );


  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();


    const protectedRoutes = [
      "/research",
      "/citation",
      "/transparency",
      "/review",
      "/profile",
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    );

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");


    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }


    if (isAuthRoute && user && request.nextUrl.pathname !== "/auth/callback") {

      if (request.nextUrl.pathname === "/auth/reset-password") {
        return response;
      }
      return NextResponse.redirect(
        new URL("/research?tab=search", request.url),
      );
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
