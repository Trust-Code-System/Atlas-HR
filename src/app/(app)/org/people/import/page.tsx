"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { bulkImportEmployees, type CsvRow, type BulkImportResult } from "../actions";

// ─── CSV parser (no dependencies) ────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let inQuote = false;
    let cell = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cells.push(cell.trim()); cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    rows.push(cells);
  }
  return rows;
}

// ─── Column mapping ───────────────────────────────────────────────────────────

const COLUMN_MAP: Record<string, keyof CsvRow> = {
  name: "full_name", full_name: "full_name", "full name": "full_name", employee: "full_name",
  email: "email", "email address": "email",
  title: "job_title", job_title: "job_title", "job title": "job_title", role: "job_title", position: "job_title",
  department: "department", dept: "department", team: "department",
  type: "employment_type", employment_type: "employment_type", "employment type": "employment_type",
  "start date": "start_date", start_date: "start_date", "start": "start_date", "hire date": "start_date",
  country: "country", location: "country",
  phone: "phone", mobile: "phone", telephone: "phone",
  salary: "salary", compensation: "salary",
  currency: "salary_currency", "salary currency": "salary_currency",
};

const FIELD_LABELS: Record<keyof CsvRow, string> = {
  full_name: "Full name *", email: "Email", job_title: "Job title", department: "Department",
  employment_type: "Employment type", start_date: "Start date", country: "Country",
  phone: "Phone", salary: "Salary", salary_currency: "Currency",
};

const ALL_FIELDS = Object.keys(FIELD_LABELS) as (keyof CsvRow)[];

