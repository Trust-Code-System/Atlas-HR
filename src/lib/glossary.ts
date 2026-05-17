import glossaryEntries from "@/content/glossary/glossary.json";

export interface GlossaryEntry {
  term: string;
  fullName: string;
  definition: string;
  category: string;
  alsoSeeArticles: string[];
  alsoSeeTools: string[];
  synonyms: string[];
}

export const glossary = glossaryEntries as GlossaryEntry[];

const glossaryByTerm = new Map(glossary.map((entry) => [entry.term.toLowerCase(), entry]));

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeJsxAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function getGlossaryEntry(term: string) {
  return glossaryByTerm.get(term.toLowerCase()) ?? null;
}

function shouldSkipLine(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("<") ||
    trimmed.startsWith("|") ||
    trimmed.startsWith("```") ||
    trimmed.includes("<") ||
    trimmed.includes("http://") ||
    trimmed.includes("https://")
  );
}

/** Block tags whose inner text lines must not receive raw `<Term>` injections (breaks MDX). */
const MDX_FLOW_TAGS = [
  "CountryNote",
  "Callout",
  "Steps",
  "Comparison",
  "Checklist",
  "TemplateCTA",
] as const;

function updateMdxFlowStack(line: string, stack: string[]) {
  for (const tag of MDX_FLOW_TAGS) {
    const openRe = new RegExp(`<${tag}(\\s|>)`, "g");
    const closeRe = new RegExp(`</${tag}>`, "g");
    const opens = line.match(openRe)?.length ?? 0;
    const closes = line.match(closeRe)?.length ?? 0;
    for (let i = 0; i < opens; i++) stack.push(tag);
    for (let i = 0; i < closes; i++) {
      const idx = stack.lastIndexOf(tag);
      if (idx !== -1) stack.splice(idx, 1);
    }
  }
}

const autoLinkTerms = glossary
  .filter((entry) => entry.term.length >= 3 && !entry.term.includes("/"))
  .sort((a, b) => b.term.length - a.term.length)
  .slice(0, 140);

export function annotateGlossaryTerms(content: string, maxTerms = 35) {
  const linked = new Set<string>();
  let inCodeFence = false;
  let inFaqBlock = false;
  const mdxFlowStack: string[] = [];

  return content
    .split(/\r?\n/)
    .map((line) => {
      if (line.trim().startsWith("```")) {
        inCodeFence = !inCodeFence;
        return line;
      }

      updateMdxFlowStack(line, mdxFlowStack);

      if (line.includes("<FAQ")) inFaqBlock = true;
      const skipForFaq = inFaqBlock;
      if (inFaqBlock && line.includes("]} />")) inFaqBlock = false;

      if (
        inCodeFence ||
        shouldSkipLine(line) ||
        linked.size >= maxTerms ||
        mdxFlowStack.length > 0 ||
        skipForFaq
      ) {
        return line;
      }

      let nextLine = line;
      for (const entry of autoLinkTerms) {
        if (linked.has(entry.term) || linked.size >= maxTerms) continue;

        const pattern = new RegExp(`(^|[^A-Za-z0-9_])(${escapeRegExp(entry.term)})(?![A-Za-z0-9_])`, "iu");
        if (!pattern.test(nextLine)) continue;

        nextLine = nextLine.replace(pattern, (_match, prefix: string, matched: string) => {
          linked.add(entry.term);
          return `${prefix}<Term term="${escapeJsxAttribute(entry.term)}">${matched}</Term>`;
        });
      }

      return nextLine;
    })
    .join("\n");
}
