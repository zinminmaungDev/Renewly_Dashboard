import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are stable in 15, this just raises the payload ceiling
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
