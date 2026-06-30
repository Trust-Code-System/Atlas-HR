/**
 * Lightweight Markdown → block AST, shared by the Word / Excel / PowerPoint
 * generators (`@/lib/ai/documents/*`). The Atlas AI models reply in Markdown;
 * this turns that Markdown into a structured block list the generators can map
 * to real Office primitives (paragraphs, headings, lists, tables, etc.).
 *
 * Intentionally small and dependency-free — it covers the constructs Atlas AI
 * actually produces (headings, paragraphs, bullet/numbered lists, tables,
 * blockquotes, fenced code, rules, and the "⚠️ LEGAL REVIEW:" callout).
 */

export type InlineRun = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; runs: InlineRun[]; text: string }
  | { type: "paragraph"; runs: InlineRun[]; text: string }
  | { type: "bullets"; items: InlineRun[][] }
  | { type: "numbered"; items: InlineRun[][] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; runs: InlineRun[]; text: string }
  | { type: "code"; text: string }
  | { type: "callout"; text: string }
  | { type: "rule" };

/** Parse inline emphasis/code spans into styled runs (for rich formats like Word). */
export function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  // Split on **bold**, *italic*/_italic_, and `code`, keeping the delimiters.
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      runs.push({ text: part.slice(2, -2), bold: true });
    } else if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      runs.push({ text: part.slice(1, -1), code: true });
    } else if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      runs.push({ text: part.slice(1, -1), italic: true });
    } else if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) {
      runs.push({ text: part.slice(1, -1), italic: true });
    } else {
      runs.push({ text: part });
    }
  }
  return runs.length ? runs : [{ text }];
}

/** Strip inline markdown to plain text (for formats without rich runs, e.g. slides/sheets). */
export function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => stripInline(c.trim()));
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

/** Parse a Markdown string into a flat list of blocks. */
export function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line.
    if (trimmed === "") {
      i++;
      continue;
    }

    // Callout (legal-review trailer or any ⚠️ line).
    if (trimmed.startsWith("⚠️")) {
      blocks.push({ type: "callout", text: trimmed });
      i++;
      continue;
    }

    // Fenced code block.
    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    // Horizontal rule.
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    // Headings.
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3 | 4;
      const text = heading[2].trim();
      blocks.push({ type: "heading", level, runs: parseInline(text), text });
      i++;
      continue;
    }

    // Table: a pipe line followed by a separator line.
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2; // header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Bullet list.
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: InlineRun[][] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*[-*+]\s+/, "").trim()));
        i++;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    // Numbered list.
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: InlineRun[][] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*\d+[.)]\s+/, "").trim()));
        i++;
      }
      blocks.push({ type: "numbered", items });
      continue;
    }

    // Blockquote.
    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const text = quote.join(" ");
      blocks.push({ type: "quote", runs: parseInline(text), text });
      continue;
    }

    // Paragraph — accumulate consecutive non-special lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,4}\s/.test(lines[i].trim()) &&
      !/^[-*+]\s/.test(lines[i].trim()) &&
      !/^\d+[.)]\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("⚠️") &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) {
      const text = para.join(" ");
      blocks.push({ type: "paragraph", runs: parseInline(text), text });
    } else {
      // Safety net so the loop always advances.
      blocks.push({ type: "paragraph", runs: parseInline(trimmed), text: trimmed });
      i++;
    }
  }

  return blocks;
}

/** Best-effort document title: first heading, else first paragraph, else fallback. */
export function inferTitle(blocks: Block[], fallback = "Atlas Document"): string {
  const heading = blocks.find((b) => b.type === "heading") as Extract<Block, { type: "heading" }> | undefined;
  if (heading) return heading.text.slice(0, 120);
  const para = blocks.find((b) => b.type === "paragraph") as Extract<Block, { type: "paragraph" }> | undefined;
  if (para) return para.text.slice(0, 80);
  return fallback;
}
