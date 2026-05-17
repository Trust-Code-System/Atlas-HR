"use client";

import { useState, useTransition, useRef } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  type ComplianceUpdate,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  ADMIN_STATUS_LABELS,
  COUNTRY_SLUGS,
} from "@/lib/compliance-shared";
import {
  updateComplianceStatus,
  createComplianceUpdate,
  deleteComplianceUpdate,
} from "./actions";

type AdminStatus = ComplianceUpdate["adminStatus"];

const STATUS_COLUMNS: { key: AdminStatus; label: string; color: string; bg: string }[] = [
  { key: "draft", label: "Draft", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  { key: "review", label: "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { key: "published", label: "Published", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  { key: "archived", label: "Archived", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
];

const COUNTRIES = ["Nigeria", "India", "United Kingdom", "United States"] as const;
const SEVERITIES = ["critical", "action_needed", "review_recommended", "monitoring"] as const;

interface Props {
  updates: ComplianceUpdate[];
}

export function ComplianceAdminClient({ updates: initialUpdates }: Props) {
  const [updates, setUpdates] = useState<ComplianceUpdate[]>(initialUpdates);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function moveStatus(id: string, status: AdminStatus) {
    startTransition(async () => {
      const result = await updateComplianceStatus(id, status);
      if (result.success) {
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  adminStatus: status,
                  ...(status === "published" ? { publishedAt: new Date().toISOString().slice(0, 10) } : {}),
                }
              : u
          )
        );
        showToast(`Moved to ${ADMIN_STATUS_LABELS[status]}`);
      } else {
        showToast(result.error ?? "Failed to update", false);
      }
    });
  }

  function confirmDelete(id: string) {
    setDeleteTarget(id);
  }

  function doDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deleteComplianceUpdate(id);
      if (result.success) {
        setUpdates((prev) => prev.filter((u) => u.id !== id));
        showToast("Update deleted");
      } else {
        showToast(result.error ?? "Failed to delete", false);
      }
    });
  }

  function handleCreated(update: ComplianceUpdate) {
    setUpdates((prev) => [update, ...prev]);
    setShowCreate(false);
    showToast("Draft created");
  }

  const byStatus = (status: AdminStatus) => updates.filter((u) => u.adminStatus === status);

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
            toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.ok ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-navy-900 mb-2">Delete this update?</h2>
            <p className="text-sm text-slate-500 mb-5">This cannot be undone. The update will be permanently removed from the editorial store.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{updates.length} total updates</span>
          {isPending && (
            <span className="text-xs text-blue-600 font-semibold animate-pulse">Saving…</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New update
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.key} className={`rounded-xl border ${col.bg} flex flex-col`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
              <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
              <span className="text-xs font-bold text-slate-400 bg-white rounded-full px-2 py-0.5 border border-slate-200">
                {byStatus(col.key).length}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-3 min-h-[120px]">
              {byStatus(col.key).map((u) => (
                <AdminCard
                  key={u.id}
                  update={u}
                  onMove={moveStatus}
                  onDelete={confirmDelete}
                  isPending={isPending}
                />
              ))}
              {byStatus(col.key).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No updates</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin card ────────────────────────────────────────────────────────────────

function AdminCard({
  update: u,
  onMove,
  onDelete,
  isPending,
}: {
  update: ComplianceUpdate;
  onMove: (id: string, status: AdminStatus) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const nextStatuses = STATUS_COLUMNS.map((c) => c.key).filter((s) => s !== u.adminStatus);

  return (
    <div className="relative rounded-xl bg-white border border-slate-200 p-3.5 shadow-sm hover:shadow transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[u.severity]}`}>
          {SEVERITY_LABELS[u.severity]}
        </span>
        <div className="relative" ref={ref}>
          <button
            type="button"
            aria-label="Card actions"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-3 py-1.5">Move to</p>
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isPending}
                  onClick={() => { setMenuOpen(false); onMove(u.id, s); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {ADMIN_STATUS_LABELS[s]}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(u.id); }}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] font-bold text-slate-500 mb-0.5">{u.country}</p>
      <h3 className="text-sm font-semibold text-navy-900 leading-snug mb-2">{u.title}</h3>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">{u.date}</span>
        {u.adminStatus === "published" && u.publishedAt && (
          <span className="text-[10px] text-green-600 font-semibold">Published {u.publishedAt}</span>
        )}
      </div>
    </div>
  );
}

// ─── Create modal ──────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (update: ComplianceUpdate) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<string[]>(["", "", ""]);

  function addTask() { setTasks((t) => [...t, ""]); }
  function updateTask(i: number, val: string) { setTasks((t) => t.map((v, idx) => idx === i ? val : v)); }
  function removeTask(i: number) { setTasks((t) => t.filter((_, idx) => idx !== i)); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const country = fd.get("country") as string;
    const title = fd.get("title") as string;
    const date = fd.get("date") as string;
    const severity = fd.get("severity") as ComplianceUpdate["severity"];
    const whatChanged = fd.get("whatChanged") as string;
    const whoIsAffected = fd.get("whoIsAffected") as string;
    const whatToDoNext = tasks.map((t) => t.trim()).filter(Boolean);

    if (!title || !country || !date || !severity || !whatChanged || !whoIsAffected || whatToDoNext.length === 0) {
      setError("Please fill in all required fields and add at least one action item.");
      return;
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
      + "-" + Date.now().toString(36);

    const data: Omit<ComplianceUpdate, "adminStatus" | "publishedAt" | "publishedBy"> = {
      id,
      country,
      countrySlug: COUNTRY_SLUGS[country] ?? country.toLowerCase(),
      title,
      date,
      status: SEVERITY_LABELS[severity] as ComplianceUpdate["status"],
      severity,
      whatChanged,
      whoIsAffected,
      whatToDoNext,
      linkedTemplates: [],
      linkedArticles: [],
    };

    startTransition(async () => {
      const result = await createComplianceUpdate(data);
      if (result.success) {
        const newUpdate: ComplianceUpdate = {
          ...data,
          adminStatus: "draft",
          publishedAt: "",
          publishedBy: "Admin",
        };
        onCreated(newUpdate);
      } else {
        setError(result.error ?? "Failed to create update");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-navy-900">New compliance update</h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Country *</label>
              <Select
                name="country"
                required
                triggerClassName="h-9 border-slate-200 text-slate-700 focus:ring-blue-500"
                options={[{ value: "", label: "Select country" }, ...COUNTRIES.map((c) => ({ value: c, label: c }))]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Severity *</label>
              <Select
                name="severity"
                required
                triggerClassName="h-9 border-slate-200 text-slate-700 focus:ring-blue-500"
                options={[{ value: "", label: "Select severity" }, ...SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Title *</label>
            <input
              name="title"
              required
              placeholder="e.g. New pension contribution requirements for SMEs"
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date *</label>
            <DatePicker
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              placeholder="Select date"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">What changed *</label>
            <textarea
              name="whatChanged"
              required
              rows={3}
              placeholder="Plain-English description of the regulation or law that changed…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Who is affected *</label>
            <textarea
              name="whoIsAffected"
              required
              rows={2}
              placeholder="Which employers, employee types, or industries are impacted…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600">What to do next *</label>
              <button
                type="button"
                onClick={addTask}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-bold w-4 shrink-0">{i + 1}.</span>
                  <input
                    value={t}
                    onChange={(e) => updateTask(i, e.target.value)}
                    placeholder={`Action item ${i + 1}`}
                    className="flex-1 h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove action item ${i + 1}`}
                      onClick={() => removeTask(i)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating…" : "Create draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
