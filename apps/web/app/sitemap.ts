import type { MetadataRoute } from "next";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
} from "@/lib/content/institutional-web";
import { getPublicSiteUrl } from "@/lib/content/site-url";

const SITE_URL = getPublicSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/como-funciona`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/fleteros`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
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
