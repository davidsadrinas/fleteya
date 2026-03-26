"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useSession } from "@/lib/hooks";
import { shouldRedirectToOnboarding } from "@/lib/onboarding/status";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || profileError || !profile) return;

      let driverId: string | null = null;
      if (profile.role === "driver") {
        const { data: driverRow } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        driverId = driverRow?.id ?? null;
      }

      if (cancelled) return;

      if (
        shouldRedirectToOnboarding(
          { phone: profile.phone, role: profile.role },
          driverId
        )
      ) {
        router.replace("/onboarding");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, router, pathname]);

  return <>{children}</>;
}
