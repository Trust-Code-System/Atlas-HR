"use client";

import { useState, useTransition, useActionState, useEffect, useRef } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createClient } from "@/lib/supabase/client";
import type { Expense, Employee } from "@/types/database";
import { submitExpense, updateExpenseStatus, deleteExpense } from "./actions";
import type { ExpenseActionResult } from "./actions";

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  expenses: Expense[];
  employees: EmployeeRow[];
  isAdmin: boolean;
  reimbursedCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "meal",                 label: "Meal" },
  { value: "transport",            label: "Transport" },
  { value: "accommodation",        label: "Accommodation" },
  { value: "supplies",             label: "Supplies" },
  { value: "equipment",            label: "Equipment" },
  { value: "client_entertainment", label: "Client entertainment" },
  { value: "conference",           label: "Conference" },
  { value: "other",                label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  meal:                 "bg-orange-100 text-orange-700",
  transport:            "bg-blue-100 text-blue-700",
  accommodation:        "bg-violet-100 text-violet-700",
  supplies:             "bg-slate-100 text-slate-700",
  equipment:            "bg-cyan-100 text-cyan-700",
  client_entertainment: "bg-pink-100 text-pink-700",
  conference:           "bg-indigo-100 text-indigo-700",
  other:                "bg-navy-100 text-navy-600",
};

const STATUSES: Record<string, { label: string; color: string }> = {
  draft:      { label: "Draft",      color: "bg-slate-100 text-slate-600" },
  pending:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  approved:   { label: "Approved",   color: "bg-emerald-100 text-emerald-700" },
  rejected:   { label: "Rejected",   color: "bg-red-100 text-red-700" },
  reimbursed: { label: "Reimbursed", color: "bg-blue-100 text-blue-700" },
};

