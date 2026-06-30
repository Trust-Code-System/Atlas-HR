import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { markdownToDocx } from "@/lib/ai/documents/docx-generator";
import { markdownToXlsx } from "@/lib/ai/documents/xlsx-generator";
import { markdownToPptx } from "@/lib/ai/documents/pptx-generator";
import { markdownToPdf } from "@/lib/ai/documents/pdf-generator";
import { parseMarkdownBlocks } from "@/lib/ai/documents/markdown-blocks";

const SAMPLE = `# Quarterly HR Report

## Headcount
We grew **15%** this quarter across two teams.

| Department | Headcount | Avg Salary |
| --- | --- | --- |
| Engineering | 24 | 95,000 |
| Sales | 12 | 70,000 |

## Actions
- Hire 2 engineers
- Run an engagement survey

> Figures are indicative only.

⚠️ LEGAL REVIEW: verify redundancy calculations with counsel.`;

/** Office Open XML files are ZIP archives — they start with the bytes "PK". */
function isOfficeZip(buf: Buffer): boolean {
  return buf.length > 200 && buf[0] === 0x50 && buf[1] === 0x4b;
}

/** PDF files start with the "%PDF-" header. */
function isPdf(buf: Buffer): boolean {
  return buf.length > 200 && buf.subarray(0, 5).toString("latin1") === "%PDF-";
}

describe("markdown block parser", () => {
  it("extracts headings, a table, and a callout", () => {
    const blocks = parseMarkdownBlocks(SAMPLE);
    expect(blocks.some((b) => b.type === "heading")).toBe(true);
    const table = blocks.find((b) => b.type === "table");
    expect(table).toBeDefined();
    if (table?.type === "table") {
      expect(table.headers).toEqual(["Department", "Headcount", "Avg Salary"]);
      expect(table.rows.length).toBe(2);
    }
    expect(blocks.some((b) => b.type === "callout")).toBe(true);
  });
});

describe("office document generators", () => {
  it("produces a valid .docx", async () => {
    expect(isOfficeZip(await markdownToDocx(SAMPLE, "Quarterly HR Report"))).toBe(true);
  });
  it("produces a valid .xlsx", async () => {
    expect(isOfficeZip(await markdownToXlsx(SAMPLE, "Quarterly HR Report"))).toBe(true);
  });
  it("produces a valid .pptx", async () => {
    expect(isOfficeZip(await markdownToPptx(SAMPLE, "Quarterly HR Report"))).toBe(true);
  });
  it("produces a valid .pdf", async () => {
    expect(isPdf(await markdownToPdf(SAMPLE, "Quarterly HR Report"))).toBe(true);
  });
  it("adds real SUM total formulas to numeric Excel columns", async () => {
    const buf = await markdownToXlsx(SAMPLE, "Quarterly HR Report");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
    let hasFormula = false;
    wb.worksheets[0].eachRow((row) =>
      row.eachCell((cell) => {
        if (typeof cell.value === "object" && cell.value && "formula" in cell.value) hasFormula = true;
      }),
    );
    expect(hasFormula).toBe(true);
  });
});
