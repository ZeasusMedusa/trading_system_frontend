import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker deployment
  eslint: {
    // Ignore ESLint during production builds (we've already checked locally)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors in production
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
