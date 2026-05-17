import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { calculateReadingTime, extractHeadings, type TocHeading } from "./mdx";

const helpDir = path.join(process.cwd(), "src/content/help");

export const HELP_CATEGORIES = [
  { slug: "getting-started", label: "Getting started" },
  { slug: "billing", label: "Billing & plans" },
  { slug: "tools", label: "Tools & documents" },
  { slug: "copilot", label: "Atlas Copilot" },
  { slug: "hris", label: "Mini-HRIS & teams" },
  { slug: "account", label: "Account & settings" },
  { slug: "troubleshooting", label: "Troubleshooting" },
] as const;

export type HelpCategorySlug = (typeof HELP_CATEGORIES)[number]["slug"];

const helpFrontmatterSchema = z.object({
  title: z.string().min(4),
  slug: z.string(),
  category: z.string(),
  description: z.string(),
  updatedAt: z.string(),
});

export type HelpArticleMeta = z.infer<typeof helpFrontmatterSchema> & {
  readingTime: number;
};

export type HelpArticle = HelpArticleMeta & {
  content: string;
  headings: TocHeading[];
};

export function getAllHelpArticles(): HelpArticleMeta[] {
  if (!fs.existsSync(helpDir)) return [];
  return fs
    .readdirSync(helpDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(helpDir, file), "utf8");
      const parsed = matter(raw);
      const fileSlug = file.replace(/\.mdx?$/, "");
      const readingTime = calculateReadingTime(parsed.content);
      const fm = helpFrontmatterSchema.parse({ ...parsed.data, slug: parsed.data.slug ?? fileSlug });
      return { ...fm, readingTime };
    });
}

export function getHelpArticle(slug: string): HelpArticle | null {
  const mdx = path.join(helpDir, `${slug}.mdx`);
  const md = path.join(helpDir, `${slug}.md`);
  const filePath = fs.existsSync(mdx) ? mdx : fs.existsSync(md) ? md : null;
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const readingTime = calculateReadingTime(parsed.content);
  const fm = helpFrontmatterSchema.parse({ ...parsed.data, slug: parsed.data.slug ?? slug });

  return {
    ...fm,
    readingTime,
    content: parsed.content,
    headings: extractHeadings(parsed.content),
  };
}

export function getHelpArticlesByCategory(categorySlug: string): HelpArticleMeta[] {
  return getAllHelpArticles().filter((a) => a.category === categorySlug);
}
