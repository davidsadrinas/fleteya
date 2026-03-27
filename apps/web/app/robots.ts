import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding/"],
    },
    sitemap: "https://fletaya.com.ar/sitemap.xml",
    host: "https://fletaya.com.ar",
  };
}
