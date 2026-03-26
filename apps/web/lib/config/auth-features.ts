/**
 * Client-side auth UI flags (NEXT_PUBLIC_* are inlined at build time in Next.js).
 * Extra social providers (Facebook, Instagram, etc.) stay off until enabled here
 * and in Supabase → Authentication → Providers.
 */
export function isFacebookLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH === "true";
}
