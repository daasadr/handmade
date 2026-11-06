import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt. Veřejné marketingové stránky povolit, přihlášenou/chráněnou část
 * a API zakázat indexovat (nemá to v Googlu co dělat a jsou za přihlášením).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/profile", "/products", "/admin", "/auth", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
