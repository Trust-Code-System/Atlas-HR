"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { DisciplinaryCase, Employee } from "@/types/database";
import { createCase, updateCaseStatus, resolveCase, deleteCase } from "./actions";
import type { DisciplinaryActionResult } from "./actions";

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  cases: DisciplinaryCase[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CASE_TYPES = [
  { key: "query",       label: "Query",       color: "bg-sky-100 text-sky-700" },
  { key: "warning",     label: "Warning",     color: "bg-amber-100 text-amber-700" },
  { key: "suspension",  label: "Suspension",  color: "bg-orange-100 text-orange-700" },
  { key: "termination", label: "Termination", color: "bg-red-100 text-red-700" },
  { key: "other",       label: "Other",       color: "bg-navy-100 text-navy-600" },
] as const;

const SEVERITIES = [
  { key: "minor",            label: "Minor",            color: "bg-green-100 text-green-700" },
  { key: "moderate",         label: "Moderate",         color: "bg-amber-100 text-amber-700" },
  { key: "serious",          label: "Serious",          color: "bg-orange-100 text-orange-700" },
  { key: "gross_misconduct", label: "Gross misconduct", color: "bg-red-100 text-red-700" },
] as const;

const STATUSES = {
  open:         { label: "Open",         color: "bg-blue-100 text-blue-700" },
  under_review: { label: "Under review", color: "bg-amber-100 text-amber-700" },
  resolved:     { label: "Resolved",     color: "bg-green-100 text-green-700" },
  closed:       { label: "Closed",       color: "bg-navy-100 text-navy-500" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getType(key: string) { return CASE_TYPES.find((t) => t.key === key) ?? CASE_TYPES[CASE_TYPES.length - 1]; }
function getSeverity(key: string) { return SEVERITIES.find((s) => s.key === key) ?? SEVERITIES[0]; }
function getStatus(key: string) { return STATUSES[key as keyof typeof STATUSES] ?? STATUSES.open; }

const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";
const textareaCls = "flex w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none";

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateCaseModal({ employees, onClose }: { employees: EmployeeRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<DisciplinaryActionResult, FormData>(createCase, null);

  // Controlled so the AI attendance draft (§4) can prefill them.
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  async function draftFromAttendance() {
    if (!employeeId) { setDraftError("Select an employee first."); return; }
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/ai/attendance-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, focus: title || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setDraftError(data?.error ?? "Couldn't draft."); return; }
      if (data.title && !title) setTitle(data.title);
      if (data.severity) setSeverity(data.severity);
      if (data.description) setDescription(data.description);
    } catch {
      setDraftError("Something went wrong drafting the note.");
    } finally {
      setDrafting(false);
    }
  }

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Open disciplinary case</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}
          <div>
            <label className={labelCls} htmlFor="dc-employee">Employee <span className="text-red-500">*</span></label>
            <Select
              id="dc-employee"
              name="employee_id"
              required
              aria-label="Employee"
              value={employeeId}
              onChange={setEmployeeId}
              options={[
                { value: "", label: "Select employee…" },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.full_name}${e.department ? ` — ${e.department}` : ""}`,
                })),
              ]}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="dc-title">Title <span className="text-red-500">*</span></label>
            <input id="dc-title" name="title" required className={inputCls} placeholder="e.g. Repeated tardiness — formal warning" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="dc-type">Type</label>
              <Select id="dc-type" name="type" aria-label="Case type" options={CASE_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-severity">Severity</label>
              <Select id="dc-severity" name="severity" aria-label="Severity" value={severity} onChange={setSeverity} options={SEVERITIES.map((s) => ({ value: s.key, label: s.label }))} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="dc-date">Incident date <span className="text-red-500">*</span></label>
            <DatePicker id="dc-date" name="incident_date" defaultValue={new Date().toISOString().split("T")[0]} placeholder="Select incident date" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelCls} mb-0`} htmlFor="dc-description">Description</label>
              <button
                type="button"
                onClick={() => void draftFromAttendance()}
                disabled={drafting || !employeeId}
                title={employeeId ? "Draft a factual attendance note from this employee's logged time entries" : "Select an employee first"}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
              >
                {drafting ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                AI draft from attendance
              </button>
            </div>
            {draftError && <p className="text-xs text-red-600 mb-1.5">{draftError}</p>}
            <textarea id="dc-description" name="description" className={`${textareaCls} min-h-[90px]`} placeholder="Describe the incident, evidence, and any prior discussions…" value={description} onChange={(e) => setDescription(e.target.value)} />
            <p className="text-[11px] text-navy-400 mt-1">AI drafts are based on logged time entries — review and verify before opening the case.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {isPending ? "Opening…" : "Open case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Resolve Modal ────────────────────────────────────────────────────────────

function ResolveModal({ caseItem, onClose }: { caseItem: DisciplinaryCase; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<DisciplinaryActionResult, FormData>(resolveCase, null);

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Resolve case</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-sm text-navy-600 mb-4">Resolving: <strong className="text-navy-900">{caseItem.title}</strong></p>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="case_id" value={caseItem.id} />
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}
          <div>
            <label className={labelCls} htmlFor="resolve-status">Resolution status</label>
            <Select
              id="resolve-status"
              name="status"
              aria-label="Resolution status"
              options={[
                { value: "resolved", label: "Resolved — action taken, case closed" },
                { value: "closed", label: "Closed — no further action" },
              ]}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="resolve-outcome">Outcome / notes</label>
            <textarea id="resolve-outcome" name="outcome" className={`${textareaCls} min-h-[90px]`} placeholder="Describe the outcome, any sanctions issued, or reasons for closure…" defaultValue={caseItem.outcome ?? ""} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {isPending ? "Saving…" : "Resolve case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Case Row ─────────────────────────────────────────────────────────────────

function CaseRow({
  caseItem,
  employee,
  isAdmin,
  onResolve,
}: {
  caseItem: DisciplinaryCase;
  employee: EmployeeRow | undefined;
  isAdmin: boolean;
  onResolve: (c: DisciplinaryCase) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const type = getType(caseItem.type);
  const severity = getSeverity(caseItem.severity);
  const status = getStatus(caseItem.status);
  const isOpen = caseItem.status === "open" || caseItem.status === "under_review";

  function handleStatusChange(s: DisciplinaryCase["status"]) {
    setMenuOpen(false);
    startTransition(() => { void updateCaseStatus(caseItem.id, s); });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm("Delete this case permanently?")) return;
    startTransition(() => { void deleteCase(caseItem.id); });
  }

  return (
    <>
      <div
        className={`grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-navy-50/50 transition-colors cursor-pointer ${isPending ? "opacity-50" : ""}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Employee */}
        <div className="col-span-3 min-w-0">
          {employee ? (
            <>
              <p className="text-sm font-semibold text-navy-800 truncate">{employee.full_name}</p>
              <p className="text-xs text-navy-400 truncate">{employee.department ?? employee.job_title ?? "—"}</p>
            </>
          ) : (
            <p className="text-sm text-navy-400 italic">Unknown</p>
          )}
        </div>
        {/* Title */}
        <div className="col-span-3 min-w-0">
          <p className="text-sm text-navy-700 truncate">{caseItem.title}</p>
        </div>
        {/* Type */}
        <div className="col-span-2 hidden sm:block">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type.color}`}>{type.label}</span>
        </div>
        {/* Severity */}
        <div className="col-span-2 hidden md:block">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severity.color}`}>{severity.label}</span>
        </div>
        {/* Status */}
        <div className="col-span-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
        </div>
        {/* Actions */}
        {isAdmin && (
          <div className="col-span-12 sm:col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                type="button"
                aria-label="Case actions"
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
                    {caseItem.status === "open" && (
                      <button type="button" onClick={() => handleStatusChange("under_review")} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">Move to review</button>
                    )}
                    {isOpen && (
                      <button type="button" onClick={() => { setMenuOpen(false); onResolve(caseItem); }} className="w-full text-left px-4 py-2 hover:bg-green-50 text-green-700 transition-colors">Resolve case</button>
                    )}
                    {caseItem.status !== "closed" && (
                      <button type="button" onClick={() => handleStatusChange("closed")} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">Close (no action)</button>
                    )}
                    <div className="border-t border-navy-100 my-1" />
                    <button type="button" onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-navy-50 bg-navy-50/30 grid sm:grid-cols-2 gap-5">
          <div className="pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">Incident date</p>
            <p className="text-sm text-navy-700">
              {new Date(caseItem.incident_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {caseItem.description && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1 mt-4">Description</p>
                <p className="text-sm text-navy-700 whitespace-pre-line">{caseItem.description}</p>
              </>
            )}
          </div>
          <div className="pt-4">
            {caseItem.outcome && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">Outcome</p>
                <p className="text-sm text-navy-700 whitespace-pre-line">{caseItem.outcome}</p>
              </>
            )}
            {caseItem.resolved_at && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1 mt-4">Resolved</p>
                <p className="text-sm text-navy-700">
                  {new Date(caseItem.resolved_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function DisciplinaryClient({ cases, employees, isAdmin }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<DisciplinaryCase | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [search, setSearch] = useState("");

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const filtered = cases.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterEmployee !== "all" && c.employee_id !== filterEmployee) return false;
    if (search) {
      const q = search.toLowerCase();
      const emp = empMap[c.employee_id];
      const empName = emp ? emp.full_name.toLowerCase() : "";
      if (!c.title.toLowerCase().includes(q) && !empName.includes(q)) return false;
    }
    return true;
  });

  // Stats
  const open = cases.filter((c) => c.status === "open").length;
  const underReview = cases.filter((c) => c.status === "under_review").length;
  const resolved = cases.filter((c) => c.status === "resolved" || c.status === "closed").length;
  const warnings = cases.filter((c) => c.type === "warning").length;

  return (
    <>
      {showCreate && <CreateCaseModal employees={employees} onClose={() => setShowCreate(false)} />}
      {resolveTarget && <ResolveModal caseItem={resolveTarget} onClose={() => setResolveTarget(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Open cases",    value: open,        warn: open > 0 },
          { label: "Under review",  value: underReview, warn: underReview > 0 },
          { label: "Resolved",      value: resolved },
          { label: "Warnings",      value: warnings },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-navy-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.warn ? "text-amber-600" : "text-navy-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases…"
            className="pl-9 pr-4 h-9 w-full rounded-xl border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <Select
          aria-label="Filter by employee"
          value={filterEmployee}
          onChange={setFilterEmployee}
          className="w-full sm:w-48"
          triggerClassName="h-9 text-navy-700"
          options={[{ value: "all", label: "All employees" }, ...employees.map((e) => ({ value: e.id, label: e.full_name }))]}
        />
        <Select
          aria-label="Filter by type"
          value={filterType}
          onChange={setFilterType}
          className="w-full sm:w-40"
          triggerClassName="h-9 text-navy-700"
          options={[{ value: "all", label: "All types" }, ...CASE_TYPES.map((t) => ({ value: t.key, label: t.label }))]}
        />
        <Select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-full sm:w-44"
          triggerClassName="h-9 text-navy-700"
          options={[{ value: "all", label: "All statuses" }, ...Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Open case
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-navy-50 border-b border-navy-200 text-xs font-semibold text-navy-500 uppercase tracking-wide">
            <div className="col-span-3">Employee</div>
            <div className="col-span-3">Case title</div>
            <div className="col-span-2 hidden sm:block">Type</div>
            <div className="col-span-2 hidden md:block">Severity</div>
            <div className="col-span-2">Status</div>
            {isAdmin && <div className="col-span-1" />}
          </div>
          <div className="divide-y divide-navy-100">
            {filtered.map((c) => (
              <CaseRow
                key={c.id}
                caseItem={c}
                employee={empMap[c.employee_id]}
                isAdmin={isAdmin}
                onResolve={setResolveTarget}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-navy-200">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-base font-semibold text-navy-900 mb-1">
            {cases.length === 0 ? "No disciplinary cases" : "No cases match your filters"}
          </h3>
          <p className="text-sm text-navy-500 mb-5">
            {cases.length === 0
              ? "Open a case to start tracking disciplinary actions."
              : "Try adjusting your search or filters."}
          </p>
          {isAdmin && cases.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">
              Open a case
            </button>
          )}
        </div>
      )}
    </>
  );
}
