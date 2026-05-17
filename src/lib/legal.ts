import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { extractHeadings, getWordCount, type TocHeading } from "@/lib/mdx";

const legalDir = path.join(process.cwd(), "src/content/legal");

export const legalSlugs = ["terms", "privacy", "cookies", "acceptable-use", "dpa"] as const;
export type LegalSlug = (typeof legalSlugs)[number];

export const legalFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  effectiveDate: z.string(),
  lastUpdated: z.string(),
  version: z.string(),
  draft: z.boolean(),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
});

export type LegalFrontmatter = z.infer<typeof legalFrontmatterSchema>;

export type LegalDocument = LegalFrontmatter & {
  content: string;
  headings: TocHeading[];
  wordCount: number;
};

export function getLegalDocument(slug: LegalSlug): LegalDocument {
  const filePath = path.join(legalDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = legalFrontmatterSchema.parse(parsed.data);

  if (frontmatter.slug !== slug) {
    throw new Error(`${filePath}: frontmatter slug must match file name`);
  }

  return {
    ...frontmatter,
    content: parsed.content.trim(),
    headings: extractHeadings(parsed.content),
    wordCount: getWordCount(parsed.content),
  };
}

export function getAllLegalDocuments() {
  return legalSlugs.map((slug) => getLegalDocument(slug));
}

export function formatLegalDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
