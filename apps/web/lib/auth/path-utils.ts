/** Routes that require an authenticated Supabase session (App Router paths). */
export const AUTH_PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings",
  "/shipment",
  "/tracking",
] as const;

export function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Prevents open redirects: only same-origin relative paths starting with a single "/". */
export function sanitizeInternalNextPath(
  next: string | null,
  fallback: string
): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}
