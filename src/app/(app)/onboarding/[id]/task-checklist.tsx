"use client";

import { useTransition } from "react";
import { completeTask } from "../actions";

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className="h-full rounded-full bg-blue-500 transition-all duration-500"
    />
  );
}
import type { LifecycleTask } from "@/types/database";

const taskStatusColors: Record<string, string> = {
  pending: "border-navy-200 bg-white",
  in_progress: "border-blue-200 bg-blue-50/30",
  completed: "border-blue-200 bg-blue-50/30",
  skipped: "border-navy-100 bg-navy-50/30",
  blocked: "border-red-200 bg-red-50/30",
};

const taskTypeLabels: Record<string, string> = {
  task: "Task",
  document: "Document",
  training: "Training",
  acknowledgment: "Acknowledgment",
  meeting: "Meeting",
  equipment: "Equipment",
  access: "Access",
};

function TaskCard({
  task,
  isAdmin,
  isRunActive,
}: {
  task: LifecycleTask;
  isAdmin: boolean;
  isRunActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "completed" || task.status === "skipped";

  function handleAction(action: "completed" | "skipped") {
    startTransition(async () => {
      await completeTask(task.id, action);
    });
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${taskStatusColors[task.status] ?? taskStatusColors.pending} ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className="mt-0.5 shrink-0">
          {task.status === "completed" ? (
            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
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
            <div className="h-5 w-5 rounded-full border-2 border-navy-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-semibold ${isDone ? "text-navy-400 line-through" : "text-navy-900"}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-navy-400">
                  {taskTypeLabels[task.task_type] ?? task.task_type}
                </span>
                {task.due_at && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span className={`text-xs ${!isDone && new Date(task.due_at) < new Date() ? "text-red-500 font-medium" : "text-navy-400"}`}>
                      Due {new Date(task.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAdmin && isRunActive && !isDone && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAction("completed")}
                  disabled={isPending}
                  className="text-xs font-medium text-blue-700 hover:text-green-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("skipped")}
                  disabled={isPending}
                  className="text-xs font-medium text-navy-500 hover:text-navy-700 bg-navy-50 hover:bg-navy-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-navy-500 mt-1.5">{task.description}</p>
          )}

          {task.completed_at && (
            <p className="text-xs text-navy-400 mt-1">
              {task.status === "completed" ? "Completed" : "Skipped"}{" "}
              {new Date(task.completed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskChecklist({
  tasks,
  isAdmin,
  runStatus,
}: {
  tasks: LifecycleTask[];
  isAdmin: boolean;
  runStatus: string;
}) {
  const isRunActive = runStatus === "in_progress";

  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress" || t.status === "blocked");
  const done = tasks.filter((t) => t.status === "completed" || t.status === "skipped");

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-navy-200 p-8 text-center">
        <p className="text-sm text-navy-500">No tasks in this run.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-navy-900 mb-3">Remaining ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} isAdmin={isAdmin} isRunActive={isRunActive} />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-navy-400 mb-3">Done ({done.length})</h2>
          <div className="space-y-2">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} isAdmin={isAdmin} isRunActive={isRunActive} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
