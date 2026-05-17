import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CATEGORY_DESCRIPTIONS } from "../src/lib/category-descriptions";
import { HR_CATEGORIES } from "../src/lib/constants";
import { TEMPLATES } from "../src/lib/templates-data";
import { TOOLS_CONFIG } from "../src/lib/tools-config";

interface Doc {
  slug: string;
  category: string;
  filePath: string;
  title: string;
  excerpt: string;
  body: string;
  relatedArticles: string[];
  relatedTools: string[];
  relatedTemplates: string[];
}

const contentRoot = path.join(process.cwd(), "src", "content");
const knowledgeRoot = path.join(contentRoot, "knowledge");
const countriesRoot = path.join(contentRoot, "countries");
const industriesRoot = path.join(contentRoot, "industries");
const knownTools = new Set(TOOLS_CONFIG.map((tool) => tool.slug));
const knownTemplates = new Set(TEMPLATES.flatMap((template) => [template.slug, ...(template.aliases ?? [])]));
const knownCategories = new Set<string>(HR_CATEGORIES.map((category) => category.slug));

function walkMdx(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) return walkMdx(fullPath);
    return entry.endsWith(".mdx") ? [fullPath] : [];
  });
}

function readDocs(): Doc[] {
  const readDoc = (filePath: string): Doc => {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const parent = path.basename(path.dirname(filePath));
    const isGuide = parent === "countries" || parent === "industries";
    const category = isGuide ? parent : parent;
    const slug = String(parsed.data.slug ?? path.basename(filePath, ".mdx"));

    return {
      slug,
      category,
      filePath,
      title: String(parsed.data.title ?? slug),
      excerpt: String(parsed.data.excerpt ?? ""),
      body: parsed.content,
      relatedArticles: Array.isArray(parsed.data.relatedArticles) ? parsed.data.relatedArticles : [],
      relatedTools: Array.isArray(parsed.data.relatedTools) ? parsed.data.relatedTools : [],
      relatedTemplates: Array.isArray(parsed.data.relatedTemplates) ? parsed.data.relatedTemplates : [],
    };
  };

  return [...walkMdx(knowledgeRoot), ...walkMdx(countriesRoot), ...walkMdx(industriesRoot)].map(readDoc);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function vectorize(docs: Doc[]) {
  const docTokens = docs.map((doc) => tokenize(`${doc.title} ${doc.excerpt} ${doc.body.slice(0, 1200)}`));
  const documentFrequency = new Map<string, number>();

  for (const tokens of docTokens) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  return docTokens.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);

    const vector = new Map<string, number>();
    for (const [token, count] of counts) {
      const idf = Math.log((docs.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, count * idf);
    }
    return vector;
  });
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (const value of a.values()) aMagnitude += value * value;
  for (const value of b.values()) bMagnitude += value * value;
  for (const [token, value] of a) dot += value * (b.get(token) ?? 0);

  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude) || 1);
}

function main() {
  const docs = readDocs();
  const knowledgeDocs = docs.filter((doc) => knownCategories.has(doc.category));
  const articleSlugs = new Set(docs.map((doc) => doc.slug));
  const inbound = new Map(knowledgeDocs.map((doc) => [doc.slug, 0]));
  const vectors = vectorize(docs);
  const broken: string[] = [];
  const suggestions: { slug: string; related: string[] }[] = [];

  docs.forEach((doc, index) => {
    doc.relatedArticles.forEach((slug) => {
      if (articleSlugs.has(slug)) inbound.set(slug, (inbound.get(slug) ?? 0) + 1);
      else broken.push(`${path.relative(process.cwd(), doc.filePath)}: missing related article "${slug}"`);
    });

    doc.relatedTools.forEach((slug) => {
      if (!knownTools.has(slug)) broken.push(`${path.relative(process.cwd(), doc.filePath)}: missing related tool "${slug}"`);
    });

    doc.relatedTemplates.forEach((slug) => {
      if (!knownTemplates.has(slug)) broken.push(`${path.relative(process.cwd(), doc.filePath)}: missing related template "${slug}"`);
    });

    if (knownCategories.has(doc.category) && doc.relatedArticles.length < 3) {
      const related = knowledgeDocs
        .map((other) => ({
          slug: other.slug,
          score: other.slug === doc.slug ? -1 : cosine(vectors[index], vectors[docs.indexOf(other)]),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => item.slug);
      suggestions.push({ slug: doc.slug, related });
    }
  });

  Object.entries(CATEGORY_DESCRIPTIONS).forEach(([category, description]) => {
    if (!knownCategories.has(category)) broken.push(`category-descriptions.ts: unknown category "${category}"`);

    description.featured.forEach((slug) => {
      if (!articleSlugs.has(slug)) broken.push(`category-descriptions.ts:${category}: missing featured article "${slug}"`);
    });
    description.relatedTools.forEach((slug) => {
      if (!knownTools.has(slug)) broken.push(`category-descriptions.ts:${category}: missing related tool "${slug}"`);
    });
    description.relatedTemplates.forEach((slug) => {
      if (!knownTemplates.has(slug)) broken.push(`category-descriptions.ts:${category}: missing related template "${slug}"`);
    });
  });

  const orphans = [...inbound.entries()].filter(([, count]) => count === 0).map(([slug]) => slug);

  console.log(`Content documents checked: ${docs.length}`);
  console.log(`Broken references: ${broken.length}`);
  broken.slice(0, 80).forEach((item) => console.log(`- ${item}`));
  if (broken.length > 80) console.log(`- ...${broken.length - 80} more`);

  console.log(`Orphan articles: ${orphans.length}`);
  orphans.slice(0, 80).forEach((slug) => console.log(`- ${slug}`));

  console.log(`Articles with fewer than 3 related articles: ${suggestions.length}`);
  suggestions.slice(0, 25).forEach((item) => console.log(`- ${item.slug}: ${item.related.join(", ")}`));

  if (broken.length || orphans.length) process.exitCode = 1;
}

main();
