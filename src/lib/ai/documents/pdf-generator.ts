/**
 * Markdown → real .pdf generator.
 *
 * Renders the shared block AST (`@/lib/ai/documents/markdown-blocks`) to a
 * proper vector PDF with PDFKit — headings, styled inline runs, bullet/numbered
 * lists, blockquotes, code, a legal-review callout, rules, and bordered tables,
 * with automatic pagination. Used for HR letters/policies/reports as a PDF.
 *
 * PDFKit's standard Helvetica/Courier fonts cover Latin text and common symbols
 * (£, €, –). Emoji (e.g. ⚠️) aren't in those fonts, so the legal-review callout
 * is rendered as a labelled, coloured line instead.
 */
import PDFDocument from "pdfkit";
import { parseMarkdownBlocks, type Block, type InlineRun } from "@/lib/ai/documents/markdown-blocks";

const NAVY = "#0F172A";
const SLATE = "#334155";
const AMBER = "#B45309";
const BORDER = "#E2E8F0";

function fontFor(run: InlineRun): string {
  if (run.code) return "Courier";
  if (run.bold) return "Helvetica-Bold";
  if (run.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

/** Write a sequence of styled runs as one (optionally bulleted) line. */
function writeRuns(doc: PDFKit.PDFDocument, runs: InlineRun[], opts: { indent?: number; color?: string } = {}) {
  const x = doc.page.margins.left + (opts.indent ?? 0);
  doc.fillColor(opts.color ?? NAVY);
  runs.forEach((run, idx) => {
    const last = idx === runs.length - 1;
    doc
      .font(fontFor(run))
      .text(run.text, idx === 0 ? x : undefined, undefined, {
        continued: !last,
        width: doc.page.width - doc.page.margins.right - x,
      });
  });
  doc.font("Helvetica").fillColor(NAVY);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = Math.max(headers.length, ...rows.map((r) => r.length), 1);
  const colW = usableWidth / cols;
  const padding = 4;
  const fontSize = 9;

  const drawRow = (cells: string[], header: boolean) => {
    doc.fontSize(fontSize).font(header ? "Helvetica-Bold" : "Helvetica");
    const heights = Array.from({ length: cols }, (_, i) =>
      doc.heightOfString(cells[i] ?? "", { width: colW - padding * 2 }),
    );
    const rowH = Math.max(16, ...heights) + padding * 2;
    ensureSpace(doc, rowH);
    const y = doc.y;
    if (header) doc.rect(startX, y, colW * cols, rowH).fill(NAVY);
    for (let i = 0; i < cols; i++) {
      const x = startX + i * colW;
      doc.lineWidth(0.5).strokeColor(BORDER).rect(x, y, colW, rowH).stroke();
      doc
        .fillColor(header ? "#FFFFFF" : NAVY)
        .font(header ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .text(cells[i] ?? "", x + padding, y + padding, { width: colW - padding * 2 });
    }
    doc.y = y + rowH;
    doc.fillColor(NAVY);
  };

  drawRow(headers, true);
  for (const row of rows) drawRow(row, false);
  doc.moveDown(0.6);
}

function renderBlock(doc: PDFKit.PDFDocument, block: Block) {
  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 17 : block.level === 2 ? 14 : 12;
      ensureSpace(doc, size + 12);
      doc.moveDown(0.3);
      doc.fontSize(size).font("Helvetica-Bold").fillColor(NAVY);
      writeRuns(doc, block.runs);
      doc.moveDown(0.2);
      break;
    }
    case "paragraph":
      doc.fontSize(11).font("Helvetica").fillColor(NAVY);
      writeRuns(doc, block.runs);
      doc.moveDown(0.4);
      break;
    case "bullets":
      doc.fontSize(11);
      for (const item of block.items) {
        ensureSpace(doc, 16);
        writeRuns(doc, [{ text: "•  " }, ...item], { indent: 10 });
      }
      doc.moveDown(0.4);
      break;
    case "numbered":
      doc.fontSize(11);
      block.items.forEach((item, i) => {
        ensureSpace(doc, 16);
        writeRuns(doc, [{ text: `${i + 1}.  ` }, ...item], { indent: 10 });
      });
      doc.moveDown(0.4);
      break;
    case "quote":
      doc.fontSize(11).font("Helvetica-Oblique").fillColor(SLATE);
      writeRuns(
        doc,
        block.runs.map((r) => ({ ...r, italic: true })),
        { indent: 16, color: SLATE },
      );
      doc.moveDown(0.4);
      break;
    case "code":
      doc.fontSize(9).font("Courier").fillColor(SLATE);
      for (const line of block.text.split("\n")) {
        ensureSpace(doc, 12);
        doc.text(line || " ", doc.page.margins.left + 6, undefined, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 12,
        });
      }
      doc.font("Helvetica").fillColor(NAVY).moveDown(0.4);
      break;
    case "callout": {
      ensureSpace(doc, 20);
      const text = block.text.replace(/^⚠️\s*/, "⚠ ").replace(/⚠️/g, "");
      doc.fontSize(10).font("Helvetica-Oblique").fillColor(AMBER);
      writeRuns(doc, [{ text, italic: true }], { color: AMBER });
      doc.font("Helvetica").fillColor(NAVY).moveDown(0.4);
      break;
    }
    case "rule":
      ensureSpace(doc, 12);
      doc
        .moveTo(doc.page.margins.left, doc.y + 4)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
        .lineWidth(0.5)
        .strokeColor(BORDER)
        .stroke();
      doc.moveDown(0.6);
      break;
    case "table":
      drawTable(doc, block.headers, block.rows);
      break;
  }
}

/** Generate a .pdf Buffer from Markdown content. */
export function markdownToPdf(markdown: string, title: string): Promise<Buffer> {
  const blocks = parseMarkdownBlocks(markdown);
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: title, Author: "Atlas AI" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).font("Helvetica-Bold").fillColor(NAVY).text(title);
    doc.moveDown(0.6);

    for (const block of blocks) renderBlock(doc, block);

    doc.end();
  });
}
