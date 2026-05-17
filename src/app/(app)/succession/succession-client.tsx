"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import type { SuccessionCandidate, Employee } from "@/types/database";
import { addCandidate, updateCandidate, promoteCandidate, removeCandidate, deleteCandidate } from "./actions";
import type { SuccessionActionResult } from "./actions";
import { Select } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  candidates: SuccessionCandidate[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const READINESS = {
  ready_now:    { label: "Ready now",     cls: "bg-green-100 text-green-700",  dot: "bg-green-500",  score: 4 },
  ready_1_year: { label: "1 year",        cls: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",   score: 3 },
  ready_2_plus: { label: "2+ years",      cls: "bg-amber-100 text-amber-700",  dot: "bg-amber-500",  score: 2 },
  not_ready:    { label: "Not ready",     cls: "bg-navy-100 text-navy-500",    dot: "bg-navy-300",   score: 1 },
} as const;

const POTENTIAL = {
  high:   { label: "High",   cls: "bg-purple-100 text-purple-700", stars: 3 },
  medium: { label: "Medium", cls: "bg-blue-100 text-blue-700",     stars: 2 },
  low:    { label: "Low",    cls: "bg-navy-100 text-navy-500",      stars: 1 },
} as const;

const PERFORMANCE = {
  exceeds: { label: "Exceeds",  cls: "bg-green-100 text-green-700" },
  meets:   { label: "Meets",    cls: "bg-amber-100 text-amber-700" },
  below:   { label: "Below",    cls: "bg-red-100 text-red-600" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < count ? "text-amber-400" : "text-navy-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Add / Edit Candidate Modal ───────────────────────────────────────────────

function CandidateModal({
  candidate,
  employees,
  onClose,
}: {
  candidate?: SuccessionCandidate;
  employees: EmployeeRow[];
  onClose: () => void;
}) {
  const action = candidate ? updateCandidate : addCandidate;
  const [state, formAction, isPending] = useActionState<SuccessionActionResult, FormData>(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">{candidate ? "Edit candidate" : "Add to talent pool"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {candidate && <input type="hidden" name="candidate_id" value={candidate.id} />}
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          {!candidate && (
            <div>
              <label htmlFor="sc-employee" className={labelCls}>Employee <span className="text-red-500">*</span></label>
              <Select
                id="sc-employee"
                name="employee_id"
                required
                options={[
                  { value: "", label: "Select employee..." },
                  ...employees.map((e) => ({
                    value: e.id,
                    label: `${e.full_name}${e.job_title ? ` - ${e.job_title}` : ""}`,
                  })),
                ]}
              />
              <select id="sc-employee-native" aria-hidden="true" disabled className="hidden">
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}{e.job_title ? ` — ${e.job_title}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="sc-target-role" className={labelCls}>Target role <span className="text-red-500">*</span></label>
            <input
              id="sc-target-role"
              name="target_role"
              required
              defaultValue={candidate?.target_role}
              className={inputCls}
              placeholder="e.g. Head of Engineering"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="sc-readiness" className={labelCls}>Readiness</label>
              <Select
                id="sc-readiness"
                name="readiness"
                defaultValue={candidate?.readiness ?? "not_ready"}
                options={Object.entries(READINESS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <select id="sc-readiness-native" aria-hidden="true" disabled className="hidden">
                {Object.entries(READINESS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sc-potential" className={labelCls}>Potential</label>
              <Select
                id="sc-potential"
                name="potential"
                defaultValue={candidate?.potential ?? "medium"}
                options={Object.entries(POTENTIAL).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <select id="sc-potential-native" aria-hidden="true" disabled className="hidden">
                {Object.entries(POTENTIAL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sc-performance" className={labelCls}>Performance</label>
              <Select
                id="sc-performance"
                name="performance"
                defaultValue={candidate?.performance ?? "meets"}
                options={Object.entries(PERFORMANCE).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <select id="sc-performance-native" aria-hidden="true" disabled className="hidden">
                {Object.entries(PERFORMANCE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="sc-dev-areas" className={labelCls}>Development areas</label>
            <textarea
              id="sc-dev-areas"
              name="development_areas"
              defaultValue={candidate?.development_areas ?? ""}
              className="flex min-h-[60px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Skills or experiences needed before promotion…"
            />
          </div>

          <div>
            <label htmlFor="sc-notes" className={labelCls}>Notes</label>
            <textarea
              id="sc-notes"
              name="notes"
              defaultValue={candidate?.notes ?? ""}
              className="flex min-h-[60px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Additional context…"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {isPending ? "Saving…" : candidate ? "Save changes" : "Add candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  emp,
  isAdmin,
}: {
  candidate: SuccessionCandidate;
  emp: EmployeeRow | undefined;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const readiness = READINESS[candidate.readiness] ?? READINESS.not_ready;
  const potential = POTENTIAL[candidate.potential] ?? POTENTIAL.medium;
  const performance = PERFORMANCE[candidate.performance] ?? PERFORMANCE.meets;
  const isPromoted = candidate.status === "promoted";
  const isRemoved = candidate.status === "removed";

  function handlePromote() {
    setMenuOpen(false);
    if (!confirm(`Mark ${emp?.full_name ?? "this candidate"} as promoted to "${candidate.target_role}"?`)) return;
    startTransition(() => { void promoteCandidate(candidate.id); });
  }

  function handleRemove() {
    setMenuOpen(false);
    startTransition(() => { void removeCandidate(candidate.id); });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm("Delete this candidate entry? This cannot be undone.")) return;
    startTransition(() => { void deleteCandidate(candidate.id); });
  }

  return (
    <>
      {showEdit && (
        <CandidateModal
          candidate={candidate}
          employees={emp ? [emp] : []}
          onClose={() => setShowEdit(false)}
        />
      )}
      <div className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all ${isPending ? "opacity-60" : ""} ${isPromoted ? "border-green-200 bg-green-50/30" : isRemoved ? "border-navy-100 opacity-60" : "border-navy-200 hover:shadow-sm"}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 font-bold text-sm flex-shrink-0">
              {emp?.full_name?.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{emp?.full_name ?? "Unknown"}</p>
              <p className="text-xs text-navy-400 truncate">{emp?.job_title ?? emp?.department ?? "—"}</p>
            </div>
          </div>
          {isAdmin && !isRemoved && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                aria-label="Candidate actions"
                onClick={() => setMenuOpen((v) => !v)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white border border-navy-200 rounded-xl shadow-lg py-1 w-44 text-sm">
                    <button type="button" onClick={() => { setMenuOpen(false); setShowEdit(true); }} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">
                      Edit candidate
                    </button>
                    {!isPromoted && (
                      <button type="button" onClick={handlePromote} className="w-full text-left px-4 py-2 hover:bg-green-50 text-green-700 transition-colors">
                        Mark as promoted
                      </button>
                    )}
                    <button type="button" onClick={handleRemove} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">
                      Remove from pool
                    </button>
                    <div className="border-t border-navy-100 my-1" />
                    <button type="button" onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Target role */}
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-navy-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-sm font-medium text-navy-700">{candidate.target_role}</span>
          {isPromoted && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-auto">✓ Promoted</span>
          )}
        </div>

        {/* Ratings row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-navy-50 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide mb-1">Readiness</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${readiness.dot}`} />
              <span className="text-xs font-semibold text-navy-700">{readiness.label}</span>
            </div>
          </div>
          <div className="bg-navy-50 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide mb-1">Potential</p>
            <Stars count={potential.stars} />
          </div>
          <div className="bg-navy-50 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide mb-1">Performance</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${performance.cls}`}>{performance.label}</span>
          </div>
        </div>

        {/* Development areas */}
        {candidate.development_areas && (
          <div>
            <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide mb-1">Development areas</p>
            <p className="text-xs text-navy-600 leading-relaxed line-clamp-2">{candidate.development_areas}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── 9-Box Grid ──────────────────────────────────────────────────────────────

function NineBoxGrid({
  candidates,
  empMap,
}: {
  candidates: SuccessionCandidate[];
  empMap: Record<string, EmployeeRow>;
}) {
  const active = candidates.filter((c) => c.status === "active");

  const cells: Record<string, SuccessionCandidate[]> = {};
  for (const c of active) {
    const key = `${c.performance}-${c.potential}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(c);
  }

  const rows: Array<{ perf: string; perfLabel: string }> = [
    { perf: "exceeds", perfLabel: "Exceeds" },
    { perf: "meets",   perfLabel: "Meets" },
    { perf: "below",   perfLabel: "Below" },
  ];
  const cols: Array<{ pot: string; potLabel: string }> = [
    { pot: "low",    potLabel: "Low potential" },
    { pot: "medium", potLabel: "Medium potential" },
    { pot: "high",   potLabel: "High potential" },
  ];

  const bgMap: Record<string, string> = {
    "exceeds-high":   "bg-green-50 border-green-200",
    "exceeds-medium": "bg-blue-50 border-blue-200",
    "exceeds-low":    "bg-amber-50 border-amber-200",
    "meets-high":     "bg-blue-50 border-blue-200",
    "meets-medium":   "bg-navy-50 border-navy-200",
    "meets-low":      "bg-navy-50 border-navy-100",
    "below-high":     "bg-amber-50 border-amber-200",
    "below-medium":   "bg-navy-50 border-navy-100",
    "below-low":      "bg-red-50 border-red-100",
  };

  const labelMap: Record<string, string> = {
    "exceeds-high":   "Star",
    "exceeds-medium": "High performer",
    "exceeds-low":    "Solid contributor",
    "meets-high":     "Future star",
    "meets-medium":   "Core player",
    "meets-low":      "Inconsistent",
    "below-high":     "Rough diamond",
    "below-medium":   "Needs support",
    "below-low":      "Underperformer",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-navy-700">9-Box Talent Grid</h2>
        <p className="text-xs text-navy-400">Performance (rows) × Potential (columns)</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Column headers */}
          <div className="grid grid-cols-4 gap-2 mb-2 pl-16">
            {cols.map((c) => (
              <div key={c.pot} className="text-center text-xs font-semibold text-navy-500">{c.potLabel}</div>
            ))}
          </div>
          {/* Grid rows */}
          {rows.map((row) => (
            <div key={row.perf} className="grid grid-cols-4 gap-2 mb-2">
              <div className="flex items-center justify-end pr-3 text-xs font-semibold text-navy-500 text-right leading-tight">
                {row.perfLabel}
              </div>
              {cols.map((col) => {
                const key = `${row.perf}-${col.pot}`;
                const people = cells[key] ?? [];
                return (
                  <div key={col.pot} className={`rounded-xl border p-2 min-h-[80px] ${bgMap[key] ?? "bg-navy-50 border-navy-100"}`}>
                    <p className="text-[10px] font-semibold text-navy-400 mb-1.5">{labelMap[key]}</p>
                    <div className="flex flex-wrap gap-1">
                      {people.map((c) => {
                        const emp = empMap[c.employee_id];
                        return (
                          <span
                            key={c.id}
                            title={`${emp?.full_name ?? "?"} → ${c.target_role}`}
                            className="h-6 w-6 rounded-full bg-white border border-navy-200 flex items-center justify-center text-[10px] font-bold text-navy-700 cursor-default"
                          >
                            {emp?.full_name?.slice(0, 2).toUpperCase() ?? "?"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

type View = "pool" | "grid";

export function SuccessionClient({ candidates, employees, isAdmin }: Props) {
  const [view, setView] = useState<View>("pool");
  const [showAdd, setShowAdd] = useState(false);
  const [filterReadiness, setFilterReadiness] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [search, setSearch] = useState("");

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  // Stats
  const active = candidates.filter((c) => c.status === "active");
  const readyNow = active.filter((c) => c.readiness === "ready_now").length;
  const highPotential = active.filter((c) => c.potential === "high").length;
  const promoted = candidates.filter((c) => c.status === "promoted").length;

  const filtered = candidates.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterReadiness !== "all" && c.readiness !== filterReadiness) return false;
    if (search) {
      const emp = empMap[c.employee_id];
      const q = search.toLowerCase();
      if (
        !emp?.full_name.toLowerCase().includes(q) &&
        !c.target_role.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <>
      {showAdd && (
        <CandidateModal
          employees={employees}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "In talent pool",  value: active.length },
          { label: "Ready now",       value: readyNow,      warn: readyNow > 0 },
          { label: "High potential",  value: highPotential },
          { label: "Promoted",        value: promoted },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-navy-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.warn ? "text-green-600" : "text-navy-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        {/* View toggle */}
        <div className="flex rounded-xl border border-navy-200 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setView("pool")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "pool" ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-700"}`}
          >
            Talent Pool
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "grid" ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-700"}`}
          >
            9-Box Grid
          </button>
        </div>

        <input
          type="search"
          placeholder="Search name or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search candidates"
          className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-blue-600 w-48"
        />
        <Select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-52"
          triggerClassName="h-9"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "promoted", label: "Promoted" },
            { value: "removed", label: "Removed" },
          ]}
        />
        <select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled
          className="hidden"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="promoted">Promoted</option>
          <option value="removed">Removed</option>
        </select>
        <Select
          aria-label="Filter by readiness"
          value={filterReadiness}
          onChange={setFilterReadiness}
          className="w-64"
          triggerClassName="h-9"
          options={[
            { value: "all", label: "All readiness" },
            ...Object.entries(READINESS).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <select
          aria-label="Filter by readiness"
          value={filterReadiness}
          onChange={(e) => setFilterReadiness(e.target.value)}
          disabled
          className="hidden"
        >
          <option value="all">All readiness</option>
          {Object.entries(READINESS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="sm:ml-auto inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add candidate
          </button>
        )}
      </div>

      {/* 9-Box Grid view */}
      {view === "grid" && (
        <div className="bg-white rounded-2xl border border-navy-200 p-6">
          <NineBoxGrid candidates={candidates} empMap={empMap} />
        </div>
      )}

      {/* Talent Pool view */}
      {view === "pool" && (
        candidates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-navy-200">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">No candidates in talent pool</h3>
            <p className="text-sm text-navy-500 mb-5">
              {isAdmin ? "Identify high-potential employees and track their readiness for key roles." : "No succession candidates have been added yet."}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Add candidate
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-navy-200">
            <p className="text-sm text-navy-400">No candidates match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                emp={empMap[c.employee_id]}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )
      )}
    </>
  );
}
