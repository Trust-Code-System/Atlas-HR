/**
 * Markdown → real .xlsx (Microsoft Excel) generator.
 *
 * Turns any Markdown tables in the content into formatted worksheets (one sheet
 * per table), with a bold styled header row, frozen header, auto-sized columns,
 * and numeric coercion so figures are real numbers, not text. If the content
 * has no tables, a single "Notes" sheet captures the text so the export still
 * produces a usable workbook.
 */
import ExcelJS from "exceljs";
import { parseMarkdownBlocks, stripInline, type Block } from "@/lib/ai/documents/markdown-blocks";

/** Parse a cell into a number when it cleanly looks numeric (handles %, commas, currency). */
function coerce(value: string): string | number {
  const cleaned = value.replace(/[,£$€\s]/g, "").replace(/%$/, "");
  if (cleaned !== "" && !Number.isNaN(Number(cleaned)) && /\d/.test(cleaned)) {
    return Number(cleaned);
  }
  return value;
}

function styleHeader(ws: ExcelJS.Worksheet, columnCount: number) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle" };
  for (let c = 1; c <= columnCount; c++) {
    header.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  }
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

function autoFit(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 10;
    // `cell.text` is the displayed value — correct for numbers and formulas too.
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.text ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 60);
  });
}

/**
 * Add a bold "Total" row with real, editable SUM() formulas for each numeric
 * column, and apply thousands number formatting — so the workbook behaves like
 * a spreadsheet a person built, not a static dump.
 */
function addTotalsAndFormatting(
  ws: ExcelJS.Worksheet,
  dataStartRow: number,
  rowCount: number,
  colCount: number,
) {
  if (rowCount === 0 || colCount === 0) return;
  const dataEndRow = dataStartRow + rowCount - 1;

  // Detect numeric columns (≥60% of populated data cells are numbers).
  const numericCols: number[] = [];
  for (let c = 1; c <= colCount; c++) {
    let populated = 0;
    let numeric = 0;
    for (let r = dataStartRow; r <= dataEndRow; r++) {
      const v = ws.getCell(r, c).value;
      if (v !== null && v !== undefined && v !== "") {
        populated++;
        if (typeof v === "number") numeric++;
      }
    }
    if (populated > 0 && numeric / populated >= 0.6) numericCols.push(c);
  }
  if (numericCols.length === 0) return;

  for (const c of numericCols) ws.getColumn(c).numFmt = "#,##0";

  if (rowCount > 1) {
    const totalRowIdx = dataEndRow + 1;
    const totalRow = ws.getRow(totalRowIdx);
    if (!numericCols.includes(1)) totalRow.getCell(1).value = "Total";
    for (const c of numericCols) {
      const letter = ws.getColumn(c).letter;
      totalRow.getCell(c).value = { formula: `SUM(${letter}${dataStartRow}:${letter}${dataEndRow})` };
      totalRow.getCell(c).numFmt = "#,##0";
    }
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: "thin", color: { argb: "FF94A3B8" } } };
    });
  }
}

function safeSheetName(name: string, index: number): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, "").trim().slice(0, 28);
  return cleaned || `Table ${index + 1}`;
}

/** Generate an .xlsx Buffer from Markdown content. */
export async function markdownToXlsx(markdown: string, title: string): Promise<Buffer> {
  const blocks = parseMarkdownBlocks(markdown);
  const tables = blocks.filter((b): b is Extract<Block, { type: "table" }> => b.type === "table");

  const wb = new ExcelJS.Workbook();
  wb.creator = "Atlas AI";
  wb.created = new Date();

  if (tables.length === 0) {
    // No tabular data — preserve the text so the file is still useful.
    const ws = wb.addWorksheet(safeSheetName(title, 0));
    ws.addRow([title]).font = { bold: true, size: 14 };
    ws.addRow([]);
    for (const block of blocks) {
      if (block.type === "heading") {
        ws.addRow([block.text]).font = { bold: true };
      } else if (block.type === "paragraph" || block.type === "quote" || block.type === "callout") {
        ws.addRow([stripInline("text" in block ? block.text : "")]);
      } else if (block.type === "bullets" || block.type === "numbered") {
        for (const item of block.items) ws.addRow([`• ${item.map((r) => r.text).join("")}`]);
      }
    }
    ws.getColumn(1).width = 80;
    ws.getColumn(1).alignment = { wrapText: true };
  } else {
    tables.forEach((table, idx) => {
      const ws = wb.addWorksheet(safeSheetName(table.headers[0] ?? title, idx));
      const hasHeader = table.headers.length > 0;
      if (hasHeader) ws.addRow(table.headers);
      for (const row of table.rows) ws.addRow(row.map(coerce));
      const colCount = Math.max(table.headers.length, ...table.rows.map((r) => r.length), 0);
      addTotalsAndFormatting(ws, hasHeader ? 2 : 1, table.rows.length, colCount);
      if (hasHeader) styleHeader(ws, colCount);
      autoFit(ws);
    });
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}
