import type { MetadataRoute } from "next";
import { gameDefinitions } from "@/lib/games";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", ...gameDefinitions.map((game) => `/${game.slug}`)];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8
  }));
}
