const FALLBACK_SITE_URL = "https://fletaya.com.ar";

export function getPublicSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!envUrl) return FALLBACK_SITE_URL;
  return envUrl.replace(/\/$/, "");
}
