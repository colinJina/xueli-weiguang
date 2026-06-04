import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "**.hdslb.com",
        protocol: "https",
      },
      {
        hostname: "**.hdslb.com",
        protocol: "http",
      },
    ],
  },
};

export default nextConfig;
