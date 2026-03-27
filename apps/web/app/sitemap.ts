import type { MetadataRoute } from "next";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
} from "@/lib/content/institutional-web";

const SITE_URL = "https://fletaya.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const companyRoutes: MetadataRoute.Sitemap = FOOTER_COMPANY_LINKS.map((item) => ({
    url: `${SITE_URL}${item.href}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const legalRoutes: MetadataRoute.Sitemap = FOOTER_LEGAL_LINKS.map((item) => ({
    url: `${SITE_URL}${item.href}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...baseRoutes, ...companyRoutes, ...legalRoutes];
}
