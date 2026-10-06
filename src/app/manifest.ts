import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#050505",
    description: "收藏与浏览 PV",
    display: "standalone",
    icons: [
      {
        src: "/icons/app-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/app-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    id: "/",
    name: "雪笠微光",
    short_name: "雪笠微光",
    start_url: "/",
    theme_color: "#050505",
  };
}
