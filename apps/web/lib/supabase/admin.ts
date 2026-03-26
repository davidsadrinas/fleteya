import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserKey, getSupabaseUrl } from "./config";

/**
 * Service-role client (bypasses RLS). Use only in trusted server routes
 * (e.g. assignment runner, admin jobs).
 */
export function createServiceRoleSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon/server key for rare cases where service URL is needed without cookies. */
export function createAnonSupabase() {
  return createClient(getSupabaseUrl(), getSupabaseBrowserKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
