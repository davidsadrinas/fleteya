import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<{ error: string | null; status: number; user: User | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado", status: 401, user: null };

  // Use service role to verify admin status — avoids RLS dependency for authorization
  const adminClient = createServiceRoleSupabase();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Acceso denegado", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}
