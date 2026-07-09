import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vegas Trip Expense & Casino Tracker",
    short_name: "Vegas Tracker",
    description: "Track trip expenses and casino sessions during your trip to Las Vegas",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
