"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Atlas AI action-agent panel (shared) ───────────────────────────────────
// Renders the propose → approve → execute UI used by both the full /copilot
// page and the floating Atlas AI widget. Actions arrive one of two ways:
//   • inline   — pushed by the copilot stream as an `actions` SSE event and
//                passed in via `initialActions` (no fetch).
//   • on-demand — derived from an assistant message by POSTing `content` to
//                /api/ai/agent/plan.
// Nothing runs until the user approves a card, which calls the guarded
// /api/ai/agent/execute endpoint (permission re-checked server-side).

export type ProposedAction =
  | { type: "create_tasks"; summary: string; tasks: { title: string; description?: string; due_at?: string }[] }
  | {
      type: "assign_task";
      summary: string;
      employee_id: string;
      employee_name: string;
      assigned_to?: string | null;
      title: string;
      description?: string;
      due_at?: string;
    }
  | { type: "create_announcement"; summary: string; title: string; body: string }
  | {
      type: "create_leave_request";
      summary: string;
      employee_id: string;
      employee_name: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }
  | {
      type: "decide_leave";
      summary: string;
      leave_request_id: string;
      decision: "approve" | "reject";
      employee_name: string;
      leave_type: string;
      start_date: string;
      end_date: string;
    }
  | {
      type: "send_notification";
      summary: string;
      recipient_user_id: string;
      recipient_name: string;
      title: string;
      body: string;
    };

const ACTION_LABELS: Record<ProposedAction["type"], string> = {
  create_tasks: "Create workspace tasks",
  assign_task: "Assign a task",
  create_announcement: "Post an announcement",
  create_leave_request: "File a leave request",
  decide_leave: "Approve / reject leave",
  send_notification: "Send a notification",
};

type RunStatus = "idle" | "running" | "done" | "error";

function ActionCardBody({ a }: { a: ProposedAction }) {
  switch (a.type) {
    case "create_tasks":
      return (
        <ul className="mt-1.5 space-y-0.5">
          {a.tasks.map((t, j) => (
            <li key={j} className="text-[11px] text-navy-600">
              • {t.title}
              {t.due_at ? <span className="text-navy-400"> — due {t.due_at}</span> : null}
            </li>
          ))}
        </ul>
      );
    case "assign_task":
      return (
        <div className="mt-1.5 rounded-md bg-navy-50 p-2">
          <p className="text-[11px] font-semibold text-navy-800">{a.title}</p>
          <p className="mt-0.5 text-[11px] text-navy-600">
            For <span className="font-medium">{a.employee_name}</span>
            {a.due_at ? <span className="text-navy-400"> · due {a.due_at}</span> : null}
          </p>
        </div>
      );
    case "create_announcement":
      return (
        <div className="mt-1.5 rounded-md bg-navy-50 p-2">
          <p className="text-[11px] font-semibold text-navy-800">{a.title}</p>
          <p className="mt-0.5 line-clamp-3 text-[11px] text-navy-600">{a.body}</p>
        </div>
      );
    case "create_leave_request":
      return (
        <div className="mt-1.5 rounded-md bg-navy-50 p-2">
          <p className="text-[11px] font-semibold capitalize text-navy-800">
            {a.leave_type} leave · {a.employee_name}
          </p>
          <p className="mt-0.5 text-[11px] text-navy-600">
            {a.start_date} → {a.end_date}
            {a.reason ? <span className="text-navy-400"> · {a.reason}</span> : null}
          </p>
        </div>
      );
    case "decide_leave":
      return (
        <div className="mt-1.5 rounded-md bg-navy-50 p-2">
          <p className="text-[11px] font-semibold text-navy-800">
            <span className={a.decision === "approve" ? "text-emerald-700" : "text-red-700"}>
              {a.decision === "approve" ? "Approve" : "Reject"}
            </span>{" "}
            <span className="capitalize">{a.leave_type}</span> leave · {a.employee_name}
          </p>
          <p className="mt-0.5 text-[11px] text-navy-600">
            {a.start_date} → {a.end_date}
          </p>
        </div>
      );
    case "send_notification":
      return (
        <div className="mt-1.5 rounded-md bg-navy-50 p-2">
          <p className="text-[11px] font-semibold text-navy-800">{a.title}</p>
          <p className="mt-0.5 text-[11px] text-navy-600">
            To <span className="font-medium">{a.recipient_name}</span> — {a.body}
          </p>
        </div>
      );
  }
}

export function ActionsPanel({
  content,
  initialActions,
  onClose,
}: {
  content?: string;
  initialActions?: ProposedAction[];
  onClose: () => void;
}) {
  const inline = initialActions !== undefined;
  const [loading, setLoading] = useState(!inline);
  const [actions, setActions] = useState<ProposedAction[]>(initialActions ?? []);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<Record<number, { status: RunStatus; detail?: string }>>({});

  useEffect(() => {
    // When actions were pushed inline by the stream, there's nothing to fetch.
    if (inline || !content) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/agent/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: content }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(data.error ?? "Could not prepare actions.");
        else {
          setActions(data.actions ?? []);
          setNote(data.note ?? null);
        }
      } catch {
        if (!cancelled) setError("Could not prepare actions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content, inline]);

  async function approve(i: number) {
    setRun((s) => ({ ...s, [i]: { status: "running" } }));
    try {
      const res = await fetch("/api/ai/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actions[i] }),
      });
      const data = await res.json();
      if (!res.ok) setRun((s) => ({ ...s, [i]: { status: "error", detail: data.error ?? "Failed" } }));
      else setRun((s) => ({ ...s, [i]: { status: "done", detail: data.detail ?? "Done" } }));
    } catch {
      setRun((s) => ({ ...s, [i]: { status: "error", detail: "Failed" } }));
    }
  }

  return (
    <div className="mt-1 w-full rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-indigo-800">Suggested actions — you approve before anything runs</p>
        <button type="button" onClick={onClose} aria-label="Close actions panel" className="text-navy-400 hover:text-navy-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-navy-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Preparing actions…
        </div>
      ) : error ? (
        <p className="py-2 text-xs text-red-600">{error}</p>
      ) : actions.length === 0 ? (
        <p className="py-2 text-xs text-navy-500">{note ?? "No actions to suggest for this response."}</p>
      ) : (
        <div className="space-y-2.5">
          {actions.map((a, i) => {
            const state = run[i]?.status ?? "idle";
            return (
              <div key={i} className="rounded-lg border border-indigo-100 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                      {ACTION_LABELS[a.type]}
                    </p>
                    <p className="mt-0.5 text-xs text-navy-700">{a.summary}</p>
                    <ActionCardBody a={a} />
                  </div>
                  <button
                    type="button"
                    onClick={() => approve(i)}
                    disabled={state === "running" || state === "done"}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                      state === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : state === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50",
                    )}
                  >
                    {state === "running" ? "Running…" : state === "done" ? "✓ Done" : state === "error" ? "Retry" : "Approve & run"}
                  </button>
                </div>
                {run[i]?.detail && (
                  <p className={cn("mt-1.5 text-[10px]", state === "error" ? "text-red-600" : "text-emerald-600")}>
                    {run[i]?.detail}
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-[10px] text-navy-400">Atlas only proposes safe, reversible actions. Review each before approving.</p>
        </div>
      )}
    </div>
  );
}
