import type { MetadataRoute } from "next";
import { isLaunchReady, siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!isLaunchReady) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${siteConfig.domain}/sitemap.xml`,
    host: siteConfig.domain,
  };
}
