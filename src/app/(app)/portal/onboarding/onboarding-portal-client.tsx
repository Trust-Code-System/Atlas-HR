"use client";

import { useTransition } from "react";
import { completeMyTask } from "./actions";
import type { LifecycleRun, LifecycleTask } from "@/types/database";

const TASK_TYPE_LABELS: Record<string, string> = {
  task: "Task",
  document: "Document",
  training: "Training",
  acknowledgment: "Acknowledgment",
  meeting: "Meeting",
  equipment: "Equipment",
  access: "Access",
};

const RUN_STATUS: Record<string, { pill: string; dot: string; label: string }> = {
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",          dot: "bg-blue-500",    label: "In progress" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Completed" },
  cancelled:   { pill: "bg-slate-100 text-slate-500 border border-slate-200",      dot: "bg-slate-400",   label: "Cancelled" },
};

function TaskRow({
  task,
  isRunActive,
}: {
  task: LifecycleTask;
  isRunActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "completed" || task.status === "skipped";
  const isOverdue = !isDone && task.due_at != null && new Date(task.due_at) < new Date();

  function handle(action: "completed" | "skipped") {
    startTransition(async () => { await completeMyTask(task.id, action); });
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${isDone ? "border-navy-100 bg-navy-50/40" : isOverdue ? "border-red-200 bg-red-50/20" : "border-navy-200 bg-white"} ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {task.status === "completed" ? (
            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : task.status === "skipped" ? (
            <div className="h-5 w-5 rounded-full bg-navy-300 flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </div>
          ) : (
            <div className={`h-5 w-5 rounded-full border-2 ${isOverdue ? "border-red-400" : "border-navy-300"}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${isDone ? "text-navy-400 line-through" : "text-navy-900"}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-navy-400">{TASK_TYPE_LABELS[task.task_type] ?? task.task_type}</span>
                {task.due_at && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-navy-400"}`}>
                      {isOverdue ? "Overdue · " : "Due "}
                      {new Date(task.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isRunActive && !isDone && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handle("completed")}
                  disabled={isPending}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Mark done
                </button>
                <button
                  type="button"
                  onClick={() => handle("skipped")}
                  disabled={isPending}
                  className="text-xs font-medium text-navy-500 hover:text-navy-700 bg-navy-50 hover:bg-navy-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-navy-500 mt-1.5 leading-relaxed">{task.description}</p>
          )}

          {task.completed_at && (
            <p className="text-xs text-navy-400 mt-1.5">
              {task.status === "completed" ? "Completed" : "Skipped"}{" "}
              {new Date(task.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RunCard({
  run,
  tasks,
  templateName,
}: {
  run: LifecycleRun;
  tasks: LifecycleTask[];
  templateName: string;
}) {
  const completed = tasks.filter((t) => t.status === "completed" || t.status === "skipped").length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive  = run.status === "in_progress";
  const sv        = RUN_STATUS[run.status] ?? RUN_STATUS.in_progress;

  const pending = tasks.filter((t) => !["completed", "skipped"].includes(t.status));
  const done    = tasks.filter((t) => ["completed", "skipped"].includes(t.status));

  return (
    <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm mb-6">
      {/* Run header */}
      <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-navy-900">{templateName}</h2>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
              {sv.label}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-400 px-2 py-0.5 rounded-full bg-navy-50 border border-navy-100">
              {run.type}
            </span>
          </div>
          <p className="text-xs text-navy-400 mt-0.5">
            Started {new Date(run.reference_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Tasks</p>
            <p className="font-mono text-xl font-bold text-navy-900 tabular-nums">{completed}/{total}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Complete</p>
            <p className={`font-mono text-xl font-bold tabular-nums ${pct === 100 ? "text-emerald-600" : "text-blue-600"}`}>{pct}%</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-navy-100">
          <div
            className={`h-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-navy-400">No tasks in this run.</div>
      ) : (
        <div className="px-5 py-5 space-y-5">
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-navy-700 uppercase tracking-widest mb-3">
                Remaining ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((t) => <TaskRow key={t.id} task={t} isRunActive={isActive} />)}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">
                Done ({done.length})
              </p>
              <div className="space-y-2">
                {done.map((t) => <TaskRow key={t.id} task={t} isRunActive={isActive} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  runs: LifecycleRun[];
  tasks: LifecycleTask[];
  templateMap: Record<string, string>;
}

export function OnboardingPortalClient({ runs, tasks, templateMap }: Props) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-navy-200 p-12 text-center shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-navy-100 flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-navy-900 mb-1">No onboarding runs</h3>
        <p className="text-sm text-navy-500 max-w-xs mx-auto">
          Your HR team will assign onboarding tasks when you join. Check back here to track your progress.
        </p>
      </div>
    );
  }

  const tasksByRun: Record<string, LifecycleTask[]> = {};
  for (const task of tasks) {
    (tasksByRun[task.run_id] ??= []).push(task);
  }

  const activeRuns   = runs.filter((r) => r.status === "in_progress");
  const historicRuns = runs.filter((r) => r.status !== "in_progress");

  return (
    <div>
      {activeRuns.length > 0 && (
        <section>
          {activeRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              tasks={tasksByRun[run.id] ?? []}
              templateName={templateMap[run.template_id] ?? "Onboarding"}
            />
          ))}
        </section>
      )}

      {historicRuns.length > 0 && (
        <section>
          {activeRuns.length > 0 && (
            <h2 className="text-sm font-bold text-navy-500 uppercase tracking-widest mb-4">Past runs</h2>
          )}
          {historicRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              tasks={tasksByRun[run.id] ?? []}
              templateName={templateMap[run.template_id] ?? "Onboarding"}
            />
          ))}
        </section>
      )}
    </div>
  );
}
