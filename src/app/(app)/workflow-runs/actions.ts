"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { logActivity } from "@/lib/activity/log";

export async function updateWorkflowRunStatus(formData: FormData) {
  const runId = String(formData.get("run_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!runId || !["completed", "cancelled", "in_progress"].includes(status)) {
    redirect("/workflow-runs");
  }

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("id", runId)
    .eq("org_id", orgCtx.org.id)
    .maybeSingle();

  if (!run) redirect("/workflow-runs");

  const update = {
    status: status as "completed" | "cancelled" | "in_progress",
    completed_at: status === "completed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("workflow_runs").update(update).eq("id", runId);

  await logActivity({
    orgId: orgCtx.org.id,
    resourceType: "workflow",
    resourceId: runId,
    resourceDisplayName: run.title,
    action: status === "completed" ? "completed" : "updated",
    before: run,
    after: { ...run, ...update },
    reason: `Workflow run marked ${status}.`,
  });

  revalidatePath("/workflow-runs");
  revalidatePath(`/workflow-runs/${runId}`);
}

export async function updateWorkflowRunTaskStatus(formData: FormData) {
  const runId = String(formData.get("run_id") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!runId || !taskId || !["pending", "in_progress", "completed", "cancelled"].includes(status)) {
    redirect(runId ? `/workflow-runs/${runId}` : "/workflow-runs");
  }

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: run }, { data: task }] = await Promise.all([
    supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", runId)
      .eq("org_id", orgCtx.org.id)
      .maybeSingle(),
    supabase
      .from("employee_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("org_id", orgCtx.org.id)
      .eq("related_resource_type", "workflow_run")
      .eq("related_resource_id", runId)
      .maybeSingle(),
  ]);

  if (!run || !task) redirect("/workflow-runs");

  const update = {
    status: status as "pending" | "in_progress" | "completed" | "cancelled",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  await supabase.from("employee_tasks").update(update).eq("id", taskId);

  const { data: runTasks } = await supabase
    .from("employee_tasks")
    .select("id, status")
    .eq("org_id", orgCtx.org.id)
    .eq("related_resource_type", "workflow_run")
    .eq("related_resource_id", runId);

  const taskRows = runTasks ?? [];
  const allTasksCompleted = taskRows.length > 0 && taskRows.every((item) => item.status === "completed");

  if (allTasksCompleted) {
    await supabase
      .from("workflow_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } else if (run.status === "completed") {
    await supabase
      .from("workflow_runs")
      .update({
        status: "in_progress",
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  await logActivity({
    orgId: orgCtx.org.id,
    resourceType: "task",
    resourceId: taskId,
    resourceDisplayName: task.title,
    action: status === "completed" ? "completed" : "updated",
    before: task,
    after: { ...task, ...update },
    reason: `Workflow action marked ${status}.`,
  });

  revalidatePath("/workflow-runs");
  revalidatePath(`/workflow-runs/${runId}`);
}
