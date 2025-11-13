import { type NextRequest, NextResponse } from "next/server";
import { updateSession, checkAuth } from "@/lib/supabase/middleware";

/**
 * Next.js Middleware
 * Runs on every request to update Supabase session cookies and protect routes
 *
 * This middleware:
 * 1. Updates the user session on each request
 * 2. Ensures authentication cookies are properly set
 * 3. Protects authenticated routes (redirects to login if not authenticated)
 * 4. Redirects authenticated users away from auth pages
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ["/projects", "/profile", "/settings", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check authentication status
  const { authenticated } = await checkAuth(request);

  // Redirect to login if accessing protected route while not authenticated
  if (isProtectedRoute && !authenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to projects if accessing auth routes while authenticated
  if (isAuthRoute && authenticated) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // Update session for all requests
  return await updateSession(request);
}

/**
 * Middleware configuration
 * Specifies which routes this middleware should run on
 *
 * Current config:
 * - Runs on all routes except static files and internal Next.js routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
