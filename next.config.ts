import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Locale routing is handled via middleware (src/middleware.ts)
  // Remove next-intl plugin to avoid invalid route patterns in Next 15.
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
