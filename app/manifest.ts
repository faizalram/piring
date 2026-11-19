import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Piring",
    short_name: "Piring",
    description: "Photograph your meal, get calories, protein, carbs and fat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eef2ec",
    theme_color: "#eef2ec",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
