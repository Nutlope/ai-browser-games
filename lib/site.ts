/** Absolute site origin, used for metadata, OG images, robots, and sitemap. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const siteName = "AI Browser Games";
export const siteDescription =
  "Eight AI models built the same three browser games. Browse them, play them, and see what each one cost.";
