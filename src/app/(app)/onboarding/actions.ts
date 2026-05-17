"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type OnboardingActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function startRun(
  _prev: OnboardingActionResult,
  formData: FormData
): Promise<OnboardingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const employee_id = formData.get("employee_id") as string;
  const template_id = formData.get("template_id") as string;
  const reference_date = formData.get("reference_date") as string;
  const type = (formData.get("type") as string) || "onboarding";

  if (!employee_id) return { error: "Employee is required." };
  if (!template_id) return { error: "Template is required." };
  if (!reference_date) return { error: "Start date is required." };

  const supabase = await createClient();

  // Verify employee and template belong to org
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return { error: "Employee not found." };

  const { data: template } = await supabase
    .from("lifecycle_templates")
    .select("id")
    .eq("id", template_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!template) return { error: "Template not found." };

  const { data: run, error: runError } = await supabase
    .from("lifecycle_runs")
    .insert({
      template_id,
      employee_id,
      type: type as "onboarding" | "offboarding",
      reference_date,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (runError || !run) return { error: runError?.message ?? "Failed to start run." };

  // Copy tasks from template
  const { data: templateTasks } = await supabase
    .from("lifecycle_template_tasks")
    .select("*")
    .eq("template_id", template_id)
    .order("task_order", { ascending: true });

  if (templateTasks && templateTasks.length > 0) {
    const refDate = new Date(reference_date);
    const taskInserts = templateTasks.map((t) => {
      const dueAt = t.due_offset_days != null
        ? new Date(refDate.getTime() + t.due_offset_days * 86400000).toISOString()
        : null;
      return {
        run_id: run.id,
        template_task_id: t.id,
        title: t.title,
        description: t.description,
        task_type: t.task_type,
        due_at: dueAt,
        status: "pending" as const,
      };
    });

    await supabase.from("lifecycle_tasks").insert(taskInserts);
  }

  revalidatePath("/onboarding");
  return { success: true, id: run.id };
}

export async function completeTask(
  taskId: string,
  action: "completed" | "skipped"
): Promise<OnboardingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify via run → employee → org
  const { data: task } = await supabase
    .from("lifecycle_tasks")
    .select("id, run_id")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found." };

  const { data: run } = await supabase
    .from("lifecycle_runs")
    .select("id, employee_id")
    .eq("id", task.run_id)
    .single();

  if (!run) return { error: "Run not found." };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", run.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return { error: "Not authorised." };

  const { error } = await supabase
    .from("lifecycle_tasks")
    .update({
      status: action,
      completed_by: user?.id ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  // Check if all tasks are done → auto-complete the run
  const { data: remaining } = await supabase
    .from("lifecycle_tasks")
    .select("id")
    .eq("run_id", task.run_id)
    .in("status", ["pending", "in_progress", "blocked"]);

  if (!remaining || remaining.length === 0) {
    await supabase
      .from("lifecycle_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", task.run_id);
  }

  revalidatePath(`/onboarding/${task.run_id}`);
  return { success: true };
}

export async function createTemplate(
  _prev: OnboardingActionResult,
  formData: FormData
): Promise<OnboardingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "onboarding";
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) return { error: "Template name is required." };

  const titles = formData.getAll("task_title") as string[];
  const taskTypes = formData.getAll("task_type") as string[];
  const dueDays = formData.getAll("due_offset_days") as string[];

  const supabase = await createClient();

  const { data: template, error: tErr } = await supabase
    .from("lifecycle_templates")
    .insert({
      org_id: orgCtx.org.id,
      name: name.trim(),
      type: type as "onboarding" | "offboarding",
      description: description?.trim() || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (tErr || !template) return { error: tErr?.message ?? "Failed to create template." };

  const validTasks = titles
    .map((title, i) => ({ title: title.trim(), taskType: taskTypes[i] ?? "task", dueOffset: parseInt(dueDays[i] ?? "0") || 0 }))
    .filter((t) => t.title.length > 0);

  if (validTasks.length > 0) {
    await supabase.from("lifecycle_template_tasks").insert(
      validTasks.map((t, i) => ({
        template_id: template.id,
        task_order: i + 1,
        title: t.title,
        task_type: t.taskType,
        assignee_type: "manager",
        due_offset_days: t.dueOffset,
        is_required: true,
      }))
    );
  }

  revalidatePath("/onboarding/templates");
  return { success: true, id: template.id };
}
