import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  articleFrontmatterSchema,
  guideFrontmatterSchema,
  type ArticleFrontmatter,
  type GuideFrontmatter,
} from "@/lib/content/schema";

const contentRoot = path.join(process.cwd(), "src/content");
const knowledgeDir = path.join(contentRoot, "knowledge");
const countriesDir = path.join(contentRoot, "countries");
const industriesDir = path.join(contentRoot, "industries");

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ArticleMeta extends ArticleFrontmatter {
  wordCount: number;
}

export interface Article extends ArticleMeta {
  content: string;
  headings: TocHeading[];
}

export interface GuideMeta extends GuideFrontmatter {
  wordCount: number;
  guideType: "country" | "industry";
}

export interface Guide extends GuideMeta {
  content: string;
  headings: TocHeading[];
}

function mdxFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .sort();
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getWordCount(content: string) {
  return content
    .replace(/---[\s\S]*?---/, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function calculateReadingTime(content: string) {
  return Math.max(1, Math.ceil(getWordCount(content) / 225));
}

function stripDuplicateH1(content: string, title: string) {
  const lines = content.split(/\r?\n/);
  const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentLine === -1) return content;

  const firstLine = lines[firstContentLine].trim();
  if (firstLine === `# ${title}`) {
    lines.splice(firstContentLine, 1);
  }
  return lines.join("\n").trimStart();
}

export function extractHeadings(content: string): TocHeading[] {
  const seen = new Map<string, number>();

  return content
    .split(/\r?\n/)
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
      if (!match) return null;

      const text = match[2].replace(/\{#.+\}$/, "").trim();
      const baseId = slugifyHeading(text);
      const count = seen.get(baseId) ?? 0;
      seen.set(baseId, count + 1);

      return {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        text,
        level: match[1].length as 2 | 3,
      };
    })
    .filter((heading): heading is TocHeading => Boolean(heading));
}

function readArticleFile(filePath: string, category: string): Article {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");
  const readingTime = calculateReadingTime(parsed.content);
  const frontmatter = articleFrontmatterSchema.parse({
    ...parsed.data,
    slug: parsed.data.slug ?? fileSlug,
    category: parsed.data.category ?? category,
    readingTime,
  });

  if (frontmatter.slug !== fileSlug) {
    throw new Error(`${filePath}: frontmatter slug "${frontmatter.slug}" must match file name "${fileSlug}"`);
  }

  if (frontmatter.category !== category) {
    throw new Error(`${filePath}: frontmatter category "${frontmatter.category}" must match directory "${category}"`);
  }

  const content = stripDuplicateH1(parsed.content, frontmatter.title);

  return {
    ...frontmatter,
    wordCount: getWordCount(content),
    readingTime,
    content,
    headings: extractHeadings(content),
  };
}

function readGuideFile(filePath: string, guideType: "country" | "industry"): Guide {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");
  const readingTime = calculateReadingTime(parsed.content);
  const frontmatter = guideFrontmatterSchema.parse({
    ...parsed.data,
    slug: parsed.data.slug ?? fileSlug,
    guideType,
    readingTime,
  });

  if (frontmatter.slug !== fileSlug) {
    throw new Error(`${filePath}: frontmatter slug "${frontmatter.slug}" must match file name "${fileSlug}"`);
  }

  const content = stripDuplicateH1(parsed.content, frontmatter.title);

  return {
    ...frontmatter,
    guideType,
    wordCount: getWordCount(content),
    readingTime,
    content,
    headings: extractHeadings(content),
  };
}

export function getArticlesByCategory(category: string, includeDrafts = false): ArticleMeta[] {
  const dir = path.join(knowledgeDir, category);
  if (!fs.existsSync(dir)) return [];

  return mdxFiles(dir)
    .map((file) => readArticleFile(path.join(dir, file), category))
    .filter((article) => includeDrafts || !article.draft)
    .map((article) => {
      const meta = { ...article } as Partial<Article>;
      delete meta.content;
      delete meta.headings;
      return meta as ArticleMeta;
    });
}

export function getArticle(category: string, slug: string, includeDrafts = false): Article | null {
  const filePath = path.join(knowledgeDir, category, `${slug}.mdx`);
  const fallback = path.join(knowledgeDir, category, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;

  const article = readArticleFile(target, category);
  if (article.draft && !includeDrafts) return null;
  return article;
}

export function getAllArticles(includeDrafts = false): ArticleMeta[] {
  return getAllCategories().flatMap((category) => getArticlesByCategory(category, includeDrafts));
}

export function getAllCategories(): string[] {
  if (!fs.existsSync(knowledgeDir)) return [];
  return fs
    .readdirSync(knowledgeDir)
    .filter((file) => fs.statSync(path.join(knowledgeDir, file)).isDirectory())
    .sort();
}

export function getArticleBySlug(slug: string, includeDrafts = false): Article | null {
  const categories = getAllCategories();
  for (const category of categories) {
    const article = getArticle(category, slug, includeDrafts);
    if (article) return article;
  }
  return null;
}

export function getRelatedArticles(slugs: string[]) {
  if (slugs.length === 0) return [];
  const articles = getAllArticles(true);
  return slugs
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter((article): article is ArticleMeta => Boolean(article));
}

export function getCountryGuide(slug: string, includeDrafts = false): Guide | null {
  const filePath = path.join(countriesDir, `${slug}.mdx`);
  const fallback = path.join(countriesDir, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;

  const guide = readGuideFile(target, "country");
  if (guide.draft && !includeDrafts) return null;
  return guide;
}

export function getCountryGuides(includeDrafts = false): GuideMeta[] {
  return mdxFiles(countriesDir)
    .map((file) => readGuideFile(path.join(countriesDir, file), "country"))
    .filter((guide) => includeDrafts || !guide.draft)
    .map((guide) => {
      const meta = { ...guide } as Partial<Guide>;
      delete meta.content;
      delete meta.headings;
      return meta as GuideMeta;
    });
}

export function getIndustryGuide(slug: string, includeDrafts = false): Guide | null {
  const filePath = path.join(industriesDir, `${slug}.mdx`);
  const fallback = path.join(industriesDir, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;

  const guide = readGuideFile(target, "industry");
  if (guide.draft && !includeDrafts) return null;
  return guide;
}

export function getIndustryGuides(includeDrafts = false): GuideMeta[] {
  return mdxFiles(industriesDir)
    .map((file) => readGuideFile(path.join(industriesDir, file), "industry"))
    .filter((guide) => includeDrafts || !guide.draft)
    .map((guide) => {
      const meta = { ...guide } as Partial<Guide>;
      delete meta.content;
      delete meta.headings;
      return meta as GuideMeta;
    });
}

export function validateGuideFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");

  return guideFrontmatterSchema.parse({
    ...parsed.data,
    slug: parsed.data.slug ?? fileSlug,
    readingTime: calculateReadingTime(parsed.content),
  });
}

export const CONTENT_PATHS = {
  root: contentRoot,
  knowledge: knowledgeDir,
  countries: countriesDir,
  industries: industriesDir,
};
