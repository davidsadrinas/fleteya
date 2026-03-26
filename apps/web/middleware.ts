import { type NextRequest, NextResponse } from "next/server";
import {
  isAuthProtectedPath,
  sanitizeInternalNextPath,
} from "@/lib/auth/path-utils";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

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
