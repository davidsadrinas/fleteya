import { createBrowserClient } from "@supabase/ssr";
import { getOptionalSupabaseEnv, getSupabaseBrowserKey, getSupabaseUrl } from "./config";

export function createClient() {
  const env = getOptionalSupabaseEnv();
  if (!env) {
    // During Next.js prerender, Client Components can be evaluated on the server.
    // Avoid failing the whole build when public envs are unavailable at that phase.
    if (typeof window === "undefined") {
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-public-anon-key"
      );
    }
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseBrowserKey());
}
