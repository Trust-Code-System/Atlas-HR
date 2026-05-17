export type ReportEmployeeRow = {
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  status: string | null;
  employment_type: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
};

const REPORT_HEADERS: Array<keyof ReportEmployeeRow> = [
  "full_name",
  "email",
  "job_title",
  "department",
  "status",
  "employment_type",
  "country",
  "start_date",
  "end_date",
];

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfEscape(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function filterReportRows(
  rows: ReportEmployeeRow[],
  filters: { department?: string | null; employmentType?: string | null }
) {
  const department = filters.department ?? "all";
  const employmentType = filters.employmentType ?? "all";
  return rows.filter((employee) => {
    const departmentMatch = department === "all" || employee.department === department;
    const typeMatch = employmentType === "all" || employee.employment_type === employmentType;
    return departmentMatch && typeMatch;
  });
}

export function reportRowsToCsv(rows: ReportEmployeeRow[]) {
  return [
    REPORT_HEADERS.join(","),
    ...rows.map((row) => REPORT_HEADERS.map((key) => csvEscape(row[key])).join(",")),
  ].join("\n");
}

export function reportRowsToExcelHtml(rows: ReportEmployeeRow[], title: string) {
  const head = REPORT_HEADERS.map((key) => `<th>${htmlEscape(key)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${REPORT_HEADERS.map((key) => `<td>${htmlEscape(row[key])}</td>`).join("")}</tr>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(title)}</title></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

export function linesToPdf(lines: string[]) {
  const text = lines
    .map((line, index) => `${index === 0 ? "40 760 Td" : "0 -16 Td"} (${pdfEscape(line).slice(0, 110)}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 10 Tf\n${text}\nET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function reportRowsToPdf(rows: ReportEmployeeRow[], title: string) {
  return linesToPdf([
    title,
    `Generated: ${new Date().toISOString()}`,
    `Rows: ${rows.length}`,
    "",
    ...rows.slice(0, 42).map((row) =>
      `${row.full_name ?? "Unnamed"} | ${row.job_title ?? "No title"} | ${row.department ?? "No department"} | ${row.status ?? "No status"}`
    ),
  ]);
}

export function buildReportExport(input: {
  slug: string;
  rows: ReportEmployeeRow[];
  format?: string | null;
}) {
  const format = input.format === "pdf" || input.format === "xlsx" ? input.format : "csv";
  const title = `Atlas ${input.slug} report`;

  if (format === "pdf") {
    return {
      body: reportRowsToPdf(input.rows, title),
      contentType: "application/pdf",
      extension: "pdf",
    };
  }

  if (format === "xlsx") {
    return {
      body: reportRowsToExcelHtml(input.rows, title),
      contentType: "application/vnd.ms-excel; charset=utf-8",
      extension: "xls",
    };
  }

  return {
    body: reportRowsToCsv(input.rows),
    contentType: "text/csv; charset=utf-8",
    extension: "csv",
  };
}
