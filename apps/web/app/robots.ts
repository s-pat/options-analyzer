import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://optionslab.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/landing", "/waitlist", "/"],
        disallow: [
          "/dashboard",
          "/screener",
          "/options",
          "/today",
          "/backtest",
          "/learn",
          "/strategies",
          "/gate",
          "/design",
          "/sign-in",
          "/sign-up",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
