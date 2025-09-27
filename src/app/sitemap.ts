import type { MetadataRoute } from "next";

const locales = ["ro", "ru", "en"] as const;
const menus = [
  "taverna",
  "bar",
  "sushi",
  "sushi-restaurant-sushi",
  "sushi-restaurant-burger-kebab",
  "sushi-restaurant-fries",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dionysos.md";
  const paths = ["", "/menu", ...menus.map((m) => `/menu/${m}`)];

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
