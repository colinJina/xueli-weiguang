import type { NextConfig } from "next";

import { getCosCoverImagePatterns } from "./src/lib/storage/cos/image-patterns";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BROWSER_TEST === "1" ? ".next-browser" : ".next",
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/api/push/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/internal/push/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...getCosCoverImagePatterns({
        COS_CDN_DOMAIN: process.env.COS_CDN_DOMAIN,
        COS_BUCKET: process.env.COS_BUCKET,
        COS_REGION: process.env.COS_REGION,
      }),
      {
        hostname: "**.hdslb.com",
        protocol: "https",
      },
      {
        hostname: "**.hdslb.com",
        protocol: "http",
      },
      {
        hostname: "yt3.ggpht.com",
        protocol: "https",
      },
      {
        hostname: "**.googleusercontent.com",
        protocol: "https",
      },
      {
        hostname: "i.ytimg.com",
        protocol: "https",
      },
    ],
  },
  webpack(config) {
    const assetRule = config.module.rules.find((rule: { test?: RegExp }) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      {
        ...assetRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: assetRule?.issuer,
        resourceQuery: { not: [...(assetRule?.resourceQuery?.not ?? []), /url/] },
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
              svgoConfig: {
                plugins: [
                  {
                    name: "removeViewBox",
                    active: false,
                  },
                ],
              },
            },
          },
        ],
      },
    );

    if (assetRule) {
      assetRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;
