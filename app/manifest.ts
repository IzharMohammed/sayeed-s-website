import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Karigar Workshop",
    short_name: "Karigar",
    description: "Simple order and workshop tracking for shop owners and workers",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7f5",
    theme_color: "#176b4a",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
