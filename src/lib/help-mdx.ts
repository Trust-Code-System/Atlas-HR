import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { calculateReadingTime, extractHeadings, getWordCount } from "./mdx";
import type { TocHeading } from "./mdx";

const helpDir = path.join(process.cwd(), "src/content/help");

const HELP_CATEGORIES = [
  "getting-started",
  "billing",
  "workspace",
  "tools",
  "employee-portal",
  "copilot",
  "privacy",
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

const helpFrontmatterSchema = z.object({
  title: z.string().min(4),
  slug: z.string(),
  category: z.enum(HELP_CATEGORIES),
  excerpt: z.string().min(10),
  publishedAt: z.string(),
  updatedAt: z.string(),
  relatedArticles: z.array(z.string()).default([]),
});

export type HelpFrontmatter = z.infer<typeof helpFrontmatterSchema>;

export interface HelpArticleMeta extends HelpFrontmatter {
  wordCount: number;
  readingTime: number;
}

export interface HelpArticle extends HelpArticleMeta {
  content: string;
  headings: TocHeading[];
}

export const HELP_CATEGORY_LABELS: Record<HelpCategory, string> = {
  "getting-started": "Getting Started",
  billing: "Billing & Plans",
  workspace: "Workspace",
  tools: "Tools & Documents",
  "employee-portal": "Employee Portal",
  copilot: "Atlas Copilot",
  privacy: "Privacy & Security",
};

function mdxFilesInDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();
}

function stripDuplicateH1(content: string, title: string): string {
  const lines = content.split(/\r?\n/);
  const first = lines.findIndex((l) => l.trim().length > 0);
  if (first === -1) return content;
  if (lines[first].trim() === `# ${title}`) lines.splice(first, 1);
  return lines.join("\n").trimStart();
}

function readHelpFile(filePath: string): HelpArticle {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");
  const readingTime = calculateReadingTime(parsed.content);

  const frontmatter = helpFrontmatterSchema.parse({
    ...parsed.data,
    slug: parsed.data.slug ?? fileSlug,
    readingTime,
  });

  const content = stripDuplicateH1(parsed.content, frontmatter.title);

  return {
    ...frontmatter,
    wordCount: getWordCount(content),
    readingTime,
    content,
    headings: extractHeadings(content),
  };
}

export function getAllHelpCategories(): HelpCategory[] {
  return HELP_CATEGORIES.filter((cat) =>
    fs.existsSync(path.join(helpDir, cat))
  );
}

export function getHelpArticlesByCategory(category: HelpCategory): HelpArticleMeta[] {
  const dir = path.join(helpDir, category);
  if (!fs.existsSync(dir)) return [];

  return mdxFilesInDir(dir)
    .map((file) => {
      const article = readHelpFile(path.join(dir, file));
      const { content, headings, ...meta } = article;
      void content;
      void headings;
      return meta;
    });
}

export function getAllHelpArticles(): HelpArticleMeta[] {
  return getAllHelpCategories().flatMap((cat) => getHelpArticlesByCategory(cat));
}

export function getHelpArticleBySlug(slug: string): HelpArticle | null {
  for (const category of HELP_CATEGORIES) {
    const filePath = path.join(helpDir, category, `${slug}.mdx`);
    const fallback = path.join(helpDir, category, `${slug}.md`);
    const target = fs.existsSync(filePath)
      ? filePath
      : fs.existsSync(fallback)
      ? fallback
      : null;

    if (target) {
      return readHelpFile(target);
    }
  }
  return null;
}

export function getHelpRelatedArticles(slugs: string[]): HelpArticleMeta[] {
  if (slugs.length === 0) return [];
  const all = getAllHelpArticles();
  return slugs
    .map((slug) => all.find((a) => a.slug === slug))
    .filter((a): a is HelpArticleMeta => Boolean(a));
}

export { HELP_CATEGORIES };