const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "NGN", "INR", "CAD", "AUD"].map((c) => ({ value: c, label: c }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(key: string) { return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other; }
function getCategoryLabel(key: string) { return CATEGORY_OPTIONS.find((o) => o.value === key)?.label ?? key; }
function getStatus(key: string) { return STATUSES[key] ?? STATUSES.pending; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";
const textareaCls = "flex w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none";
const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";

// ─── Receipt Uploader ─────────────────────────────────────────────────────────

type UploadState = { status: "idle" } | { status: "uploading"; progress: number } | { status: "done"; url: string; name: string } | { status: "error"; message: string };

function ReceiptUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadState({ status: "error", message: `File too large — max ${MAX_MB} MB.` });
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setUploadState({ status: "error", message: "Only PDF or image files (JPEG, PNG, WebP) are accepted." });
      return;
    }

    setUploadState({ status: "uploading", progress: 0 });
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: false });
      if (error) {
        setUploadState({ status: "error", message: error.message });
        return;
      }
      const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      setUploadState({ status: "done", url, name: file.name });
      onChange(url);
    } catch (e) {
      setUploadState({ status: "error", message: String(e) });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setUploadState({ status: "idle" });
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isDone = uploadState.status === "done";
  const isUploading = uploadState.status === "uploading";

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Upload receipt file"
        tabIndex={-1}
      />
      <input type="hidden" name="receipt_url" value={value} />

      {isDone && uploadState.status === "done" ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 truncate">{uploadState.name}</p>
            <p className="text-[11px] text-emerald-600">Receipt uploaded successfully</p>
          </div>
          <button type="button" onClick={clear} aria-label="Remove receipt" className="text-emerald-600 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          disabled={isUploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/50 px-4 py-5 text-center transition-all hover:border-blue-400 hover:bg-blue-50/50 disabled:opacity-60 group"
        >
          {isUploading ? (
            <>
              <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs font-semibold text-blue-600">Uploading…</p>
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-xl bg-white border border-navy-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-all shadow-xs">
                <svg className="h-4.5 w-4.5 text-navy-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-700 group-hover:text-blue-700 transition-colors">
                  Upload receipt
                </p>
                <p className="text-[11px] text-navy-400 mt-0.5">PDF, JPEG, PNG or WebP · max 10 MB · drag &amp; drop or click</p>
              </div>
            </>
          )}
        </button>
      )}

      {uploadState.status === "error" && (
        <p className="mt-2 text-xs text-red-600 font-medium">{uploadState.message}</p>
      )}
    </div>
  );
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitExpenseModal({ employees, onClose }: { employees: EmployeeRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ExpenseActionResult, FormData>(submitExpense, null);
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  const employeeOptions = employees.map((e) => ({ value: e.id, label: e.full_name ?? e.id }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Submit expense claim</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div>
            <label className={labelCls}>Employee <span className="text-red-500">*</span></label>
            <Select
              name="employee_id"
              aria-label="Employee"
              placeholder="Select employee…"
              options={employeeOptions}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <Select
                name="category"
                aria-label="Category"
                placeholder="Select category…"
                options={CATEGORY_OPTIONS}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Date <span className="text-red-500">*</span></label>
              <DatePicker
                name="expense_date"
                defaultValue={new Date().toISOString().split("T")[0]}
                placeholder="Expense date"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-red-500">*</span></label>
            <textarea name="description" required rows={2} placeholder="What was this expense for?" className={textareaCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount <span className="text-red-500">*</span></label>
              <input type="number" name="amount" required min="0.01" step="0.01" placeholder="0.00" aria-label="Amount" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <Select
                name="currency"
                aria-label="Currency"
                options={CURRENCY_OPTIONS}
                defaultValue="USD"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Merchant / vendor</label>
            <input type="text" name="merchant" placeholder="e.g. Hilton, British Airways" aria-label="Merchant" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Receipt</label>
            <ReceiptUploader value={receiptUrl} onChange={setReceiptUrl} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {isPending ? "Submitting…" : "Submit claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail / Action Modal ────────────────────────────────────────────────────

function ExpenseDetailModal({
  expense,
  employees,
  isAdmin,
  onClose,
}: {
  expense: Expense;
  employees: EmployeeRow[];
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(expense.notes ?? "");
  const employee = employees.find((e) => e.id === expense.employee_id);

  function act(status: "approved" | "rejected" | "reimbursed") {
    startTransition(async () => {
      await updateExpenseStatus(expense.id, status, notes);
      onClose();
    });
  }

  const cat = getCategoryLabel(expense.category);
  const catColor = getCategoryColor(expense.category);
  const st = getStatus(expense.status);

  const isPdf = expense.receipt_url?.toLowerCase().includes(".pdf") ||
    expense.receipt_url?.includes("application/pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Expense claim</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${catColor}`}>{cat}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <Row label="Employee"    value={employee?.full_name ?? expense.employee_id} />
            <Row label="Description" value={expense.description} />
            <Row label="Amount"      value={fmtAmount(Number(expense.amount), expense.currency)} bold />
            {expense.merchant && <Row label="Merchant"    value={expense.merchant} />}
            <Row label="Date"        value={fmtDate(expense.expense_date)} />
          </div>

          {expense.receipt_url && (
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0">
                {isPdf ? (
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">View receipt</p>
                <p className="text-[11px] text-blue-500">{isPdf ? "PDF document" : "Image"} · opens in new tab</p>
              </div>
              <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}

          {expense.approved_at && (
            <Row label={expense.status === "rejected" ? "Rejected on" : "Approved on"} value={fmtDate(expense.approved_at)} />
          )}
          {expense.reimbursed_at && (
            <Row label="Reimbursed on" value={fmtDate(expense.reimbursed_at)} />
          )}
          {expense.notes && <Row label="Notes" value={expense.notes} />}

          {isAdmin && expense.status !== "reimbursed" && (
            <>
              <div>
                <label className={labelCls}>Reviewer notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes for the employee…"
                  aria-label="Reviewer notes"
                  className={textareaCls}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {expense.status === "pending" && (
                  <>
                    <button type="button" onClick={() => act("approved")} disabled={isPending}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                      Approve
                    </button>
                    <button type="button" onClick={() => act("rejected")} disabled={isPending}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {expense.status === "approved" && (
                  <button type="button" onClick={() => act("reimbursed")} disabled={isPending}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                    Mark reimbursed
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-sm mt-0.5 ${bold ? "font-bold text-navy-900" : "text-navy-700"}`}>{value}</p>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ExpensesClient({ expenses, employees, isAdmin, reimbursedCount }: Props) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [selected, setSelected]     = useState<Expense | null>(null);
  const [filter, setFilter]         = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { key: "all",        label: "All",        count: expenses.length },
    { key: "pending",    label: "Pending",    count: expenses.filter((e) => e.status === "pending").length },
    { key: "approved",   label: "Approved",   count: expenses.filter((e) => e.status === "approved").length },
    { key: "reimbursed", label: "Reimbursed", count: reimbursedCount },
    { key: "rejected",   label: "Rejected",   count: expenses.filter((e) => e.status === "rejected").length },
  ];

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.status === filter);

  function handleDelete(id: string) {
    if (!confirm("Delete this expense claim?")) return;
    startTransition(() => { void deleteExpense(id); });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1 bg-navy-100 p-1 rounded-xl">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === t.key ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-800"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${filter === t.key ? "bg-blue-100 text-blue-700" : "bg-navy-200 text-navy-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowSubmit(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New claim
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-200 py-16 text-center">
          <svg className="mx-auto h-10 w-10 text-navy-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          <p className="text-sm font-semibold text-navy-400">No expense claims yet</p>
          <p className="mt-1 text-xs text-navy-300">Submit a claim to get started</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-100 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Description</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Date</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Status</th>
                <th className="px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((exp) => {
                const employee = employees.find((e) => e.id === exp.employee_id);
                const catColor = getCategoryColor(exp.category);
                const catLabel = getCategoryLabel(exp.category);
                const st = getStatus(exp.status);
                const hasReceipt = !!exp.receipt_url;
                return (
                  <tr key={exp.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-900">{employee?.full_name ?? "—"}</p>
                      <p className="text-xs text-navy-400">{employee?.department ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${catColor}`}>{catLabel}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-navy-700">{exp.description}</p>
                      {exp.merchant && <p className="text-xs text-navy-400 truncate">{exp.merchant}</p>}
                    </td>
                    <td className="px-4 py-3 text-navy-500 whitespace-nowrap">{fmtDate(exp.expense_date)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-navy-900 whitespace-nowrap">
                      {fmtAmount(Number(exp.amount), exp.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {hasReceipt && (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1" title="Receipt attached" />
                        )}
                        <button type="button" onClick={() => setSelected(exp)}
                          className="rounded-lg p-1.5 text-navy-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details" aria-label="View details">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {isAdmin && (
                          <button type="button" onClick={() => handleDelete(exp.id)} disabled={isPending}
                            className="rounded-lg p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete" aria-label="Delete expense">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showSubmit && <SubmitExpenseModal employees={employees} onClose={() => setShowSubmit(false)} />}
      {selected && (
        <ExpenseDetailModal expense={selected} employees={employees} isAdmin={isAdmin} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
