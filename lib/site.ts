/** The canonical production origin. Preview and production deployments both
 * resolve metadata against this domain unless NEXT_PUBLIC_SITE_URL overrides it.
 * Never fall back to VERCEL_URL: per-deploy preview URLs sit behind Vercel's
 * deployment protection, so crawlers (Slack, Twitter) get a 401 for the OG
 * image and the link preview silently drops it. */
const PRODUCTION_SITE_URL = "https://www.aibrowsergames.io";

/** Absolute site origin, used for metadata, OG images, robots, and sitemap. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000");

export const siteName = "AI Browser Games";
export const siteDescription =
  "Eight AI models built the same three browser games. Browse them, play them, and see what each one cost.";
