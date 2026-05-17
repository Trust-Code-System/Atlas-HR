"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { ExitRecord, ExitChecklistItem, Employee } from "@/types/database";
import { initiateExit, updateExitRecord, updateChecklistItem, addChecklistItem, deleteExit } from "./actions";
import type { ExitActionResult } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  exits: ExitRecord[];
  items: ExitChecklistItem[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXIT_REASONS = [
  { key: "resignation",  label: "Resignation" },
  { key: "termination",  label: "Termination" },
  { key: "redundancy",   label: "Redundancy" },
  { key: "retirement",   label: "Retirement" },
  { key: "contract_end", label: "Contract end" },
  { key: "other",        label: "Other" },
] as const;

const EXIT_STATUSES = {
  initiated:   { label: "Initiated",   cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700" },
} as const;

const STATUS_VISUAL = {
  initiated: {
    label: "Initiated",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    strip: "from-blue-400 to-blue-600",
    grad: "from-blue-500 to-blue-700",
    ring: "#3b82f6",
  },
  in_progress: {
    label: "In progress",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    strip: "from-amber-400 to-orange-500",
    grad: "from-amber-500 to-orange-600",
    ring: "#f59e0b",
  },
  completed: {
    label: "Completed",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    strip: "from-emerald-400 to-teal-500",
    grad: "from-emerald-500 to-teal-600",
    ring: "#10b981",
  },
};

const CHECKLIST_CATEGORIES = [
  { key: "equipment",     label: "Equipment",     icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "bg-blue-100 text-blue-700",    pill: "bg-blue-50 text-blue-700",    hdr: "bg-blue-50/60 text-blue-700" },
  { key: "access",        label: "Access",        icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z", color: "bg-purple-100 text-purple-700", pill: "bg-purple-50 text-purple-700", hdr: "bg-purple-50/60 text-purple-700" },
  { key: "documentation", label: "Documentation", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-amber-100 text-amber-700",  pill: "bg-amber-50 text-amber-700",   hdr: "bg-amber-50/60 text-amber-700" },
  { key: "finance",       label: "Finance",       icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-emerald-100 text-emerald-700", pill: "bg-emerald-50 text-emerald-700", hdr: "bg-emerald-50/60 text-emerald-700" },
  { key: "other",         label: "Other",         icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "bg-navy-100 text-navy-600",    pill: "bg-slate-50 text-slate-600",   hdr: "bg-slate-50/60 text-slate-600" },
] as const;

const ITEM_STATUSES = {
  pending:        { label: "Pending",     cls: "bg-navy-100 text-navy-500" },
  in_progress:    { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  completed:      { label: "Completed",   cls: "bg-emerald-100 text-emerald-700" },
  not_applicable: { label: "N/A",         cls: "bg-slate-100 text-slate-500" },
} as const;

const KPI_CONFIGS = [
  { label: "Total exits",  key: "total"       as const, strip: "from-violet-400 to-purple-500", grad: "from-violet-500 to-purple-600", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
  { label: "Initiated",    key: "initiated"   as const, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { label: "In progress",  key: "in_progress" as const, strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { label: "Completed",    key: "completed"   as const, strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCat(key: string) {
  return CHECKLIST_CATEGORIES.find((c) => c.key === key) ?? CHECKLIST_CATEGORIES[CHECKLIST_CATEGORIES.length - 1];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusVis(status: string) {
  return STATUS_VISUAL[status as keyof typeof STATUS_VISUAL] ?? STATUS_VISUAL.initiated;
}

function initials(name?: string | null) {
  if (!name) return "??";
  return name.slice(0, 2).toUpperCase();
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function MiniRing({ pct, color }: { pct: number; color: string }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" />
      <text x="18" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">{pct}%</text>
    </svg>
  );
}

function DetailRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? "#10b981" : "#3b82f6";
  return (
    <svg viewBox="0 0 72 72" width={72} height={72} className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" />
      <text x="36" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">{pct}%</text>
      <text x="36" y="44" textAnchor="middle" fontSize="7" fill="#64748b">{done}/{total} tasks</text>
    </svg>
  );
}

function ProgressBar({ pct, color = "bg-blue-500" }: { pct: number; color?: string }) {
  const capped = Math.min(pct, 100);
  return (
    <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden">
      <div
        ref={(el) => { if (el) el.style.width = `${capped}%`; }}
        className={`h-full rounded-full transition-all ${color}`}
      />
    </div>
  );
}

function Ico({ path, cls = "h-5 w-5" }: { path: string; cls?: string }) {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

// ─── Shared form styles ───────────────────────────────────────────────────────

const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

// ─── Initiate Exit Modal ──────────────────────────────────────────────────────

function InitiateExitModal({ employees, existingEmployeeIds, onClose }: {
  employees: EmployeeRow[];
  existingEmployeeIds: Set<string>;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ExitActionResult, FormData>(initiateExit, null);

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  const eligible = employees.filter((e) => !existingEmployeeIds.has(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-linear-to-r from-blue-400 to-blue-600" />
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
              <Ico path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" cls="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-navy-900">Initiate exit process</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors">
            <Ico path="M6 18L18 6M6 6l12 12" cls="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="px-6 py-5 space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div>
            <label htmlFor="exit-employee" className={labelCls}>Employee <span className="text-red-500">*</span></label>
            <Select
              id="exit-employee"
              name="employee_id"
              required
              options={[
                { value: "", label: "Select employee…" },
                ...eligible.map((e) => ({
                  value: e.id,
                  label: `${e.full_name}${e.job_title ? ` — ${e.job_title}` : ""}`,
                })),
              ]}
            />
          </div>

          <div>
            <label htmlFor="exit-reason" className={labelCls}>Reason for leaving</label>
            <Select id="exit-reason" name="reason" options={EXIT_REASONS.map((r) => ({ value: r.key, label: r.label }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exit-last-day" className={labelCls}>Last working day</label>
              <DatePicker id="exit-last-day" name="last_working_day" placeholder="Select date" />
            </div>
            <div>
              <label htmlFor="exit-date" className={labelCls}>Exit date</label>
              <DatePicker id="exit-date" name="exit_date" placeholder="Select date" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-navy-100">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60">
              {isPending ? "Initiating…" : "Initiate exit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Exit Modal ──────────────────────────────────────────────────────────

function EditExitModal({ exit, onClose }: { exit: ExitRecord; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ExitActionResult, FormData>(updateExitRecord, null);
  const vis = getStatusVis(exit.status);

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className={`h-1.5 bg-linear-to-r ${vis.strip}`} />
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl bg-linear-to-br ${vis.grad} flex items-center justify-center text-white shadow-sm`}>
              <Ico path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" cls="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-navy-900">Edit exit record</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors">
            <Ico path="M6 18L18 6M6 6l12 12" cls="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <input type="hidden" name="exit_id" value={exit.id} />
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-reason" className={labelCls}>Reason</label>
              <Select id="edit-reason" name="reason" defaultValue={exit.reason} options={EXIT_REASONS.map((r) => ({ value: r.key, label: r.label }))} />
            </div>
            <div>
              <label htmlFor="edit-status" className={labelCls}>Status</label>
              <Select id="edit-status" name="status" defaultValue={exit.status} options={Object.entries(EXIT_STATUSES).map(([k, v]) => ({ value: k, label: v.label }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-last-day" className={labelCls}>Last working day</label>
              <DatePicker id="edit-last-day" name="last_working_day" defaultValue={exit.last_working_day ?? ""} placeholder="Select date" />
            </div>
            <div>
              <label htmlFor="edit-exit-date" className={labelCls}>Exit date</label>
              <DatePicker id="edit-exit-date" name="exit_date" defaultValue={exit.exit_date ?? ""} placeholder="Select date" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-interview-date" className={labelCls}>Exit interview date</label>
            <DatePicker id="edit-interview-date" name="exit_interview_date" defaultValue={exit.exit_interview_date ?? ""} placeholder="Select date" />
          </div>

          <div>
            <label htmlFor="edit-interview-notes" className={labelCls}>Exit interview notes</label>
            <textarea
              id="edit-interview-notes"
              name="exit_interview_notes"
              defaultValue={exit.exit_interview_notes ?? ""}
              className="flex min-h-[80px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Notes from exit interview…"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-navy-100">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className={`inline-flex items-center gap-2 text-sm font-semibold bg-linear-to-r ${vis.strip} text-white px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60`}>
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Checklist Item Modal ─────────────────────────────────────────────────

function AddItemModal({ exitId, onClose }: { exitId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ExitActionResult, FormData>(addChecklistItem, null);

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-linear-to-r from-violet-400 to-purple-500" />
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Ico path="M12 4v16m8-8H4" cls="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-navy-900">Add checklist item</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors">
            <Ico path="M6 18L18 6M6 6l12 12" cls="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="px-6 py-5 space-y-4">
          <input type="hidden" name="exit_id" value={exitId} />
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div>
            <label htmlFor="item-title" className={labelCls}>Task title <span className="text-red-500">*</span></label>
            <input id="item-title" name="title" required className={inputCls} placeholder="e.g. Return parking permit" />
          </div>

          <div>
            <label htmlFor="item-category" className={labelCls}>Category</label>
            <Select id="item-category" name="category" options={CHECKLIST_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
          </div>

          <div>
            <label htmlFor="item-due-date" className={labelCls}>Due date</label>
            <DatePicker id="item-due-date" name="due_date" placeholder="Select due date" />
          </div>

          <div>
            <label htmlFor="item-description" className={labelCls}>Description</label>
            <textarea
              id="item-description"
              name="description"
              className="flex min-h-[60px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Optional details…"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-navy-100">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60">
              {isPending ? "Adding…" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Checklist Item Row ───────────────────────────────────────────────────────

function ChecklistItemRow({ item, isAdmin }: { item: ExitChecklistItem; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();
  const cat = getCat(item.category);
  const statusCfg = ITEM_STATUSES[item.status] ?? ITEM_STATUSES.pending;
  const isDone = item.status === "completed";
  const isOverdue = !!item.due_date && new Date(item.due_date) < new Date() && !isDone;

  function handleStatus(next: ExitChecklistItem["status"]) {
    startTransition(() => { void updateChecklistItem(item.id, next); });
  }

  return (
    <div className={`flex items-center gap-3 py-3 px-4 transition-all hover:bg-navy-50/50 ${isPending ? "opacity-50" : ""}`}>
      <button
        type="button"
        aria-label={isDone ? "Mark as pending" : "Mark as completed"}
        disabled={!isAdmin || isPending}
        onClick={() => handleStatus(isDone ? "pending" : "completed")}
        className={`h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
          isDone
            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
            : "border-navy-300 hover:border-emerald-400 hover:bg-emerald-50"
        } ${!isAdmin ? "cursor-default" : "cursor-pointer"}`}
      >
        {isDone && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className={`flex items-center justify-center h-6 w-6 rounded-md shrink-0 ${cat.pill}`}>
        <Ico path={cat.icon} cls="h-3.5 w-3.5" />
      </span>

      <div className="flex-1 min-w-0">
        <span className={`text-sm ${isDone ? "line-through text-navy-400" : "text-navy-800 font-medium"}`}>
          {item.title}
        </span>
        {item.due_date && (
          <span className={`ml-2 text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-navy-400"}`}>
            (due {fmtDate(item.due_date)}{isOverdue ? " · overdue" : ""})
          </span>
        )}
      </div>

      {isAdmin && (
        <Select
          aria-label="Item status"
          value={item.status}
          disabled={isPending}
          onChange={(value) => handleStatus(value as ExitChecklistItem["status"])}
          className="w-32"
          triggerClassName={`h-7 rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${statusCfg.cls} ${isPending ? "opacity-60" : ""}`}
          options={Object.entries(ITEM_STATUSES).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      )}
    </div>
  );
}

// ─── Exit Detail Panel ────────────────────────────────────────────────────────

function ExitDetailPanel({ exit, items, emp, isAdmin, onClose }: {
  exit: ExitRecord;
  items: ExitChecklistItem[];
  emp: EmployeeRow | undefined;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [isPending, startTransition] = useTransition();

  const vis = getStatusVis(exit.status);
  const total = items.length;
  const done = items.filter((i) => i.status === "completed").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const byCategory = CHECKLIST_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.key),
  })).filter((g) => g.items.length > 0);

  const metaItems = [
    { label: "Reason",        value: EXIT_REASONS.find((r) => r.key === exit.reason)?.label ?? exit.reason, icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Last day",      value: fmtDate(exit.last_working_day), icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Exit date",     value: fmtDate(exit.exit_date), icon: "M17 16l4-4m0 0l-4-4m4 4H7" },
    { label: "Interview",     value: fmtDate(exit.exit_interview_date), icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  ];

  function handleDelete() {
    if (!confirm("Delete this exit record? All checklist items will be lost.")) return;
    startTransition(() => { void deleteExit(exit.id); });
    onClose();
  }

  return (
    <>
      {showEdit && <EditExitModal exit={exit} onClose={() => setShowEdit(false)} />}
      {showAddItem && <AddItemModal exitId={exit.id} onClose={() => setShowAddItem(false)} />}

      <div className={`bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm ${isPending ? "opacity-60" : ""}`}>
        {/* Status strip */}
        <div className={`h-1.5 bg-linear-to-r ${vis.strip}`} />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${vis.grad} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
              {initials(emp?.full_name)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">{emp?.full_name ?? "Unknown employee"}</h3>
              <p className="text-sm text-navy-500">{emp?.job_title ?? emp?.department ?? "—"}</p>
              <span className={`mt-1.5 inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full ${vis.pill}`}>
                {vis.label}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0 ml-2">
            <DetailRing pct={pct} done={done} total={total} />
            <button type="button" onClick={onClose} aria-label="Close panel"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors">
              <Ico path="M6 18L18 6M6 6l12 12" cls="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-navy-100 border-y border-navy-100">
          {metaItems.map((m) => (
            <div key={m.label} className="bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 text-navy-400 mb-1">
                <Ico path={m.icon} cls="h-3.5 w-3.5 shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-wide">{m.label}</p>
              </div>
              <p className="text-sm font-semibold text-navy-800">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div className="divide-y divide-navy-100">
          {byCategory.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-navy-100 flex items-center justify-center text-navy-400">
                <Ico path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" cls="h-6 w-6" />
              </div>
              <p className="text-sm text-navy-400">No checklist items yet.</p>
            </div>
          )}
          {byCategory.map((group) => (
            <div key={group.key}>
              <div className={`flex items-center gap-2 px-4 py-2.5 ${group.hdr}`}>
                <Ico path={group.icon} cls="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">{group.label}</span>
                <span className="ml-auto text-[10px] font-semibold opacity-70">
                  {group.items.filter((i) => i.status === "completed").length}/{group.items.length}
                </span>
              </div>
              <div className="divide-y divide-navy-50">
                {group.items.map((item) => (
                  <ChecklistItemRow key={item.id} item={item} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interview notes */}
        {exit.exit_interview_notes && (
          <div className="px-5 py-4 border-t border-navy-100 bg-amber-50/40">
            <div className="flex items-center gap-2 mb-2">
              <Ico path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" cls="h-4 w-4 text-amber-500" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Exit interview notes</p>
            </div>
            <p className="text-sm text-navy-700 whitespace-pre-line leading-relaxed">{exit.exit_interview_notes}</p>
          </div>
        )}

        {/* Footer */}
        {isAdmin && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-navy-100 bg-navy-50/30">
            <button type="button" onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <Ico path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" cls="h-3.5 w-3.5" />
              Delete record
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowAddItem(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-navy-200 bg-white hover:bg-navy-50 text-navy-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <Ico path="M12 4v16m8-8H4" cls="h-3.5 w-3.5" />
                Add item
              </button>
              <button type="button" onClick={() => setShowEdit(true)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold bg-linear-to-r ${vis.strip} text-white px-3 py-1.5 rounded-lg transition-all shadow-sm`}>
                <Ico path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" cls="h-3.5 w-3.5" />
                Edit record
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ExitClient({ exits, items, employees, isAdmin }: Props) {
  const [showInitiate, setShowInitiate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(exits[0]?.id ?? null);
  const [filterStatus, setFilterStatus] = useState("all");

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const existingEmployeeIds = new Set(exits.map((e) => e.employee_id));

  const filteredExits = exits.filter((e) => filterStatus === "all" || e.status === filterStatus);
  const selectedExit = exits.find((e) => e.id === selectedId) ?? null;
  const selectedItems = selectedExit ? items.filter((i) => i.exit_id === selectedExit.id) : [];

  const counts = {
    total:       exits.length,
    initiated:   exits.filter((e) => e.status === "initiated").length,
    in_progress: exits.filter((e) => e.status === "in_progress").length,
    completed:   exits.filter((e) => e.status === "completed").length,
  };

  return (
    <>
      {showInitiate && (
        <InitiateExitModal
          employees={employees}
          existingEmployeeIds={existingEmployeeIds}
          onClose={() => setShowInitiate(false)}
        />
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CONFIGS.map((cfg) => (
          <div key={cfg.key} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${cfg.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${cfg.grad} text-white shadow-sm`}>
              <Ico path={cfg.icon} cls="h-5 w-5" />
            </div>
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{counts[cfg.key]}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <Select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-full sm:w-44"
          triggerClassName="h-9 text-navy-700"
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(EXIT_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <span className="text-sm text-navy-500 sm:ml-auto">
          {filteredExits.length} record{filteredExits.length !== 1 ? "s" : ""}
        </span>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowInitiate(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Ico path="M12 4v16m8-8H4" cls="h-4 w-4" />
            Initiate exit
          </button>
        )}
      </div>

      {exits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-navy-200 shadow-sm">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center text-navy-400 shadow-sm">
            <Ico path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" cls="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">No exit records</h3>
          <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">
            {isAdmin ? "Start the offboarding process for a departing employee." : "No offboarding records have been created yet."}
          </p>
          {isAdmin && (
            <button type="button" onClick={() => setShowInitiate(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md">
              <Ico path="M12 4v16m8-8H4" cls="h-4 w-4" />
              Initiate exit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: list */}
          <div className="lg:col-span-1 space-y-2">
            {filteredExits.map((exit) => {
              const emp = empMap[exit.employee_id];
              const exitItems = items.filter((i) => i.exit_id === exit.id);
              const done = exitItems.filter((i) => i.status === "completed").length;
              const total = exitItems.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const vis = getStatusVis(exit.status);
              const isSelected = exit.id === selectedId;

              return (
                <button
                  key={exit.id}
                  type="button"
                  onClick={() => setSelectedId(exit.id)}
                  className={`group w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/60 shadow-md ring-1 ring-blue-200/50"
                      : "border-navy-200 bg-white hover:shadow-md hover:border-navy-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 shrink-0 rounded-xl bg-linear-to-br ${vis.grad} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {initials(emp?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{emp?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-navy-400 truncate">{emp?.job_title ?? emp?.department ?? "—"}</p>
                    </div>
                    <MiniRing pct={pct} color={vis.ring} />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vis.pill}`}>{vis.label}</span>
                    <span className="text-xs text-navy-400">{EXIT_REASONS.find((r) => r.key === exit.reason)?.label ?? exit.reason}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ProgressBar pct={pct} color={pct === 100 ? "bg-emerald-500" : "bg-blue-500"} />
                    <span className="text-[10px] font-semibold text-navy-500 tabular-nums shrink-0">{done}/{total}</span>
                  </div>

                  {exit.last_working_day && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-navy-400">
                      <Ico path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" cls="h-3 w-3 shrink-0" />
                      Last day: {fmtDate(exit.last_working_day)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: detail */}
          <div className="lg:col-span-2">
            {selectedExit ? (
              <ExitDetailPanel
                exit={selectedExit}
                items={selectedItems}
                emp={empMap[selectedExit.employee_id]}
                isAdmin={isAdmin}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-navy-200 flex flex-col items-center justify-center h-48 shadow-sm">
                <Ico path="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" cls="h-8 w-8 text-navy-300 mb-2" />
                <p className="text-sm font-medium text-navy-400">Select a record to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
