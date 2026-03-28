import type { NextConfig } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mintkit.vercel.app";

const nextSitemapConfig = {
  siteUrl: BASE_URL,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
  },
  exclude: ["/api/*"],
};

export default nextSitemapConfig;
