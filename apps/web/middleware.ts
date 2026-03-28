import { type NextRequest, NextResponse } from "next/server";
import {
  isAuthProtectedPath,
  sanitizeInternalNextPath,
} from "@/lib/auth/path-utils";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // CSRF protection: state-changing API requests from browsers must include X-Requested-With header.
  // This header cannot be sent cross-origin without CORS preflight, preventing CSRF attacks.
  const method = request.method;
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/payments/webhook") && // webhooks are externally authenticated
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    const xRequestedWith = request.headers.get("x-requested-with");
    const authHeader = request.headers.get("authorization");
    // Allow if: custom header present, or Bearer token (internal/mobile API calls)
    if (!xRequestedWith && !authHeader) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { response, user } = await updateSession(request);

  if (pathname.startsWith("/login") && user) {
    const next = request.nextUrl.searchParams.get("next");
    const safeNext = sanitizeInternalNextPath(next, "/dashboard");
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  if (isAuthProtectedPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
