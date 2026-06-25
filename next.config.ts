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
