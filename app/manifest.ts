import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "BAAGAY", short_name: "BAAGAY", description: "Modern hand-tied Bandhani from Gujarat.", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#2F5D33", icons: [{ src: "/brand/baagay-logo.svg", sizes: "any", type: "image/svg+xml" }] }; }