function autoMap(headers: string[]): Partial<Record<keyof CsvRow, number>> {
  const mapping: Partial<Record<keyof CsvRow, number>> = {};
  headers.forEach((h, i) => {
    const key = COLUMN_MAP[h.toLowerCase().trim()];
    if (key && !(key in mapping)) mapping[key] = i;
  });
  return mapping;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "preview" | "done";

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<keyof CsvRow, number>>>({});
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    setFileError(null);
    if (!file.name.match(/\.(csv|txt)$/i)) {
      setFileError("Please upload a CSV file (.csv or .txt)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const rows = parseCsv(text);
      if (rows.length < 2) { setFileError("CSV must have a header row and at least one data row"); return; }
      setHeaders(rows[0]);
      setDataRows(rows.slice(1));
      setMapping(autoMap(rows[0]));
      setStep("map");
    };
    reader.readAsText(file);
  }

  function buildRows(): CsvRow[] {
    return dataRows.map((row) => {
      const obj: Partial<CsvRow> = {};
      for (const field of ALL_FIELDS) {
        const colIdx = mapping[field];
        if (colIdx !== undefined && colIdx !== -1 && row[colIdx]?.trim()) {
          (obj as Record<string, string>)[field] = row[colIdx].trim();
        }
      }
      return obj as CsvRow;
    }).filter((r) => r.full_name);
  }

  function handleImport() {
    const rows = buildRows();
    startTransition(async () => {
      const res = await bulkImportEmployees(rows);
      setResult(res);
      setStep("done");
    });
  }

  const previewRows = buildRows().slice(0, 10);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Import employees</h1>
              <p className="text-blue-300 text-sm mt-0.5">Upload a CSV file to add multiple employees at once</p>
            </div>
          </div>
          <Link
            href="/org/people"
            className="inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(["upload", "map", "preview", "done"] as Step[]).map((s, idx) => {
          const labels = ["Upload", "Map columns", "Preview", "Done"];
          const stepIdx = ["upload", "map", "preview", "done"].indexOf(step);
          const current = s === step;
          const done = idx < stepIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                current ? "bg-blue-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-navy-100 text-navy-400"
              }`}>
                {done ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold ${current ? "bg-white/20 text-white" : "bg-navy-200 text-navy-500"}`}>
                    {idx + 1}
                  </span>
                )}
                {labels[idx]}
              </div>
              {idx < 3 && <div className={`h-px w-6 ${done || current ? "bg-blue-300" : "bg-navy-200"}`} />}
            </div>
          );
        })}
      </div>

      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-navy-200 p-8">
          <div
            className="border-2 border-dashed border-navy-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy-800 mb-1">Drop your CSV here or click to browse</p>
            <p className="text-xs text-navy-400">Supports .csv files up to 500 rows</p>
            {fileError && <p className="mt-3 text-xs font-medium text-red-600">{fileError}</p>}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" title="Upload CSV file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 p-4">
            <p className="text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">Expected columns</p>
            <div className="flex flex-wrap gap-2">
              {["Full name", "Email", "Job title", "Department", "Employment type", "Start date", "Country", "Phone", "Salary", "Currency"].map((col) => (
                <span key={col} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-navy-200 text-navy-600">{col}</span>
              ))}
            </div>
            <p className="text-[11px] text-navy-400 mt-3">Column names are matched automatically. Only <strong>Full name</strong> is required. <a href="/templates/employee-import-template.csv" download className="text-blue-600 hover:underline">Download template</a></p>
          </div>
        </div>
      )}

      {/* ── Step: Map ── */}
      {step === "map" && (
        <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-navy-900">Map columns</h2>
              <p className="text-xs text-navy-500 mt-0.5">{dataRows.length} rows detected · match each Atlas HR field to a CSV column</p>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {ALL_FIELDS.map((field) => (
              <div key={field} className="grid grid-cols-2 items-center gap-4 px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-navy-800">{FIELD_LABELS[field]}</p>
                </div>
                <select
                  title={`Map column for ${FIELD_LABELS[field]}`}
                  value={mapping[field] ?? -1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setMapping((prev) => ({ ...prev, [field]: val === -1 ? undefined : val }));
                  }}
                  className="h-9 w-full rounded-xl border border-navy-200 bg-navy-50 px-3 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={-1}>— skip —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-navy-100 flex items-center justify-between">
            <button type="button" onClick={() => setStep("upload")} className="text-sm text-navy-500 hover:text-navy-700 transition-colors">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("preview")}
              disabled={mapping.full_name === undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview →
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-900">Preview</h2>
              <p className="text-xs text-navy-500 mt-0.5">
                {buildRows().length} valid rows ready to import
                {dataRows.length - buildRows().length > 0 && ` · ${dataRows.length - buildRows().length} skipped (no name)`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-navy-50 border-b border-navy-200">
                    {(["full_name", "email", "job_title", "department", "employment_type", "start_date"] as (keyof CsvRow)[])
                      .filter((f) => mapping[f] !== undefined)
                      .map((f) => (
                        <th key={f} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-navy-400">
                          {FIELD_LABELS[f].replace(" *", "")}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      {(["full_name", "email", "job_title", "department", "employment_type", "start_date"] as (keyof CsvRow)[])
                        .filter((f) => mapping[f] !== undefined)
                        .map((f) => (
                          <td key={f} className="px-4 py-3 text-navy-700 truncate max-w-[180px]">
                            {(row as unknown as Record<string, string>)[f] ?? <span className="text-navy-300">—</span>}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {buildRows().length > 10 && (
              <div className="px-6 py-3 border-t border-navy-100 text-xs text-navy-400">
                Showing first 10 of {buildRows().length} rows
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("map")} className="text-sm text-navy-500 hover:text-navy-700 transition-colors">
              ← Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isPending || buildRows().length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing…
                </>
              ) : (
                <>Import {buildRows().length} employees</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-red-800 mb-1">Import failed</p>
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-emerald-800 text-lg mb-1">{result.imported} employee{result.imported !== 1 ? "s" : ""} imported</p>
              {(result.skipped ?? 0) > 0 && <p className="text-sm text-emerald-700">{result.skipped} rows skipped (no name)</p>}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-navy-100">
                <p className="text-sm font-semibold text-navy-800">{result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had errors</p>
              </div>
              <div className="divide-y divide-navy-100">
                {result.errors.map((e) => (
                  <div key={e.row} className="px-5 py-3 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold">!</span>
                    <div>
                      <p className="text-sm font-medium text-navy-800">Row {e.row} — {e.name}</p>
                      <p className="text-xs text-navy-500">{e.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href="/org/people"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              View employees
            </Link>
            <button
              type="button"
              onClick={() => { setStep("upload"); setResult(null); setHeaders([]); setDataRows([]); setMapping({}); }}
              className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
