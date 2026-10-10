import type { MetadataRoute } from "next";
import { CITIES } from "@/game/data/world";

/** Lets players install ModeQuest to their home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ModeQuest: Naija",
    short_name: "ModeQuest",
    description: `Hustle, learn, dodge scams and grow your money in ${CITIES.length} real Nigerian cities. Free.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f5f7ff",
    theme_color: "#1447e6",
    categories: ["education", "games"],
    lang: "en-NG",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
