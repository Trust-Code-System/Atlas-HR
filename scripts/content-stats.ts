import fs from "fs";
import path from "path";
import matter from "gray-matter";
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

const stats = {
  totalArticles: 0,
  totalGuides: 0,
  drafts: 0,
  reviewed: 0,
  words: 0,
  byCategory: new Map<string, number>(),
  articlesUnderTarget: [] as { slug: string; words: number }[],
  countryGuidesUnderTarget: [] as { slug: string; words: number }[],
  industryGuidesUnderTarget: [] as { slug: string; words: number }[],
};

for (const categoryDir of fs.existsSync(knowledgeDir) ? fs.readdirSync(knowledgeDir) : []) {
  const fullCategoryDir = path.join(knowledgeDir, categoryDir);
  if (!fs.statSync(fullCategoryDir).isDirectory()) continue;

  for (const filePath of mdxFiles(fullCategoryDir)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = articleFrontmatterSchema.parse({
      ...parsed.data,
      slug: parsed.data.slug ?? path.basename(filePath).replace(/\.mdx?$/, ""),
      category: parsed.data.category ?? categoryDir,
      readingTime: readingTime(parsed.content),
    });

    const words = wordCount(parsed.content);
    stats.totalArticles += 1;
    stats.words += words;
    stats.byCategory.set(data.category, (stats.byCategory.get(data.category) ?? 0) + 1);
    if (data.draft) stats.drafts += 1;
    if (data.reviewedBy?.trim()) stats.reviewed += 1;
    if (words < 1500) stats.articlesUnderTarget.push({ slug: data.slug, words });
  }
}

for (const guideDir of [countriesDir, industriesDir]) {
  for (const filePath of mdxFiles(guideDir)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = guideFrontmatterSchema.parse({
      ...parsed.data,
      slug: parsed.data.slug ?? path.basename(filePath).replace(/\.mdx?$/, ""),
      readingTime: readingTime(parsed.content),
    });
    const words = wordCount(parsed.content);
    stats.totalGuides += 1;
    stats.words += words;
    if (guideDir === countriesDir && words < 4000) stats.countryGuidesUnderTarget.push({ slug: data.slug, words });
    if (guideDir === industriesDir && words < 2500) stats.industryGuidesUnderTarget.push({ slug: data.slug, words });
  }
}

console.log(`Total articles: ${stats.totalArticles}`);
console.log(`Total guides: ${stats.totalGuides}`);
console.log(`Drafts: ${stats.drafts}`);
console.log(`Reviewed: ${stats.reviewed}`);
console.log(`Pending expert review: ${stats.totalArticles + stats.totalGuides - stats.reviewed}`);
console.log(`Total words: ${stats.words.toLocaleString()}`);
console.log("By category:");

for (const [category, count] of [...stats.byCategory.entries()].sort()) {
  console.log(`- ${category}: ${count}`);
}

console.log("Phase B word-count target warnings:");
console.log(`- Articles under 1,500 words: ${stats.articlesUnderTarget.length}`);
stats.articlesUnderTarget.slice(0, 20).forEach((item) => console.log(`  - ${item.slug}: ${item.words}`));
if (stats.articlesUnderTarget.length > 20) console.log(`  - ...${stats.articlesUnderTarget.length - 20} more`);
console.log(`- Country guides under 4,000 words: ${stats.countryGuidesUnderTarget.length}`);
stats.countryGuidesUnderTarget.forEach((item) => console.log(`  - ${item.slug}: ${item.words}`));
console.log(`- Industry guides under 2,500 words: ${stats.industryGuidesUnderTarget.length}`);
stats.industryGuidesUnderTarget.forEach((item) => console.log(`  - ${item.slug}: ${item.words}`));
