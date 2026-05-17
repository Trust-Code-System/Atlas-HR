"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplate } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";
const TEMPLATE_TYPE_OPTIONS = [
  { value: "onboarding", label: "Onboarding" },
  { value: "offboarding", label: "Offboarding" },
];
const TASK_TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "document", label: "Document" },
  { value: "training", label: "Training" },
  { value: "meeting", label: "Meeting" },
  { value: "equipment", label: "Equipment" },
  { value: "access", label: "Access" },
];

interface TaskRow {
  id: number;
  title: string;
  taskType: string;
  dueDays: string;
}

let nextId = 1;

export function NewTemplateForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTemplate, null);
  const [tasks, setTasks] = useState<TaskRow[]>([{ id: nextId++, title: "", taskType: "task", dueDays: "0" }]);

  useEffect(() => {
    if (state?.success) router.push("/onboarding/templates");
  }, [state, router]);

  function addTask() {
    setTasks((prev) => [...prev, { id: nextId++, title: "", taskType: "task", dueDays: "0" }]);
  }

  function removeTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTask(id: number, field: keyof Omit<TaskRow, "id">, value: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  }

  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-6">
      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        )}

        <div>
          <label className={labelCls}>Template name <span className="text-red-500">*</span></label>
          <Input name="name" placeholder="e.g. Standard Engineering Onboarding" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Type</label>
            <Select name="type" options={TEMPLATE_TYPE_OPTIONS} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            name="description"
            className="flex min-h-[70px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            placeholder="Optional — describe when to use this template"
          />
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={labelCls + " mb-0"}>Tasks</label>
            <button
              type="button"
              onClick={addTask}
              className="text-xs font-medium text-blue-700 hover:text-green-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add task
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task, idx) => (
              <div key={task.id} className="border border-navy-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-navy-400 font-semibold mt-2.5 w-5 shrink-0">{idx + 1}.</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        name="task_title"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, "title", e.target.value)}
                        placeholder="Task title…"
                        className="flex h-9 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        name="task_type"
                        value={task.taskType}
                        onChange={(value) => updateTask(task.id, "taskType", value)}
                        triggerClassName="h-9 rounded-lg px-2"
                        options={TASK_TYPE_OPTIONS}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          name="due_offset_days"
                          value={task.dueDays}
                          onChange={(e) => updateTask(task.id, "dueDays", e.target.value)}
                          min="0"
                          max="365"
                          className="flex h-9 w-full rounded-lg border border-navy-200 bg-white px-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          title="Due offset in days from start date"
                        />
                        <span className="text-xs text-navy-400 shrink-0">d</span>
                      </div>
                    </div>
                  </div>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="text-navy-400 hover:text-red-500 mt-1.5 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-navy-400 mt-2">&quot;d&quot; = days after start date. 0 = due on start date.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/onboarding/templates" className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>Create template</Button>
        </div>
      </form>
    </div>
  );
}
