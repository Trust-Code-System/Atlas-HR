"use client";

import { useState, useTransition } from "react";
import { createAutomation, setAutomationActive, deleteAutomation, type NewAutomation } from "./actions";
import type { AutomationWorkflow } from "@/types/database";

interface Props { workflows: AutomationWorkflow[] }

const TRIGGER_LABEL: Record<string, (d: number) => string> = {
  document_expiring: (d) => `a document is within ${d} days of expiring`,
  contract_ending: (d) => `a contract ends within ${d} days`,
  new_hire: (d) => `an employee started in the last ${d} days`,
  leave_pending: (d) => `a leave request has been pending over ${d} days`,
};
const ACTION_LABEL: Record<string, string> = {
  notify_hr: "notify HR",
  notify_manager: "notify their manager",
  create_task: "create a task",
};

function describe(w: { trigger_type: string; trigger_days: number; action_type: string }) {
  const t = TRIGGER_LABEL[w.trigger_type]?.(w.trigger_days) ?? w.trigger_type;
  return `When ${t}, ${ACTION_LABEL[w.action_type] ?? w.action_type}.`;
}

interface Proposed extends NewAutomation { explanation: string }

const EXAMPLES = [
  "When an employee's contract ends within 30 days, notify HR",
  "When a work permit is within 60 days of expiring, create a task",
  "When someone starts in the last 7 days, notify their manager",
  "When a leave request is pending more than 3 days, notify HR",
];

export function AutomationsClient({ workflows }: Props) {
  const [nl, setNl] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposed, setProposed] = useState<Proposed | null>(null);
  const [saving, startSaving] = useTransition();
  const [pending, startPending] = useTransition();

  async function build() {
    if (nl.trim().length < 5) return;
    setBuilding(true);
    setError(null);
    setProposed(null);
    try {
      const res = await fetch("/api/ai/build-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Couldn't build that."); return; }
      setProposed({
        name: data.name,
        nl_prompt: nl.trim(),
        trigger_type: data.trigger_type,
        trigger_days: data.trigger_days,
        action_type: data.action_type,
        action_config: data.action_config ?? {},
        explanation: data.explanation,
      });
    } catch {
      setError("Something went wrong building the workflow.");
    } finally {
      setBuilding(false);
    }
  }

  function save() {
    if (!proposed) return;
    startSaving(async () => {
      const res = await createAutomation(proposed);
      if (res?.error) { setError(res.error); return; }
      setProposed(null);
      setNl("");
    });
  }

  return (
    <div className="space-y-8">
      {/* Builder */}
      <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-sm font-bold text-navy-900">Describe a workflow</h2>
        </div>
        <p className="text-xs text-navy-500 mb-3">Write a rule in plain English. Atlas turns it into a trigger → action automation you can review before activating.</p>
        <textarea
          value={nl}
          onChange={(e) => setNl(e.target.value)}
          className="w-full min-h-20 rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="e.g. When an employee's contract ends within 30 days, notify HR"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setNl(ex)} className="text-[11px] text-navy-500 bg-navy-50 hover:bg-navy-100 rounded-full px-2.5 py-1 transition-colors">{ex}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button type="button" onClick={() => void build()} disabled={building || nl.trim().length < 5}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
            {building ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : null}
            Build workflow
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        {proposed && (
          <div className="mt-5 border-t border-navy-100 pt-5">
            <p className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-2">Proposed workflow</p>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <input
                value={proposed.name}
                onChange={(e) => setProposed({ ...proposed, name: e.target.value })}
                className="w-full rounded-lg border border-navy-200 px-2.5 py-1.5 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <p className="text-sm text-navy-700">{describe(proposed)}</p>
              {proposed.action_type === "create_task" && proposed.action_config?.task_title && (
                <p className="text-xs text-navy-500 mt-1">Task: “{proposed.action_config.task_title}”</p>
              )}
              <p className="text-[11px] text-navy-400 italic mt-1">{proposed.explanation}</p>
              <div className="flex items-center gap-3 mt-3">
                <button type="button" onClick={save} disabled={saving}
                  className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Create & activate"}
                </button>
                <button type="button" onClick={() => setProposed(null)} className="text-sm font-medium text-navy-500 hover:text-navy-800">Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing workflows */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">Your workflows ({workflows.length})</h2>
        {workflows.length > 0 ? (
          <div className="space-y-3">
            {workflows.map((w) => (
              <div key={w.id} className={`bg-white rounded-2xl border border-navy-200 shadow-sm px-5 py-4 flex items-start justify-between gap-3 ${pending ? "opacity-70" : ""}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-navy-900">{w.name}</p>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${w.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-navy-50 text-navy-500 border-navy-200"}`}>
                      {w.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-sm text-navy-600 mt-1">{describe(w)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" disabled={pending} onClick={() => startPending(async () => { await setAutomationActive(w.id, !w.is_active); })}
                    className="text-xs font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {w.is_active ? "Pause" : "Activate"}
                  </button>
                  <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this workflow?")) startPending(async () => { await deleteAutomation(w.id); }); }}
                    className="text-navy-400 hover:text-red-600 transition-colors disabled:opacity-50" aria-label="Delete workflow">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-navy-200 text-center py-12 text-sm text-navy-400">
            No workflows yet. Describe one above to get started.
          </div>
        )}
        <p className="text-[11px] text-navy-400 mt-3">Active workflows are evaluated daily and act on matching employees (notifications and tasks).</p>
      </div>
    </div>
  );
}
