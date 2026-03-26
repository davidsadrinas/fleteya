"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSession } from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores";

type ProfileRow = {
  name: string | null;
  role: string | null;
  avatar_url: string | null;
  phone: string | null;
};

export function AuthSync({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setUser(null);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: profileRaw } = await supabase
        .from("profiles")
        .select("name, role, avatar_url, phone")
        .eq("id", user.id)
        .maybeSingle();
      const profile = profileRaw as ProfileRow | null;

      if (cancelled) return;

      const meta = user.user_metadata as Record<string, string | undefined> | undefined;
      setUser({
        id: user.id,
        email: user.email ?? "",
        name:
          profile?.name ??
          meta?.full_name ??
          meta?.name ??
          meta?.given_name ??
          "",
        role: profile?.role ?? "client",
        avatarUrl: profile?.avatar_url ?? meta?.avatar_url ?? meta?.picture,
        phone: profile?.phone ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, setUser]);

  return <>{children}</>;
}
