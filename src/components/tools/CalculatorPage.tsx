"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePDF } from "react-to-pdf";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Copy, FileDown, Info, Plus, Save, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CALCULATORS, type CalculatorConfig, type CalculatorField, type CalculatorSlug, type TableColumn } from "@/lib/calculators";

type Inputs = Record<string, unknown>;
type Row = Record<string, string | number>;
type PieDatum = Record<string, string | number>;

const chartColors = ["var(--accent)", "var(--success)", "var(--warning)", "var(--danger)", "var(--text-tertiary)", "var(--chart-4)"];
const chartTooltipStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", options).format(Number.isFinite(value) ? value : 0);
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  if (value == null) return "";
  return String(value);
}

function encodeInputs(inputs: Inputs) {
  const json = JSON.stringify(inputs);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary);
}

function decodeInputs(encoded: string) {
  try {
    const binary = window.atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Inputs;
  } catch {
    return null;
  }
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, ""));
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function mapCsvRows(slug: CalculatorSlug, csvRows: Record<string, string>[]) {
  if (slug === "hr-dashboard") {
    return csvRows.map((row) => ({
      employeeId: row.employee_id || row.id || "",
      name: row.name || "",
      department: row.department || "",
      role: row.role || row.title || "",
      level: row.level || "",
      gender: row.gender || "",
      ethnicity: row.ethnicity || "",
      startDate: row.start_date || row.startdate || "",
      endDate: row.end_date || row.enddate || row.active || "",
      salary: numberValue(row.salary),
      country: row.country || "",
      managerId: row.manager_id || row.managerid || "",
    }));
  }

  return csvRows.map((row) => ({
    id: row.employee_id || row.id || row.name || "",
    gender: row.gender || "",
    ethnicity: row.ethnicity || "",
    department: row.department || "",
    level: row.level || "",
    tenureYears: numberValue(row.tenure_years || row.tenureyears || row.tenure),
    performanceRating: numberValue(row.performance_rating || row.performancerating || row.rating),
    salary: numberValue(row.salary),
  }));
}

function emptyRow(columns: TableColumn[]): Row {
  return Object.fromEntries(columns.map((column) => [column.key, column.type === "number" ? 0 : column.options?.[0]?.value ?? ""]));
}

