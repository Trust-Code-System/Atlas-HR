"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { revalidatePath } from "next/cache";

export type PortalOnboardingResult = { error?: string; success?: boolean } | null;

export async function completeMyTask(
  taskId: string,
  action: "completed" | "skipped"
): Promise<PortalOnboardingResult> {
  const employee = await getMyEmployee();
  if (!employee) return { error: "Employee account not linked." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    .eq("employee_id", employee.id)
    .single();

  if (!run) return { error: "Not authorised." };

  const { error } = await supabase
    .from("lifecycle_tasks")
    .update({
      status: action,
      completed_by: user?.id ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

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

  revalidatePath("/portal/onboarding");
  return { success: true };
}
