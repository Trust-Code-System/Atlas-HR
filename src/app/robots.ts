import type { MetadataRoute } from "next";

// Read the public URL directly (not via validated `env`) so this route never
// depends on full server-env validation. See root layout note.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep the authenticated app, auth flows, and API surfaces out of the index.
        disallow: [
          "/api/",
          "/dashboard",
          "/settings",
          "/org/",
          "/portal/",
          "/copilot",
          "/analytics",
          "/demo",
          "/sign-in",
          "/sign-up",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/invites/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
