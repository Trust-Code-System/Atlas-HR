"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { saveExtractedTasks, setTaskStatus, type NewTaskInput } from "./actions";
import type { EmployeeTask } from "@/types/database";

interface EmployeeOpt { id: string; full_name: string; department: string | null }

interface Props {
  tasks: EmployeeTask[];
  employees: EmployeeOpt[];
  empMap: Record<string, string>;
  isAdmin: boolean;
}

const TASK_TYPES = [
  { value: "custom", label: "General" },
  { value: "profile_update", label: "Profile update" },
  { value: "document_upload", label: "Document upload" },
  { value: "policy_acknowledgment", label: "Policy acknowledgment" },
  { value: "training", label: "Training" },
  { value: "onboarding", label: "Onboarding" },
  { value: "offboarding", label: "Offboarding" },
  { value: "leave", label: "Leave" },
];

const typeLabel = (t: string) => TASK_TYPES.find((x) => x.value === t)?.label ?? "General";

interface DraftTask {
  include: boolean;
  title: string;
  description: string | null;
  task_type: string;
  due_at: string | null;
  assignee_hint: string | null;
  employee_id: string;
}

const statusStyle: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-navy-50 text-navy-500 border-navy-200",
};

export function TasksClient({ tasks, employees, empMap, isAdmin }: Props) {
  const [notes, setNotes] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftTask[] | null>(null);
  const [saving, startSaving] = useTransition();
  const [statusPending, startStatus] = useTransition();

  const empOptions = [
    { value: "", label: "Unassigned" },
    ...employees.map((e) => ({ value: e.id, label: e.full_name })),
  ];

  function guessEmployee(hint: string | null): string {
    if (!hint) return "";
    const h = hint.trim().toLowerCase();
    const match = employees.find(
      (e) => e.full_name.toLowerCase() === h || e.full_name.toLowerCase().startsWith(h) || h.startsWith(e.full_name.toLowerCase().split(" ")[0])
    );
    return match?.id ?? "";
  }

  async function extract() {
    if (notes.trim().length < 10) return;
    setExtracting(true);
    setError(null);
    setNote(null);
    setDrafts(null);
    try {
      const res = await fetch("/api/ai/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Couldn't extract tasks."); return; }
      const list: DraftTask[] = (data.tasks ?? []).map((t: NewTaskInput & { assignee_hint?: string | null }) => ({
        include: true,
        title: t.title,
        description: t.description ?? null,
        task_type: t.task_type ?? "custom",
        due_at: t.due_at ?? null,
        assignee_hint: t.assignee_hint ?? null,
        employee_id: guessEmployee(t.assignee_hint ?? null),
      }));
      if (list.length === 0) { setNote("No actionable tasks found in those notes."); return; }
      setDrafts(list);
    } catch {
      setError("Something went wrong extracting tasks.");
    } finally {
      setExtracting(false);
    }
  }

  function updateDraft(i: number, patch: Partial<DraftTask>) {
    setDrafts((prev) => prev?.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) ?? prev);
  }

  function save() {
    const chosen = (drafts ?? []).filter((d) => d.include && d.title.trim());
    if (chosen.length === 0) return;
    startSaving(async () => {
      const payload: NewTaskInput[] = chosen.map((d) => ({
        title: d.title,
        description: d.description,
        task_type: d.task_type,
        due_at: d.due_at,
        employee_id: d.employee_id || null,
      }));
      const res = await saveExtractedTasks(payload);
      if (res?.error) { setError(res.error); return; }
      setDrafts(null);
      setNotes("");
      setNote(`Saved ${res?.saved ?? chosen.length} task${(res?.saved ?? 0) === 1 ? "" : "s"}.`);
    });
  }

  const open = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "completed" || t.status === "cancelled");

  return (
    <div className="space-y-8">
      {/* Extractor */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="text-sm font-bold text-navy-900">Extract tasks from notes</h2>
          </div>
          <p className="text-xs text-navy-500 mb-3">Paste meeting notes, an email, or rough notes — Atlas AI will pull out the action items for you to review and save.</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-28 rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="e.g. Met with Sarah re: onboarding. Need to send her the equipment form by Friday, schedule a benefits walkthrough next week, and remind IT to set up her laptop."
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => void extract()}
              disabled={extracting || notes.trim().length < 10}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {extracting ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Extract tasks
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
            {note && !error && <span className="text-xs text-emerald-600">{note}</span>}
          </div>

          {/* Review drafts */}
          {drafts && drafts.length > 0 && (
            <div className="mt-5 border-t border-navy-100 pt-5 space-y-3">
              <p className="text-xs font-bold text-navy-500 uppercase tracking-widest">Review {drafts.length} extracted task{drafts.length === 1 ? "" : "s"}</p>
              {drafts.map((d, i) => (
                <div key={i} className={`rounded-xl border p-3 ${d.include ? "border-navy-200 bg-white" : "border-navy-100 bg-navy-50/50 opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={d.include}
                      onChange={(e) => updateDraft(i, { include: e.target.checked })}
                      className="mt-2 h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        value={d.title}
                        onChange={(e) => updateDraft(i, { title: e.target.value })}
                        className="w-full rounded-lg border border-navy-200 px-2.5 py-1.5 text-sm font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {d.description && (
                        <p className="text-xs text-navy-500">{d.description}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Select
                          aria-label="Task type"
                          value={d.task_type}
                          onChange={(v) => updateDraft(i, { task_type: v })}
                          triggerClassName="h-9 text-sm"
                          options={TASK_TYPES}
                        />
                        <Select
                          aria-label="Assign to"
                          value={d.employee_id}
                          onChange={(v) => updateDraft(i, { employee_id: v })}
                          triggerClassName="h-9 text-sm"
                          options={empOptions}
                        />
                        <input
                          type="date"
                          value={d.due_at ?? ""}
                          onChange={(e) => updateDraft(i, { due_at: e.target.value || null })}
                          className="h-9 rounded-xl border border-navy-200 px-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {d.assignee_hint && !d.employee_id && (
                        <p className="text-[11px] text-amber-600">Mentioned “{d.assignee_hint}” — couldn’t match an employee; pick one above.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || drafts.every((d) => !d.include)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : `Save selected (${drafts.filter((d) => d.include).length})`}
                </button>
                <button type="button" onClick={() => setDrafts(null)} className="text-sm font-medium text-navy-500 hover:text-navy-800">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Open tasks */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">Open tasks ({open.length})</h2>
        {open.length > 0 ? (
          <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden divide-y divide-navy-100">
            {open.map((t) => (
              <TaskRow key={t.id} task={t} who={t.employee_id ? empMap[t.employee_id] : null} isAdmin={isAdmin} pending={statusPending} onStatus={(s) => startStatus(async () => { await setTaskStatus(t.id, s); })} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-navy-200 text-center py-12 text-sm text-navy-400">No open tasks.</div>
        )}
      </div>

      {/* Completed / cancelled */}
      {done.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">Completed & cancelled ({done.length})</h2>
          <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden divide-y divide-navy-100">
            {done.slice(0, 30).map((t) => (
              <TaskRow key={t.id} task={t} who={t.employee_id ? empMap[t.employee_id] : null} isAdmin={isAdmin} pending={statusPending} onStatus={(s) => startStatus(async () => { await setTaskStatus(t.id, s); })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function TaskRow({
    task, who, isAdmin, pending, onStatus,
  }: {
    task: EmployeeTask;
    who: string | null;
    isAdmin: boolean;
    pending: boolean;
    onStatus: (s: "pending" | "in_progress" | "completed" | "cancelled") => void;
  }) {
    const isOpen = task.status === "pending" || task.status === "in_progress";
    const due = task.due_at ? new Date(task.due_at) : null;
    const overdue = due && isOpen && due.getTime() < Date.now();
    return (
      <div className={`flex items-center justify-between gap-3 px-5 py-3.5 ${pending ? "opacity-60" : ""}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${task.status === "completed" || task.status === "cancelled" ? "text-navy-400 line-through" : "text-navy-800"}`}>{task.title}</p>
            <span className="text-[10px] font-semibold bg-navy-100 text-navy-500 rounded-full px-2 py-0.5">{typeLabel(task.task_type)}</span>
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${statusStyle[task.status]}`}>{task.status.replace("_", " ")}</span>
          </div>
          <p className="text-xs text-navy-400 mt-0.5">
            {who ? `For ${who}` : "Unassigned"}
            {due && (
              <span className={overdue ? "text-red-600 font-semibold" : ""}>
                {" · due "}{due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{overdue ? " (overdue)" : ""}
              </span>
            )}
          </p>
          {task.description && <p className="text-xs text-navy-500 mt-0.5 line-clamp-1">{task.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {isOpen ? (
              <>
                <button type="button" disabled={pending} onClick={() => onStatus("completed")} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">Complete</button>
                <button type="button" disabled={pending} onClick={() => onStatus("cancelled")} className="text-xs font-medium text-navy-500 hover:text-navy-800 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              </>
            ) : (
              <button type="button" disabled={pending} onClick={() => onStatus("pending")} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">Reopen</button>
            )}
          </div>
        )}
      </div>
    );
  }
}
