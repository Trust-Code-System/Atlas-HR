"use client";

import { useMemo, useState, useTransition } from "react";
import type { CalculatorField, TableColumn } from "@/lib/calculators";

type TableRowValue = Record<string, string | number>;
type InputValue = string | number | number[] | TableRowValue[];

type CalculatorPayload = {
  slug: string;
  name: string;
  description: string;
  fields: CalculatorField[];
  defaultInputs: Record<string, unknown>;
};

function valueToInput(value: unknown) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) return [...value] as number[];
    return value.map((row) => ({ ...(row as TableRowValue) }));
  }
  if (typeof value === "number" || typeof value === "string") return value;
  return "";
}

function serializeTextarea(value: InputValue) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join("\n");
  return String(value ?? "");
}

function parseTextarea(value: string, previous: InputValue) {
  if (!Array.isArray(previous) || previous.some((item) => typeof item === "object")) return value;
  return value
    .split(/[\n,]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function normalizeForApi(fields: CalculatorField[], inputs: Record<string, InputValue>) {
  const output: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.kind === "csv") continue;
    const value = inputs[field.name];

    if (field.kind === "number") {
      output[field.name] = Number(value) || 0;
    } else {
      output[field.name] = value;
    }
  }

  return output;
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function ResultView({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value == null) return null;

  // Array of objects → render as a clean table
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-slate-400 italic">None</p>;

    const allObjects = value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item));

    if (allObjects) {
      const keys = Object.keys(value[0] as Record<string, unknown>);
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {keys.map((k) => (
                  <th key={k} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {formatLabel(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {value.slice(0, 50).map((item, i) => {
                const row = item as Record<string, unknown>;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {keys.map((k) => (
                      <td key={k} className="px-4 py-3 font-medium text-navy-800 tabular-nums">
                        {String(row[k] ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Array of primitives → pill list
    return (
      <div className="flex flex-wrap gap-2">
        {value.map((item, i) => (
          <span key={i} className="rounded-lg bg-navy-50 border border-navy-100 px-3 py-1 text-sm font-medium text-navy-700">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Object → split simple vs nested, simple in metric grid, nested as sections
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const simple = entries.filter(([, v]) => typeof v !== "object" || v === null);
    const complex = entries.filter(([, v]) => typeof v === "object" && v !== null);

    return (
      <div className="space-y-4">
        {simple.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {simple.map(([key, item]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatLabel(key)}</p>
                <p className="mt-1.5 text-xl font-bold text-navy-900 tabular-nums">{String(item)}</p>
              </div>
            ))}
          </div>
        )}
        {complex.map(([key, item]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{formatLabel(key)}</p>
            <ResultView value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Primitive top-level result
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold text-navy-900 tabular-nums">{String(value)}</p>
    </div>
  );
}

function emptyRow(columns: TableColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.key, column.type === "number" ? 0 : ""]));
}

export function CalculatorClient({ calculator }: { calculator: CalculatorPayload }) {
  const [inputs, setInputs] = useState<Record<string, InputValue>>(() =>
    Object.fromEntries(
      calculator.fields
        .filter((field) => field.kind !== "csv")
        .map((field) => [field.name, valueToInput(calculator.defaultInputs[field.name])]),
    ),
  );
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tableFields = useMemo(() => calculator.fields.filter((field) => field.kind === "table"), [calculator.fields]);

  function updateField(name: string, value: InputValue) {
    setInputs((current) => ({ ...current, [name]: value }));
  }

  function updateTableCell(fieldName: string, rowIndex: number, column: TableColumn, value: string) {
    const rows = Array.isArray(inputs[fieldName]) ? ([...inputs[fieldName]] as TableRowValue[]) : [];
    rows[rowIndex] = {
      ...rows[rowIndex],
      [column.key]: column.type === "number" ? Number(value) || 0 : value,
    };
    updateField(fieldName, rows);
  }

  function calculate() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/calculators/${calculator.slug}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: normalizeForApi(calculator.fields, inputs) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Calculator failed.");
        return;
      }
      setResult(data.result);
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Tool</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">{calculator.name}</h1>
            <p className="mt-1 text-sm text-blue-300 leading-relaxed max-w-xl">{calculator.description}</p>
          </div>
          <button
            type="button"
            onClick={calculate}
            disabled={isPending}
            className="inline-flex items-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 ring-1 ring-white/15 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {isPending ? "Calculating…" : "Calculate"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-navy-900">Inputs</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {calculator.fields.map((field) => {
              if (field.kind === "csv") {
                return (
                  <div key={`${field.name}-csv`} className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    <p className="font-semibold text-navy-800">{field.label}</p>
                    <p className="mt-1">{field.helper}</p>
                  </div>
                );
              }

              if (field.kind === "table") return null;

              const value = inputs[field.name] ?? "";
              return (
                <label key={field.name} className="block">
                  <span className="text-sm font-semibold text-navy-800">{field.label}</span>
                  {field.kind === "select" ? (
                    <select
                      value={String(value)}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy-900 outline-none focus:border-blue-500"
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.kind === "textarea" ? (
                    <textarea
                      value={serializeTextarea(value)}
                      onChange={(event) => updateField(field.name, parseTextarea(event.target.value, value))}
                      placeholder={field.placeholder}
                      className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type={field.kind}
                      value={String(value)}
                      min={field.kind === "number" ? field.min : undefined}
                      step={field.kind === "number" ? field.step : undefined}
                      onChange={(event) => updateField(field.name, field.kind === "number" ? Number(event.target.value) || 0 : event.target.value)}
                      placeholder={field.placeholder}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy-900 outline-none focus:border-blue-500"
                    />
                  )}
                </label>
              );
            })}
          </div>

          {tableFields.map((field) => {
            const rows = Array.isArray(inputs[field.name]) ? (inputs[field.name] as TableRowValue[]) : [];
            return (
              <div key={field.name} className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-900">{field.label}</h3>
                  <button
                    type="button"
                    onClick={() => updateField(field.name, [...rows, emptyRow(field.columns)])}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {field.addLabel}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {field.columns.map((column) => (
                          <th key={column.key} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {field.columns.map((column) => (
                            <td key={column.key} className="px-2 py-2">
                              {column.type === "select" ? (
                                <select
                                  title={column.label}
                                  value={String(row[column.key] ?? "")}
                                  onChange={(event) => updateTableCell(field.name, rowIndex, column, event.target.value)}
                                  className="h-9 min-w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-500"
                                >
                                  {column.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={column.type}
                                  title={column.label}
                                  value={String(row[column.key] ?? "")}
                                  onChange={(event) => updateTableCell(field.name, rowIndex, column, event.target.value)}
                                  className="h-9 min-w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-500"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-bold text-navy-900">Results</h2>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="mt-4">
            {result ? (
              <ResultView value={result} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                Enter values and run the calculator.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
