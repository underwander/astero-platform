import type { MetadataRoute } from "next";
import { isLaunchReady, siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isLaunchReady) return [];
  const pages = ["", "/privacy", "/cookies", "/terms", "/disclaimer"] as const;
  const lastModified = siteConfig.seo.lastUpdated ? new Date(siteConfig.seo.lastUpdated) : undefined;

  return pages.map((path) => ({
    url: `${siteConfig.domain}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: path ? "yearly" : "monthly",
    priority: path ? 0.2 : 1,
  }));
}
