import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/content/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding/", "/dashboard", "/shipment", "/tracking", "/profile", "/settings"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
