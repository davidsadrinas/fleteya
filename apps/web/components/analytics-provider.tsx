"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    getPostHog();
  }, []);

  useEffect(() => {
    getPostHog().then((posthog) => {
      if (posthog && pathname) {
        let url = window.origin + pathname;
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
        posthog.capture("$pageview", { $current_url: url });
      }
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
