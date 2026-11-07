import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Sitemap — jen veřejné stránky (přihlášená část se neindexuje). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/vyrobci", priority: 0.9, freq: "weekly" },
    { path: "/blog", priority: 0.9, freq: "weekly" },
    { path: "/tarify", priority: 0.8, freq: "monthly" },
    { path: "/napoveda", priority: 0.7, freq: "monthly" },
    { path: "/podminky", priority: 0.4, freq: "monthly" },
    { path: "/gdpr", priority: 0.4, freq: "monthly" },
  ];
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
