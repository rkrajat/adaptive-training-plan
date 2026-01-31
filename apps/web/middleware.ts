import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_active";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/profile", "/settings"];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/login"];

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  // Redirect authenticated users away from login
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect authenticated routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    // Only match specific routes that need protection
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
  ],
};
