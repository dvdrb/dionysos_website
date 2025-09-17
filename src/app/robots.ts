import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/_next/",
          "/static/",
          "/*?*", // avoid crawling search/query duplicates
          "/ro/login",
          "/ru/login",
          "/ro/dashboard",
          "/ru/dashboard",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}

