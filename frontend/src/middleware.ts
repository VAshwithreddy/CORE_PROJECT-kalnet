import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routeAccess, canAccessRoute } from "./lib/route-policy";
import type { UserRole } from "./lib/roles";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files, _next, favicon, api routes bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
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

  // Get session role from cookie
  const roleCookie = request.cookies.get("core_session_role")?.value as UserRole | undefined;

  // Unauthenticated user attempting to access protected route -> redirect to login
  if (!roleCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based permission
  if (!canAccessRoute(pathname, roleCookie)) {
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
