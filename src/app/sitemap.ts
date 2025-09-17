import type { MetadataRoute } from "next";

const locales = ["ro", "ru"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const paths = ["", "/menu"]; // Core public routes per locale

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of paths) {
      entries.push({
        url: `${site}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }
  return entries;
}

