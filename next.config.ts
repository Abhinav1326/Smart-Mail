import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don’t fail production builds on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
