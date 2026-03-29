import type { SupabaseClient, User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "david.sadrinas@gmail.com";

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<{ error: string | null; status: number; user: User | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado", status: 401, user: null };

  if (user.email !== ADMIN_EMAIL) {
    return { error: "Acceso denegado", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}
