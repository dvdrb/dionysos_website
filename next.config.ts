import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Derive Supabase storage hostname from env at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost: string | undefined;
try {
  if (supabaseUrl) {
    supabaseHost = new URL(supabaseUrl).hostname;
  }
} catch {}

const nextConfig: NextConfig = {
  // Locale routing is handled via middleware (src/middleware.ts)
  // Remove next-intl plugin to avoid invalid route patterns in Next 15.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // cache optimized images for 1 day
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https",
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            } as const,
            {
              protocol: "https",
              hostname: supabaseHost,
              pathname: "/storage/v1/render/image/public/**",
            } as const,
          ]
        : []),
    ],
  },
  experimental: {
    // Prevent serverless tracing from bundling large local assets
    outputFileTracingExcludes: {
      '*': [
        'public/menu/**',
      ],
    },
  },
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
