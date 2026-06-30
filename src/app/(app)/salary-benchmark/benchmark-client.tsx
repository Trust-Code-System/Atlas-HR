"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { computeSalaryBenchmark, type SalaryBenchmarkInputs } from "@/lib/calculators";
import { deleteBenchmark } from "./actions";

type BenchmarkResult = ReturnType<typeof computeSalaryBenchmark>;

interface SavedBenchmark {
  id: string;
  title: string | null;
  inputs: Record<string, unknown>;
  output: string;
  created_at: string;
}

interface Props {
  savedBenchmarks: SavedBenchmark[];
}

const CURRENCIES = ["USD", "GBP", "EUR", "NGN", "INR", "CAD", "AUD", "AED", "BRL", "ZAR"];

export function BenchmarkClient({ savedBenchmarks: initialSaved }: Props) {
  const [saved, setSaved] = useState<SavedBenchmark[]>(initialSaved);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [inputs, setInputs] = useState<SalaryBenchmarkInputs>({
    role: "",
    location: "",
    currency: "USD",
    salaries: [],
    yourOffer: 0,
  });
  const [salariesText, setSalariesText] = useState("");
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function runBenchmark() {
    const parsed = salariesText
      .split(/[\n,]+/)
      .map((s) => parseFloat(s.replace(/[^0-9.]/g, "")))
      .filter((n) => !isNaN(n) && n > 0);

    const fullInputs: SalaryBenchmarkInputs = { ...inputs, salaries: parsed };
    setInputs(fullInputs);
    const r = computeSalaryBenchmark(fullInputs);
    setResult(r);
    setSaveName(inputs.role ? `${inputs.role} — ${inputs.location || "Global"}` : "Benchmark snapshot");
  }

  async function saveToWorkspace() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calculators/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorSlug: "salary-benchmark",
          inputs,
          result,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const { documentId } = await res.json();

      const newEntry: SavedBenchmark = {
        id: documentId,
        title: saveName || `${result.role} benchmark`,
        inputs: inputs as Record<string, unknown>,
        output: JSON.stringify(result),
        created_at: new Date().toISOString(),
      };
      setSaved((prev) => [newEntry, ...prev]);
      setSaveModal(false);
      showToast("Saved to workspace");
    } catch {
      showToast("Failed to save", false);
    } finally {
      setSaving(false);
    }
  }

  function doDelete(id: string) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteBenchmark(id);
      if (res.success) {
        setSaved((prev) => prev.filter((b) => b.id !== id));
        if (compareIds?.[0] === id || compareIds?.[1] === id) setCompareIds(null);
        showToast("Deleted");
      } else {
        showToast(res.error ?? "Delete failed", false);
      }
    });
  }

  function exportCSV(b: SavedBenchmark) {
    const r: BenchmarkResult = JSON.parse(b.output);
    const rows = [
      ["Field", "Value"],
      ["Role", r.role],
      ["Location", r.location],
      ["Currency", r.currency],
      ["Data points", r.count.toString()],
      ["P25", r.percentiles.p25.toString()],
      ["P50 (median)", r.percentiles.p50.toString()],
      ["P75", r.percentiles.p75.toString()],
      ["P90", r.percentiles.p90.toString()],
      ["Your offer", r.yourOffer.toString()],
      ["Offer percentile", `${r.offerPercentile}%`],
      ["Recommended range min", r.recommendedRange.min.toString()],
      ["Recommended range max", r.recommendedRange.max.toString()],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.role || "benchmark"}-${b.created_at.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCompareCSV(a: SavedBenchmark, b: SavedBenchmark) {
    const ra: BenchmarkResult = JSON.parse(a.output);
    const rb: BenchmarkResult = JSON.parse(b.output);
    const rows = [
      ["Metric", a.title ?? ra.role, b.title ?? rb.role],
      ["Role", ra.role, rb.role],
      ["Location", ra.location, rb.location],
      ["Currency", ra.currency, rb.currency],
      ["Data points", ra.count.toString(), rb.count.toString()],
      ["P25", ra.percentiles.p25.toString(), rb.percentiles.p25.toString()],
      ["P50 (median)", ra.percentiles.p50.toString(), rb.percentiles.p50.toString()],
      ["P75", ra.percentiles.p75.toString(), rb.percentiles.p75.toString()],
      ["P90", ra.percentiles.p90.toString(), rb.percentiles.p90.toString()],
      ["Your offer", ra.yourOffer.toString(), rb.yourOffer.toString()],
      ["Offer percentile", `${ra.offerPercentile}%`, `${rb.offerPercentile}%`],
      ["Range min (P25)", ra.recommendedRange.min.toString(), rb.recommendedRange.min.toString()],
      ["Range max (P75)", ra.recommendedRange.max.toString(), rb.recommendedRange.max.toString()],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `benchmark-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  }

  const compareA = compareIds ? saved.find((b) => b.id === compareIds[0]) : null;
  const compareB = compareIds ? saved.find((b) => b.id === compareIds[1]) : null;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-navy-900 mb-2">Delete this benchmark?</h2>
            <p className="text-sm text-slate-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => doDelete(deleteTarget)} disabled={isPending} className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Save modal */}
      {saveModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-navy-900 mb-4">Save to workspace</h2>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Snapshot name</label>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="e.g. Product Manager – Lagos – Q2 2026"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setSaveModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveToWorkspace} disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calculator ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-navy-900 mb-5">Run benchmark</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Role *</label>
            <input
              value={inputs.role}
              onChange={(e) => setInputs((p) => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Senior Product Manager"
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Country / city</label>
            <input
              value={inputs.location}
              onChange={(e) => setInputs((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Lagos, London, remote"
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Currency</label>
            <Select
              value={inputs.currency}
              onChange={(value) => setInputs((p) => ({ ...p, currency: value }))}
              triggerClassName="h-9 border-slate-200 text-slate-700 focus:ring-blue-500"
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Your offer</label>
            <input
              type="number"
              value={inputs.yourOffer || ""}
              onChange={(e) => setInputs((p) => ({ ...p, yourOffer: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              min={0}
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Market salaries <span className="text-slate-400 font-normal">(one per line, or comma-separated)</span>
          </label>
          <textarea
            value={salariesText}
            onChange={(e) => setSalariesText(e.target.value)}
            rows={4}
            placeholder={"85000\n92000\n105000\n115000\n130000"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
          />
          <p className="mt-1 text-xs text-slate-400">Source from Levels.fyi, Glassdoor, Payscale, Mercer, or your network. Atlas does not provide salary data.</p>
        </div>
        <button
          type="button"
          onClick={runBenchmark}
          disabled={!salariesText.trim()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Run benchmark
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-navy-900">{result.role || "Benchmark result"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{result.location} · {result.currency} · {result.count} data point{result.count !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSaveModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to workspace
              </button>
            </div>
          </div>

          {/* Percentile stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="P25" value={fmt(result.percentiles.p25, result.currency)} sub="Lower quartile" />
            <StatCard label="P50" value={fmt(result.percentiles.p50, result.currency)} sub="Median" highlight />
            <StatCard label="P75" value={fmt(result.percentiles.p75, result.currency)} sub="Upper quartile" />
            <StatCard label="P90" value={fmt(result.percentiles.p90, result.currency)} sub="Top decile" />
          </div>

          {/* Offer position */}
          {result.yourOffer > 0 && (
            <div className="rounded-xl bg-white border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-900">Your offer: {fmt(result.yourOffer, result.currency)}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  result.offerPercentile >= 75 ? "bg-green-100 text-green-700" :
                  result.offerPercentile >= 50 ? "bg-blue-100 text-blue-700" :
                  result.offerPercentile >= 25 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {result.offerPercentile}th percentile
                </span>
              </div>
              <PercentileBar offer={result.yourOffer} p25={result.percentiles.p25} p50={result.percentiles.p50} p75={result.percentiles.p75} p90={result.percentiles.p90} />
              <p className="mt-2 text-xs text-slate-500">
                Recommended range (P25–P75): {fmt(result.recommendedRange.min, result.currency)} – {fmt(result.recommendedRange.max, result.currency)}
              </p>
            </div>
          )}

          {/* Histogram */}
          {result.histogram.length > 1 && (
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Salary distribution</p>
              <Histogram bars={result.histogram} currency={result.currency} />
            </div>
          )}

          <p className="text-xs text-slate-500 italic">{result.note}</p>
        </div>
      )}

      {/* ── Comparison view ── */}
      {compareIds && compareA && compareB && (
        <CompareView
          a={compareA}
          b={compareB}
          onClose={() => setCompareIds(null)}
          onExport={() => exportCompareCSV(compareA, compareB)}
        />
      )}

      {/* ── Workspace ── */}
      {saved.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900">Saved benchmarks ({saved.length})</h2>
            {saved.length >= 2 && !compareIds && (
              <p className="text-xs text-slate-500">Select 2 benchmarks to compare</p>
            )}
            {compareIds && (
              <button type="button" onClick={() => setCompareIds(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Clear selection
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((b) => {
              const r: BenchmarkResult = JSON.parse(b.output);
              const isSelected = compareIds?.includes(b.id);
              const selectionFull = compareIds !== null && !isSelected;
              return (
                <SavedCard
                  key={b.id}
                  benchmark={b}
                  result={r}
                  isSelected={!!isSelected}
                  selectionFull={selectionFull}
                  onSelect={() => {
                    if (compareIds === null) {
                      setCompareIds([b.id, ""]);
                    } else if (compareIds[1] === "") {
                      setCompareIds([compareIds[0], b.id]);
                    } else if (compareIds[0] === b.id) {
                      setCompareIds(null);
                    } else if (compareIds[1] === b.id) {
                      setCompareIds(null);
                    }
                  }}
                  onDelete={() => setDeleteTarget(b.id)}
                  onExport={() => exportCSV(b)}
                />
              );
            })}
          </div>
          {compareIds && compareIds[1] !== "" && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {/* already shown above */}}
                className="rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
              >
                Compare selected
              </button>
            </div>
          )}
        </div>
      )}

      {saved.length === 0 && !result && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">No saved salary benchmarks yet</p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
            HR admins can paste market salary data above, compare it with an offer, then save the snapshot for future compensation reviews.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Saved card ────────────────────────────────────────────────────────────────

function SavedCard({
  benchmark,
  result,
  isSelected,
  selectionFull,
  onSelect,
  onDelete,
  onExport,
}: {
  benchmark: SavedBenchmark;
  result: BenchmarkResult;
  isSelected: boolean;
  selectionFull: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 transition-all ${
      isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
    } ${selectionFull ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-navy-900 truncate">{benchmark.title ?? result.role}</p>
          <p className="text-xs text-slate-500 mt-0.5">{result.location} · {result.currency}</p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          aria-label={isSelected ? "Deselect for comparison" : "Select for comparison"}
          className={`shrink-0 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300 hover:border-blue-400"
          }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {(["p25", "p50", "p75", "p90"] as const).map((p) => (
          <div key={p} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-400">{p.toUpperCase()}</p>
            <p className="text-xs font-bold text-navy-900 mt-0.5">{shortFmt(result.percentiles[p])}</p>
          </div>
        ))}
      </div>

      {result.yourOffer > 0 && (
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">Your offer</span>
          <span className={`font-bold px-2 py-0.5 rounded-full ${
            result.offerPercentile >= 75 ? "bg-green-100 text-green-700" :
            result.offerPercentile >= 50 ? "bg-blue-100 text-blue-700" :
            result.offerPercentile >= 25 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {shortFmt(result.yourOffer)} · {result.offerPercentile}th %ile
          </span>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mb-3">{new Date(benchmark.created_at).toLocaleDateString()} · {result.count} data points</p>

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onExport} className="flex-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">Export CSV</button>
        <button type="button" onClick={onDelete} className="flex-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">Delete</button>
      </div>
    </div>
  );
}

// ─── Compare view ──────────────────────────────────────────────────────────────

function CompareView({
  a,
  b,
  onClose,
  onExport,
}: {
  a: SavedBenchmark;
  b: SavedBenchmark;
  onClose: () => void;
  onExport: () => void;
}) {
  const ra: BenchmarkResult = JSON.parse(a.output);
  const rb: BenchmarkResult = JSON.parse(b.output);

  const rows: { label: string; va: string; vb: string; delta?: string }[] = [
    { label: "Role", va: ra.role, vb: rb.role },
    { label: "Location", va: ra.location, vb: rb.location },
    { label: "Currency", va: ra.currency, vb: rb.currency },
    { label: "Data points", va: ra.count.toString(), vb: rb.count.toString() },
    {
      label: "P25",
      va: fmt(ra.percentiles.p25, ra.currency),
      vb: fmt(rb.percentiles.p25, rb.currency),
      delta: ra.currency === rb.currency ? deltaStr(ra.percentiles.p25, rb.percentiles.p25) : undefined,
    },
    {
      label: "Median (P50)",
      va: fmt(ra.percentiles.p50, ra.currency),
      vb: fmt(rb.percentiles.p50, rb.currency),
      delta: ra.currency === rb.currency ? deltaStr(ra.percentiles.p50, rb.percentiles.p50) : undefined,
    },
    {
      label: "P75",
      va: fmt(ra.percentiles.p75, ra.currency),
      vb: fmt(rb.percentiles.p75, rb.currency),
      delta: ra.currency === rb.currency ? deltaStr(ra.percentiles.p75, rb.percentiles.p75) : undefined,
    },
    {
      label: "P90",
      va: fmt(ra.percentiles.p90, ra.currency),
      vb: fmt(rb.percentiles.p90, rb.currency),
      delta: ra.currency === rb.currency ? deltaStr(ra.percentiles.p90, rb.percentiles.p90) : undefined,
    },
    {
      label: "Your offer",
      va: ra.yourOffer > 0 ? fmt(ra.yourOffer, ra.currency) : "—",
      vb: rb.yourOffer > 0 ? fmt(rb.yourOffer, rb.currency) : "—",
    },
    {
      label: "Offer percentile",
      va: ra.yourOffer > 0 ? `${ra.offerPercentile}th` : "—",
      vb: rb.yourOffer > 0 ? `${rb.offerPercentile}th` : "—",
    },
    {
      label: "Range (P25–P75)",
      va: `${fmt(ra.recommendedRange.min, ra.currency)} – ${fmt(ra.recommendedRange.max, ra.currency)}`,
      vb: `${fmt(rb.recommendedRange.min, rb.currency)} – ${fmt(rb.recommendedRange.max, rb.currency)}`,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-navy-900">Comparison</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onExport} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">Export CSV</button>
          <button type="button" onClick={onClose} aria-label="Close comparison" className="text-slate-400 hover:text-slate-600 ml-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 w-36">Metric</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-blue-700 bg-blue-50">{a.title ?? ra.role}</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-navy-700">{b.title ?? rb.role}</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400">Δ Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-2.5 text-xs font-semibold text-slate-500">{row.label}</td>
                <td className="px-5 py-2.5 font-semibold text-navy-900 bg-blue-50/30">{row.va}</td>
                <td className="px-5 py-2.5 font-semibold text-navy-900">{row.vb}</td>
                <td className={`px-5 py-2.5 text-xs font-bold ${
                  row.delta?.startsWith("+") ? "text-green-600" :
                  row.delta?.startsWith("-") ? "text-red-600" : "text-slate-400"
                }`}>{row.delta ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-blue-600 text-white" : "bg-white border border-slate-200"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${highlight ? "text-blue-200" : "text-slate-500"}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-white" : "text-navy-900"}`}>{value}</p>
      <p className={`text-[11px] mt-0.5 ${highlight ? "text-blue-200" : "text-slate-400"}`}>{sub}</p>
    </div>
  );
}

function PercentileBar({ offer, p25, p50, p75, p90 }: { offer: number; p25: number; p50: number; p75: number; p90: number }) {
  const min = Math.min(offer, p25) * 0.9;
  const max = Math.max(offer, p90) * 1.05;
  const range = max - min;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100));

  return (
    <div className="relative h-8">
      {/* Range bar */}
      <div className="absolute top-3 left-0 right-0 h-2 bg-slate-100 rounded-full" />
      <div
        className="absolute top-3 h-2 bg-blue-200 rounded-full"
        style={{ left: `${pct(p25)}%`, right: `${100 - pct(p75)}%` }}
      />
      {/* Markers */}
      {[{ v: p25, label: "P25" }, { v: p50, label: "P50" }, { v: p75, label: "P75" }, { v: p90, label: "P90" }].map(({ v, label }) => (
        <div key={label} className="absolute top-2" style={{ left: `${pct(v)}%`, transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-4 bg-slate-300 mx-auto" />
        </div>
      ))}
      {/* Offer marker */}
      <div className="absolute top-1" style={{ left: `${pct(offer)}%`, transform: "translateX(-50%)" }}>
        <div className="w-2 h-6 bg-blue-600 rounded-sm mx-auto" />
      </div>
    </div>
  );
}

function Histogram({ bars, currency }: { bars: { range: string; count: number }[]; currency: string }) {
  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
          <span className="text-[9px] font-bold text-slate-400">{bar.count}</span>
          <div
            className="w-full bg-blue-400 rounded-t-sm"
            style={{ height: `${(bar.count / maxCount) * 64}px`, minHeight: bar.count > 0 ? "4px" : "0" }}
          />
          <span className="text-[8px] text-slate-400 truncate w-full text-center">{bar.range.split("-")[0]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(value: number, currency: string) {
  if (!value) return "—";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function shortFmt(value: number) {
  if (!value) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function deltaStr(a: number, b: number) {
  const d = a - b;
  if (d === 0) return "—";
  const sign = d > 0 ? "+" : "";
  if (Math.abs(d) >= 1000) return `${sign}${(d / 1000).toFixed(1)}K`;
  return `${sign}${d.toLocaleString()}`;
}
