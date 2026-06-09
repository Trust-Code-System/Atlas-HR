"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type TaskActionResult = { error?: string; success?: boolean; saved?: number } | null;

const TASK_TYPES = [
  "profile_update", "document_upload", "policy_acknowledgment", "training",
  "onboarding", "offboarding", "leave", "custom",
] as const;
type TaskType = (typeof TASK_TYPES)[number];

export interface NewTaskInput {
  title: string;
  description?: string | null;
  task_type?: string | null;
  due_at?: string | null; // ISO date
  employee_id?: string | null;
}

export async function saveExtractedTasks(tasks: NewTaskInput[]): Promise<TaskActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };
  if (!Array.isArray(tasks) || tasks.length === 0) return { error: "No tasks to save." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate any provided employee_ids belong to this org.
  const empIds = [...new Set(tasks.map((t) => t.employee_id).filter(Boolean))] as string[];
  let validEmpIds = new Set<string>();
  if (empIds.length) {
    const { data: emps } = await supabase
      .from("employees")
      .select("id")
      .eq("org_id", orgCtx.org.id)
      .in("id", empIds);
    validEmpIds = new Set((emps ?? []).map((e) => e.id));
  }

  const rows = tasks
    .filter((t) => t.title?.trim())
    .map((t) => ({
      org_id: orgCtx.org.id,
      employee_id: t.employee_id && validEmpIds.has(t.employee_id) ? t.employee_id : null,
      title: t.title.trim().slice(0, 200),
      description: t.description?.trim() ? t.description.trim().slice(0, 1000) : null,
      task_type: (TASK_TYPES.includes(t.task_type as TaskType) ? t.task_type : "custom") as TaskType,
      due_at: t.due_at ? new Date(t.due_at).toISOString() : null,
      status: "pending" as const,
      created_by: user?.id ?? null,
    }));

  if (rows.length === 0) return { error: "No valid tasks to save." };

  const { error } = await supabase.from("employee_tasks").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  return { success: true, saved: rows.length };
}

export async function setTaskStatus(
  taskId: string,
  status: "pending" | "in_progress" | "completed" | "cancelled"
): Promise<TaskActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_tasks")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}
