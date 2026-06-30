/**
 * Markdown → real .docx (Microsoft Word) generator.
 *
 * Produces a genuine Office Open XML Word document (not the HTML-masquerading
 * ".doc" the client used to download). Maps the shared block AST
 * (`@/lib/ai/documents/markdown-blocks`) to docx primitives with sensible HR
 * document styling.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { parseMarkdownBlocks, type Block, type InlineRun } from "@/lib/ai/documents/markdown-blocks";

function runs(inline: InlineRun[]): TextRun[] {
  return inline.map(
    (r) =>
      new TextRun({
        text: r.text,
        bold: r.bold,
        italics: r.italic,
        font: r.code ? "Consolas" : undefined,
      }),
  );
}

const HEADING_BY_LEVEL = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
} as const;

function blockToParagraphs(block: Block): (Paragraph | Table)[] {
  switch (block.type) {
    case "heading":
      return [new Paragraph({ heading: HEADING_BY_LEVEL[block.level], children: runs(block.runs) })];

    case "paragraph":
      return [new Paragraph({ children: runs(block.runs), spacing: { after: 120 } })];

    case "bullets":
      return block.items.map((item) => new Paragraph({ children: runs(item), bullet: { level: 0 } }));

    case "numbered":
      return block.items.map(
        (item) => new Paragraph({ children: runs(item), numbering: { reference: "atlas-numbered", level: 0 } }),
      );

    case "quote":
      return [
        new Paragraph({
          children: block.runs.map((r) => new TextRun({ text: r.text, italics: true })),
          indent: { left: 360 },
          spacing: { after: 120 },
        }),
      ];

    case "code":
      return block.text
        .split("\n")
        .map((line) => new Paragraph({ children: [new TextRun({ text: line || " ", font: "Consolas", size: 20 })] }));

    case "callout":
      return [
        new Paragraph({
          children: [new TextRun({ text: block.text, italics: true, color: "B45309" })],
          spacing: { before: 160, after: 120 },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: "FBBF24", space: 8 } },
        }),
      ];

    case "rule":
      return [
        new Paragraph({
          text: "",
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 4 } },
        }),
      ];

    case "table": {
      const headerRow = new TableRow({
        tableHeader: true,
        children: block.headers.map(
          (h) =>
            new TableCell({
              shading: { fill: "1E293B" },
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })] })],
            }),
        ),
      });
      const bodyRows = block.rows.map(
        (row) =>
          new TableRow({
            children: (block.headers.length ? block.headers : row).map(
              (_, idx) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: row[idx] ?? "" })] })],
                }),
            ),
          }),
      );
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...bodyRows],
        }),
      ];
    }

    default:
      return [];
  }
}

/** Generate a .docx Buffer from Markdown content. */
export async function markdownToDocx(markdown: string, title: string): Promise<Buffer> {
  const blocks = parseMarkdownBlocks(markdown);

  const children: (Paragraph | Table)[] = [];
  // Title block.
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
      children: [new TextRun({ text: title, bold: true, size: 36, color: "0F172A" })],
    }),
  );
  for (const block of blocks) children.push(...blockToParagraphs(block));

  const doc = new Document({
    creator: "Atlas AI",
    title,
    numbering: {
      config: [
        {
          reference: "atlas-numbered",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
