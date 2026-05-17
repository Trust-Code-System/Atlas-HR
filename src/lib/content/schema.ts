import { z } from "zod";
import { HR_CATEGORY_SLUGS } from "../constants";

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isoDateString = z.preprocess((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date in YYYY-MM-DD format"));

const stringArray = z.array(z.string().min(1));

export const articleFrontmatterSchema = z.object({
  title: z.string().min(4),
  slug: z.string().regex(kebabCase, "Slug must use kebab-case"),
  category: z.enum(HR_CATEGORY_SLUGS as [string, ...string[]]),
  excerpt: z.string().min(140).max(200),
  author: z.string().min(1).default("Atlas HR Editorial Team"),
  reviewedBy: z.string().optional().default(""),
  reviewedAt: isoDateString.optional(),
  publishedAt: isoDateString,
  updatedAt: isoDateString,
  readingTime: z.number().int().positive(),
  tags: stringArray.min(3).max(8),
  relatedArticles: stringArray.default([]),
  relatedTools: stringArray.default([]),
  relatedTemplates: stringArray.default([]),
  countries: stringArray.default(["global"]),
  industries: stringArray.default(["all"]),
  seoTitle: z.string().min(10).max(70).optional(),
  seoDescription: z.string().min(50).max(180).optional(),
  heroImage: z.string().startsWith("/content-images/").optional(),
  draft: z.boolean().default(false),
});

export const guideFrontmatterSchema = articleFrontmatterSchema
  .omit({ category: true, relatedArticles: true })
  .extend({
    category: z.string().optional(),
    guideType: z.enum(["country", "industry"]).optional(),
    relatedArticles: stringArray.default([]),
  });

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>;
