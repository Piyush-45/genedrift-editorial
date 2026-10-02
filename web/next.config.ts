import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Catalyst Stratus serves published media; add its host before using next/image with it.
  images: { remotePatterns: [] },
};

export default nextConfig;
