import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ZodError } from "zod";
import { articleFrontmatterSchema, guideFrontmatterSchema } from "../src/lib/content/schema";

const contentRoot = path.join(process.cwd(), "src/content");
const knowledgeDir = path.join(contentRoot, "knowledge");
const countriesDir = path.join(contentRoot, "countries");
const industriesDir = path.join(contentRoot, "industries");

function mdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) return mdxFiles(fullPath);
    return entry.endsWith(".mdx") || entry.endsWith(".md") ? [fullPath] : [];
  });
}

function wordCount(content: string) {
  return content
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(wordCount(content) / 225));
}

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "frontmatter"}: ${issue.message}`).join("; ");
}

const errors: string[] = [];

for (const categoryDir of fs.existsSync(knowledgeDir) ? fs.readdirSync(knowledgeDir) : []) {
  const fullCategoryDir = path.join(knowledgeDir, categoryDir);
  if (!fs.statSync(fullCategoryDir).isDirectory()) continue;

  for (const filePath of mdxFiles(fullCategoryDir)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");
    const result = articleFrontmatterSchema.safeParse({
      ...parsed.data,
      slug: parsed.data.slug ?? fileSlug,
      category: parsed.data.category ?? categoryDir,
      readingTime: readingTime(parsed.content),
    });

    if (!result.success) {
      errors.push(`${filePath}: ${formatZodError(result.error)}`);
      continue;
    }

    if (result.data.slug !== fileSlug) {
      errors.push(`${filePath}: slug "${result.data.slug}" must match file name "${fileSlug}"`);
    }

    if (result.data.category !== categoryDir) {
      errors.push(`${filePath}: category "${result.data.category}" must match directory "${categoryDir}"`);
    }
  }
}

for (const guideDir of [countriesDir, industriesDir]) {
  for (const filePath of mdxFiles(guideDir)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const fileSlug = path.basename(filePath).replace(/\.mdx?$/, "");
    const result = guideFrontmatterSchema.safeParse({
      ...parsed.data,
      slug: parsed.data.slug ?? fileSlug,
      readingTime: readingTime(parsed.content),
    });

    if (!result.success) {
      errors.push(`${filePath}: ${formatZodError(result.error)}`);
      continue;
    }

    if (result.data.slug !== fileSlug) {
      errors.push(`${filePath}: slug "${result.data.slug}" must match file name "${fileSlug}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Content validation passed.");