function FieldRenderer({
  field,
  calculator,
  value,
  onChange,
}: {
  field: CalculatorField;
  calculator: CalculatorConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-[--border] bg-[--bg-input] px-3 py-2 text-sm text-[--text-primary] outline-none transition-colors placeholder:text-[--text-tertiary] focus:border-[--accent] focus:ring-1 focus:ring-[--accent]";

  if (field.kind === "select") {
    return (
      <Select value={textValue(value) || field.options[0]?.value || null} onValueChange={(nextValue) => onChange(nextValue ?? "")} items={field.options}>
        <SelectTrigger aria-label={field.label}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.kind === "number") {
    return (
      <Input
        className={inputClass}
        min={field.min}
        step={field.step ?? 1}
        type="number"
        value={String(numberValue(value))}
        onChange={(event) => onChange(numberValue(event.target.value))}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.kind === "textarea") {
    return (
      <textarea
        className={`${inputClass} min-h-28 resize-y`}
        value={textValue(value)}
        onChange={(event) => {
          if (field.name === "salaries") {
            onChange(
              event.target.value
                .split(/[,\n]/)
                .map((item) => numberValue(item.trim()))
                .filter((item) => item > 0)
            );
          } else {
            onChange(event.target.value);
          }
        }}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.kind === "text" || field.kind === "date") {
    return (
      <Input
        className={inputClass}
        type={field.kind === "date" ? "date" : "text"}
        value={textValue(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.kind === "csv") {
    return (
      <div className="rounded-lg border border-dashed border-[--border] bg-[--bg-card] p-3">
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-xs text-[--text-secondary] file:mr-3 file:rounded-md file:border-0 file:bg-[--accent-soft] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[--accent]"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const rows = parseCsv(String(reader.result ?? ""));
              onChange(mapCsvRows(calculator.slug, rows));
            };
            reader.readAsText(file);
          }}
        />
        <p className="mt-2 text-xs leading-relaxed text-[--text-tertiary]">{field.helper}</p>
      </div>
    );
  }

  const tableField = field as Extract<CalculatorField, { kind: "table" }>;
  const rows = Array.isArray(value) ? (value as Row[]) : [];
  return (
    <div className="overflow-hidden rounded-lg border border-[--border]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-[--bg-subtle] text-[--text-tertiary]">
            <tr>
              {tableField.columns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-semibold">
                  {column.label}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[--border]">
                {tableField.columns.map((column) => (
                  <td key={column.key} className="min-w-28 px-2 py-2">
                    {column.type === "select" ? (
                      <Select
                        value={textValue(row[column.key]) || column.options?.[0]?.value || null}
                        onValueChange={(nextValue) => {
                          const nextRows = [...rows];
                          nextRows[rowIndex] = { ...nextRows[rowIndex], [column.key]: nextValue ?? "" };
                          onChange(nextRows);
                        }}
                        items={column.options ?? []}
                      >
                        <SelectTrigger aria-label={column.label} className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {column.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-8 w-full rounded-md border-[--border] bg-[--bg-input] px-2 text-xs text-[--text-primary]"
                        type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
                        value={column.type === "number" ? String(numberValue(row[column.key])) : textValue(row[column.key])}
                        onChange={(event) => {
                          const nextRows = [...rows];
                          nextRows[rowIndex] = {
                            ...nextRows[rowIndex],
                            [column.key]: column.type === "number" ? numberValue(event.target.value) : event.target.value,
                          };
                          onChange(nextRows);
                        }}
                        placeholder={column.placeholder}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    type="button"
                    aria-label="Remove row"
                    className="rounded-md p-1.5 text-[--text-tertiary] hover:bg-[--danger]/10 hover:text-[--danger]"
                    onClick={() => onChange(rows.filter((_, index) => index !== rowIndex))}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 border-t border-[--border] px-3 py-2 text-xs font-semibold text-[--accent] hover:bg-[--accent-soft]"
        onClick={() => onChange([...rows, emptyRow(tableField.columns)])}
      >
        <Plus size={14} />
        {tableField.addLabel}
      </button>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-card] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[--text-tertiary]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[--text-primary]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[--text-tertiary]">{detail}</p>}
    </div>
  );
}

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-card] p-4">
      <h3 className="text-sm font-semibold text-[--text-primary]">{title}</h3>
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}

function pieValue(item: PieDatum, dataKey: string) {
  const value = Number(item[dataKey]);
  return Number.isFinite(value) ? value : 0;
}

function renderPieLabel(data: PieDatum[], dataKey: string) {
  const total = data.reduce((sum, item) => sum + pieValue(item, dataKey), 0);

  return (entry: { name?: string; value?: number }) => {
    const value = Number(entry.value ?? 0);
    if (!total || value / total <= 0.05) return null;
    return `${entry.name ?? ""}: ${formatNumber(value)}`;
  };
}

function DonutChart({ data, dataKey, nameKey = "name" }: { data: PieDatum[]; dataKey: string; nameKey?: string }) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey={dataKey}
        nameKey={nameKey}
        outerRadius={86}
        innerRadius={42}
        labelLine={false}
        label={renderPieLabel(data, dataKey)}
      >
        {data.map((_, index) => (
          <Cell key={index} fill={chartColors[index % chartColors.length]} />
        ))}
      </Pie>
      <Tooltip
        formatter={(value) => (typeof value === "number" ? formatNumber(value) : value)}
        contentStyle={chartTooltipStyle}
      />
      <Legend verticalAlign="bottom" iconType="circle" />
    </PieChart>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-[--warning]/30 bg-[--warning]/10 p-3 text-sm leading-relaxed text-[--text-secondary]">
      <Info className="mt-0.5 size-4 shrink-0 text-[--warning]" />
      <div>{children}</div>
    </div>
  );
}

function ResultView({ slug, result, inputs, onInputsChange }: { slug: CalculatorSlug; result: unknown; inputs: Inputs; onInputsChange: (inputs: Inputs) => void }) {
  const [dashboardTab, setDashboardTab] = useState("overview");

  if (slug === "turnover-rate") {
    const data = result as ReturnType<typeof CALCULATORS[number]["compute"]> & {
      totalTurnoverRate: number;
      voluntaryTurnoverRate: number;
      involuntaryTurnoverRate: number;
      averageHeadcount: number;
      totalLeavers: number;
      benchmark: number;
      benchmarkDelta: number;
      leaverMix: { name: string; value: number }[];
      departmentBreakdown: { department: string; turnoverRate: number }[];
      recommendations: string[];
      sourceNote: string;
    };
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total turnover" value={`${data.totalTurnoverRate}%`} detail={`${data.benchmarkDelta >= 0 ? "+" : ""}${data.benchmarkDelta}% vs benchmark`} />
          <MetricCard label="Voluntary" value={`${data.voluntaryTurnoverRate}%`} />
          <MetricCard label="Involuntary" value={`${data.involuntaryTurnoverRate}%`} />
          <MetricCard label="Avg headcount" value={formatNumber(data.averageHeadcount)} detail={`${data.totalLeavers} leavers`} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartBlock title="Voluntary vs involuntary">
            <ResponsiveContainer>
              <DonutChart data={data.leaverMix} dataKey="value" />
            </ResponsiveContainer>
          </ChartBlock>
          <ChartBlock title="Department turnover">
            <ResponsiveContainer>
              <BarChart data={data.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="turnoverRate" fill="var(--accent)" name="Turnover %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBlock>
        </div>
        <Notice>{data.sourceNote}</Notice>
        <ul className="space-y-2 text-sm text-[--text-secondary]">
          {data.recommendations.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (slug === "cost-per-hire") {
    const data = result as {
      totalCost: number;
      costPerHire: number;
      benchmark: number;
      benchmarkDelta: number;
      breakdown: { name: string; value: number }[];
      trend: { period: string; costPerHire: number }[];
      recommendation: string;
      sourceNote: string;
    };
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Cost per hire" value={`$${formatNumber(data.costPerHire)}`} detail={`${data.benchmarkDelta >= 0 ? "+" : ""}$${formatNumber(data.benchmarkDelta)} vs benchmark`} />
          <MetricCard label="Total spend" value={`$${formatNumber(data.totalCost)}`} />
          <MetricCard label="Benchmark" value={`$${formatNumber(data.benchmark)}`} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartBlock title="Cost breakdown">
            <ResponsiveContainer>
              <DonutChart data={data.breakdown} dataKey="value" />
            </ResponsiveContainer>
          </ChartBlock>
          <ChartBlock title="Cost-per-hire trend">
            <ResponsiveContainer>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="costPerHire" stroke="var(--accent)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBlock>
        </div>
        <Notice>{data.sourceNote}</Notice>
        <p className="text-sm text-[--text-secondary]">{data.recommendation}</p>
      </div>
    );
  }

  if (slug === "time-to-hire") {
    const data = result as {
      averageTimeToHire: number;
      averageTimeToFill: number;
      medianTimeToHire: number;
      p90TimeToHire: number;
      bottleneck: { stage: string; days: number; benchmark: number };
      stageAverages: { stage: string; days: number; benchmark: number }[];
    };
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Avg time-to-hire" value={`${data.averageTimeToHire} days`} />
          <MetricCard label="Avg time-to-fill" value={`${data.averageTimeToFill} days`} />
          <MetricCard label="Median" value={`${data.medianTimeToHire} days`} />
          <MetricCard label="P90" value={`${data.p90TimeToHire} days`} />
        </div>
        <ChartBlock title={`Stage duration: bottleneck is ${data.bottleneck.stage}`}>
          <ResponsiveContainer>
            <BarChart data={data.stageAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="days" fill="var(--accent)" />
              <Bar dataKey="benchmark" fill="var(--warning)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>
    );
  }

  if (slug === "headcount-planner") {
    const data = result as {
      totalHires: number;
      quarterlyTotals: { quarter: string; hires: number }[];
      stackedByQuarter: Record<string, string | number>[];
      departments: { department: string; totalHires: number }[];
      risks: string[];
    };
    const departmentKeys = data.departments.map((department) => department.department);
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard label="Total hires needed" value={formatNumber(data.totalHires)} />
          <MetricCard label="Peak quarter" value={data.quarterlyTotals.reduce((max, item) => (item.hires > max.hires ? item : max), data.quarterlyTotals[0]).quarter} />
        </div>
        <ChartBlock title="Required hires by quarter">
          <ResponsiveContainer>
            <BarChart data={data.stackedByQuarter}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Legend />
              {departmentKeys.map((department, index) => (
                <Bar key={department} dataKey={department} stackId="hires" fill={chartColors[index % chartColors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
        {data.risks.length > 0 && (
          <Notice>
            <ul className="space-y-1">
              {data.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </Notice>
        )}
      </div>
    );
  }

  if (slug === "absenteeism-rate") {
    const data = result as {
      absenteeismRate: number;
      benchmark: number;
      bradfordFactor: number;
      cost: number;
      departments: { name: string; days: number }[];
      absenceTypes: { name: string; days: number }[];
      patternFlags: string[];
    };
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Absenteeism rate" value={`${data.absenteeismRate}%`} detail={`${data.benchmark}% benchmark`} />
          <MetricCard label="Bradford Factor" value={formatNumber(data.bradfordFactor)} />
          <MetricCard label="Estimated cost" value={`$${formatNumber(data.cost)}`} />
          <MetricCard label="Benchmark" value={`${data.benchmark}%`} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartBlock title="Absent days by department">
            <ResponsiveContainer>
              <BarChart data={data.departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="days" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBlock>
          <ChartBlock title="Absent days by type">
            <ResponsiveContainer>
              <DonutChart data={data.absenceTypes} dataKey="days" />
            </ResponsiveContainer>
          </ChartBlock>
        </div>
        {data.patternFlags.length > 0 && <Notice>{data.patternFlags.join(" ")}</Notice>}
      </div>
    );
  }

  if (slug === "salary-benchmark") {
    const data = result as {
      count: number;
      currency: string;
      percentiles: { p25: number; p50: number; p75: number; p90: number };
      recommendedRange: { min: number; max: number };
      yourOffer: number;
      offerPercentile: number;
      histogram: { range: string; count: number }[];
      note: string;
    };
    return (
      <div className="space-y-4">
        <Notice>{data.note}</Notice>
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="P25" value={`${data.currency} ${formatNumber(data.percentiles.p25)}`} />
          <MetricCard label="P50" value={`${data.currency} ${formatNumber(data.percentiles.p50)}`} />
          <MetricCard label="P75" value={`${data.currency} ${formatNumber(data.percentiles.p75)}`} />
          <MetricCard label="Offer percentile" value={`${data.offerPercentile}%`} detail={`${data.count} data points`} />
        </div>
        <ChartBlock title="Salary distribution">
          <ResponsiveContainer>
            <BarChart data={data.histogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
        <p className="text-sm text-[--text-secondary]">
          Recommended range: {data.currency} {formatNumber(data.recommendedRange.min)} - {formatNumber(data.recommendedRange.max)}. Your offer: {data.currency} {formatNumber(data.yourOffer)}.
        </p>
      </div>
    );
  }

  if (slug === "pay-equity") {
    const data = result as {
      employeeCount: number;
      medianMale: number;
      medianFemale: number;
      rawGap: number;
      adjustedGap: number;
      statisticallySignificant: boolean;
      byDepartment: { department: string; gap: number }[];
      unexplained: { id: string; gap: number; salary: number; expectedSalary: number }[];
      methodology: string;
    };
    return (
      <div className="space-y-4">
        <Notice>{data.methodology}</Notice>
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Raw gap" value={`${data.rawGap}%`} detail="Median male vs median female" />
          <MetricCard label="Adjusted gap" value={`${data.adjustedGap}%`} detail={data.statisticallySignificant ? "Statistically significant screen" : "Not significant / small sample"} />
          <MetricCard label="Median male" value={`$${formatNumber(data.medianMale)}`} />
          <MetricCard label="Median female" value={`$${formatNumber(data.medianFemale)}`} />
        </div>
        <ChartBlock title="Raw pay gap by department">
          <ResponsiveContainer>
            <BarChart data={data.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="gap" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
        <div className="rounded-lg border border-[--border] bg-[--bg-card] p-4">
          <h3 className="text-sm font-semibold text-[--text-primary]">Largest unexplained negative gaps for review</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-[--text-secondary]">
              <thead>
                <tr className="border-b border-[--border]">
                  <th className="py-2">Employee</th>
                  <th className="py-2">Salary</th>
                  <th className="py-2">Expected</th>
                  <th className="py-2">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.unexplained.map((employee) => (
                  <tr key={employee.id} className="border-b border-[--border] last:border-0">
                    <td className="py-2">{employee.id}</td>
                    <td className="py-2">${formatNumber(employee.salary)}</td>
                    <td className="py-2">${formatNumber(employee.expectedSalary)}</td>
                    <td className="py-2">${formatNumber(employee.gap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const data = result as {
    totalHeadcount: number;
    averageTenureYears: number;
    attritionRate: number;
    genderSplit: { name: string; value: number }[];
    headcountTrend: { month: string; headcount: number }[];
    demographicsByDepartment: Record<string, string | number>[];
    tenureDistribution: { bucket: string; count: number }[];
    compensationByLevel: { level: string; medianSalary: number }[];
    hiresAndExits: { month: string; hires: number; exits: number }[];
    leadershipByLevel: { level: string; womenPercent: number; underrepresentedPercent: number }[];
    filters: { departments: string[]; countries: string[]; levels: string[] };
  };
  const genderKeys = data.genderSplit.map((item) => item.name);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={textValue(inputs.departmentFilter) || "all"} onValueChange={(value) => onInputsChange({ ...inputs, departmentFilter: value === "all" ? "" : value })} items={[{ value: "all", label: "All departments" }, ...data.filters.departments.map((value) => ({ value, label: value }))]}>
          <SelectTrigger aria-label="Department filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {data.filters.departments.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={textValue(inputs.countryFilter) || "all"} onValueChange={(value) => onInputsChange({ ...inputs, countryFilter: value === "all" ? "" : value })} items={[{ value: "all", label: "All countries" }, ...data.filters.countries.map((value) => ({ value, label: value }))]}>
          <SelectTrigger aria-label="Country filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {data.filters.countries.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={textValue(inputs.levelFilter) || "all"} onValueChange={(value) => onInputsChange({ ...inputs, levelFilter: value === "all" ? "" : value })} items={[{ value: "all", label: "All levels" }, ...data.filters.levels.map((value) => ({ value, label: value }))]}>
          <SelectTrigger aria-label="Level filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {data.filters.levels.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {["overview", "demographics", "tenure", "compensation", "hires", "leadership"].map((item) => (
          <button key={item} type="button" onClick={() => setDashboardTab(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${dashboardTab === item ? "bg-[--accent] text-white" : "border border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]"}`}>
            {item}
          </button>
        ))}
      </div>

      {dashboardTab === "overview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Headcount" value={formatNumber(data.totalHeadcount)} />
            <MetricCard label="Avg tenure" value={`${data.averageTenureYears} yrs`} />
            <MetricCard label="Attrition" value={`${data.attritionRate}%`} detail="Last 12 months" />
          </div>
          <ChartBlock title="12-month headcount trend">
            <ResponsiveContainer>
              <AreaChart data={data.headcountTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area dataKey="headcount" fill="var(--accent)" stroke="var(--accent)" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBlock>
        </>
      )}

      {dashboardTab === "demographics" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartBlock title="Gender split">
            <ResponsiveContainer>
              <DonutChart data={data.genderSplit} dataKey="value" />
            </ResponsiveContainer>
          </ChartBlock>
          <ChartBlock title="Gender by department">
            <ResponsiveContainer>
              <BarChart data={data.demographicsByDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                {genderKeys.map((key, index) => <Bar key={key} dataKey={key} stackId="gender" fill={chartColors[index % chartColors.length]} />)}
              </BarChart>
            </ResponsiveContainer>
          </ChartBlock>
        </div>
      )}

      {dashboardTab === "tenure" && (
        <ChartBlock title="Tenure distribution">
          <ResponsiveContainer>
            <BarChart data={data.tenureDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      )}

      {dashboardTab === "compensation" && (
        <ChartBlock title="Median salary by level">
          <ResponsiveContainer>
            <BarChart data={data.compensationByLevel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="medianSalary" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      )}

      {dashboardTab === "hires" && (
        <ChartBlock title="Hires and exits">
          <ResponsiveContainer>
            <BarChart data={data.hiresAndExits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hires" fill="var(--success)" />
              <Bar dataKey="exits" fill="var(--danger)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      )}

      {dashboardTab === "leadership" && (
        <ChartBlock title="Leadership ratio by level">
          <ResponsiveContainer>
            <BarChart data={data.leadershipByLevel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="womenPercent" fill="var(--accent)" name="Women %" />
              <Bar dataKey="underrepresentedPercent" fill="var(--warning)" name="Underrepresented %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      )}
    </div>
  );
}

export function CalculatorPage({ slug }: { slug: CalculatorSlug }) {
  const calculator = useMemo(() => CALCULATORS.find((item) => item.slug === slug), [slug]);
  const [inputs, setInputs] = useState<Inputs>(() => {
    const defaults = clone((CALCULATORS.find((item) => item.slug === slug)?.defaultInputs ?? {}) as Inputs);
    if (typeof window === "undefined") return defaults;
    const encoded = new URLSearchParams(window.location.search).get("data");
    const decoded = encoded ? decodeInputs(encoded) : null;
    return decoded ?? defaults;
  });
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "auth">("idle");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const { targetRef, toPDF } = usePDF({ filename: `${slug}-report.pdf` });

  const result = useMemo(() => {
    if (!calculator) return null;
    return calculator.compute(inputs);
  }, [calculator, inputs]);

  if (!calculator || !result) {
    return null;
  }

  const updateField = (name: string, value: unknown) => {
    setInputs((previous) => ({ ...previous, [name]: value }));
    setSaveState("idle");
    setDocumentId(null);
  };

  const handleSave = async () => {
    setSaveState("saving");
    const response = await fetch("/api/calculators/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calculatorSlug: calculator.slug, inputs, result }),
    });
    if (response.status === 401) {
      setSaveState("auth");
      return;
    }
    if (!response.ok) {
      setSaveState("error");
      return;
    }
    const data = (await response.json()) as { documentId?: string };
    setDocumentId(data.documentId ?? null);
    setSaveState("saved");
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("data", encodeInputs(inputs));
    window.history.replaceState(null, "", url.toString());
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[--bg-app] py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <Link href="/tools" className="mb-6 inline-flex items-center gap-2 text-sm text-[--text-tertiary] transition-colors hover:text-[--accent]">
          <ArrowLeft size={14} />
          All tools
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold text-[--accent]">Calculator</p>
          <h1 className="mt-2 text-3xl font-bold text-[--text-primary]">{calculator.name}</h1>
          <p className="mt-2 max-w-3xl text-[--text-secondary]">{calculator.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,40%)_minmax(0,60%)]">
          <section className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
            <h2 className="text-sm font-semibold text-[--text-primary]">Inputs</h2>
            <div className="mt-5 space-y-5">
              {calculator.fields.map((field, index) => (
                <div key={`${field.name}-${field.kind}-${index}`}>
                  <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">{field.label}</label>
                  <FieldRenderer field={field} calculator={calculator} value={inputs[field.name]} onChange={(value) => updateField(field.name, value)} />
                </div>
              ))}
            </div>
          </section>

          <section ref={targetRef} className="rounded-xl border border-[--border] bg-[--bg-app] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[--text-primary]">Live results</h2>
                <p className="mt-1 text-xs text-[--text-tertiary]">Updates as inputs change. Calculators do not use AI generation credits.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSave} disabled={saveState === "saving"} className="inline-flex items-center gap-1.5 rounded-lg border border-[--border] px-3 py-2 text-xs font-semibold text-[--text-secondary] hover:bg-[--bg-hover] disabled:opacity-60">
                  <Save size={14} />
                  {calculator.slug === "hr-dashboard" ? "Save dashboard" : "Save report"}
                </button>
                <button type="button" onClick={() => toPDF()} className="inline-flex items-center gap-1.5 rounded-lg border border-[--border] px-3 py-2 text-xs font-semibold text-[--text-secondary] hover:bg-[--bg-hover]">
                  <FileDown size={14} />
                  Export PDF
                </button>
                <button type="button" onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-lg bg-[--accent] px-3 py-2 text-xs font-semibold text-white hover:bg-[--accent-hover]">
                  <Copy size={14} />
                  {copied ? "Copied" : "Share link"}
                </button>
              </div>
            </div>

            {saveState === "auth" && <Notice>Sign in to save calculator reports to your document library.</Notice>}
            {saveState === "error" && <Notice>Could not save this report. Try again after checking your session.</Notice>}
            {saveState === "saved" && (
              <div className="mb-4 rounded-lg border border-[--success]/30 bg-[--success]/10 p-3 text-sm text-[--text-secondary]">
                Saved. {documentId && <Link href={`/dashboard/documents/${documentId}`} className="font-semibold text-[--accent] hover:underline">Open in document library</Link>}
              </div>
            )}

            <ResultView slug={calculator.slug} result={result} inputs={inputs} onInputsChange={setInputs} />

            {calculator.slug === "pay-equity" && (
              <div className="mt-5 rounded-lg border border-[--danger]/30 bg-[--danger]/10 p-3 text-sm leading-relaxed text-[--text-secondary]">
                This calculator is a screening tool, not a legally defensible pay-equity audit. Work with qualified counsel and a compensation analyst before making legal conclusions.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
