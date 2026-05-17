import fs from "fs";
import path from "path";
import type { KnowledgeArticle } from "./knowledge-shared";

const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "content", "knowledge");

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const col = line.indexOf(":");
    if (col === -1) continue;
    const key = line.slice(0, col).trim();
    const raw = line.slice(col + 1).trim();
    if (!key) continue;
    if (raw.startsWith("[")) {
      try { result[key] = JSON.parse(raw.replace(/'/g, '"')); }
      catch { result[key] = []; }
    } else if (raw === "true") result[key] = true;
    else if (raw === "false") result[key] = false;
    else if (raw !== "" && !isNaN(Number(raw))) result[key] = Number(raw);
    else result[key] = raw.replace(/^["']|["']$/g, "");
  }
  return result;
}

export function getAllKnowledgeArticles(): KnowledgeArticle[] {
  const articles: KnowledgeArticle[] = [];
  try {
    const categories = fs.readdirSync(KNOWLEDGE_DIR).filter((d) =>
      fs.statSync(path.join(KNOWLEDGE_DIR, d)).isDirectory()
    );
    for (const category of categories) {
      const dir = path.join(KNOWLEDGE_DIR, category);
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
      for (const file of files) {
        const raw = fs.readFileSync(path.join(dir, file), "utf-8");
        const fm = parseFrontmatter(raw);
        if (fm.draft === true) continue;
        articles.push({
          slug: (fm.slug as string) || file.replace(".mdx", ""),
          category,
          title: (fm.title as string) || file.replace(".mdx", "").replace(/-/g, " "),
          excerpt: (fm.excerpt as string) || "",
          readingTime: (fm.readingTime as number) || 5,
          tags: (fm.tags as string[]) || [],
          publishedAt: (fm.publishedAt as string) || "",
          draft: false,
        });
      }
    }
  } catch {
    // knowledge dir not accessible in this environment
  }
  return articles.sort((a, b) => a.category.localeCompare(b.category));
}
