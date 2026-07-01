import type { MetadataRoute } from "next";
import {
  COUNTRY_HUBS,
  INDUSTRY_HUBS,
  WORKFLOW_BUNDLES,
  COMPARISON_PAGES,
} from "@/lib/public-resource-data";
import { getAllArticles } from "@/lib/mdx";

// Read the public URL directly (not via validated `env`) so this route never
// depends on full server-env validation. See root layout note.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/pricing",
    "/trust",
    "/privacy",
    "/terms",
    "/gdpr",
    "/features",
    "/glossary",
    "/knowledge",
    "/templates",
    "/tools",
    "/countries",
    "/industries",
    "/workflows",
    "/compliance-updates",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const countryRoutes = COUNTRY_HUBS.map((c) => ({
    url: `${SITE_URL}/countries/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const industryRoutes = INDUSTRY_HUBS.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const workflowRoutes = WORKFLOW_BUNDLES.map((w) => ({
    url: `${SITE_URL}/workflows/${w.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const compareRoutes = COMPARISON_PAGES.map((p) => ({
    url: `${SITE_URL}/compare/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const articleRoutes = getAllArticles().map((a) => ({
    url: `${SITE_URL}/knowledge/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const legalRoutes = ["cookies", "dpa", "acceptable-use"].map((slug) => ({
    url: `${SITE_URL}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [
    ...staticRoutes,
    ...countryRoutes,
    ...industryRoutes,
    ...workflowRoutes,
    ...compareRoutes,
    ...articleRoutes,
    ...legalRoutes,
  ];
}
