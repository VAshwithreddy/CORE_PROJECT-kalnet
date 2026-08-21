import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routeAccess, canAccessRoute } from "./lib/route-policy";
import type { UserRole } from "./lib/roles";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files, _next, favicon, and Next.js API route handlers bypass middleware auth.
  // Any path segment named "api" (e.g. /executive/api, /department/api) is a route handler
  // that performs its own authentication — do not redirect these to login.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.endsWith("/api") ||
    pathname.includes("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname matches any protected scope
  const protectedPrefix = Object.keys(routeAccess).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!protectedPrefix) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("core_session_token")?.value;

  // Unauthenticated user attempting to access protected route -> redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (!apiBase) {
    return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  }
  const sessionResponse = await fetch(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: "no-store",
  }).catch(() => null);
  if (!sessionResponse?.ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  const session = await sessionResponse.json();
  if (!canAccessRoute(pathname, session.role as UserRole)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employee/:path*",
    "/department/:path*",
    "/executive/:path*",
    "/work-admin/:path*",
    "/system/:path*",
  ],
};
