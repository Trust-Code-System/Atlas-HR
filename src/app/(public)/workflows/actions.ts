"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { logActivity } from "@/lib/activity/log";
import {
  getWorkflowBundle,
  getWorkflowLaunchTarget,
} from "@/lib/public-resource-data";
import type { Json } from "@/types/database";

export async function launchWorkflowRun(formData: FormData) {
  const workflowSlug = String(formData.get("workflow_slug") ?? "");
  const workflow = getWorkflowBundle(workflowSlug);
  if (!workflow) redirect("/workflows");

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect(`/sign-in?next=/workflows/${workflowSlug}`);
  if (!orgCtx.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/workflows/${workflowSlug}`);

  const launch = getWorkflowLaunchTarget(workflowSlug);
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 7);

  const launchContext = {
    workflow_slug: workflow.slug,
    intent: workflow.intent,
    country_aware: workflow.countryAware,
    templates: workflow.templateSlugs,
    tools: workflow.toolSlugs,
    saved_actions: workflow.savedActions,
    trust_signals: workflow.trustSignals,
    counsel_flags: workflow.whenToCallCounsel,
  };

  const { data: run, error } = await supabase
    .from("workflow_runs")
    .insert({
      org_id: orgCtx.org.id,
      workflow_slug: workflow.slug,
      title: workflow.title,
      summary: workflow.summary,
      status: "in_progress",
      priority: workflow.whenToCallCounsel.length > 0 ? "high" : "normal",
      launch_context: launchContext as Json,
      next_step_url: launch.href,
      created_by: user.id,
      due_at: dueAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !run) {
    redirect(`/workflows/${workflowSlug}?error=launch_failed`);
  }

  const now = new Date();
  const taskRows = workflow.savedActions.map((action, index) => {
    const taskDue = new Date(now);
    taskDue.setDate(taskDue.getDate() + Math.min(index + 1, 7));
    return {
      org_id: orgCtx.org.id,
      employee_id: null,
      assigned_to: user.id,
      title: action,
      description: `${workflow.title}: ${workflow.steps[index] ?? workflow.summary}`,
      task_type: "custom" as const,
      related_resource_type: "workflow_run",
      related_resource_id: run.id,
      due_at: taskDue.toISOString(),
      status: "pending" as const,
      created_by: user.id,
    };
  });

  if (taskRows.length > 0) {
    await supabase.from("employee_tasks").insert(taskRows);
  }

  await logActivity({
    orgId: orgCtx.org.id,
    resourceType: "workflow",
    resourceId: run.id,
    resourceDisplayName: workflow.title,
    action: "created",
    after: launchContext,
    reason: "Workflow bundle launched from public workflow page.",
  });

  revalidatePath("/workflow-runs");
  redirect(`/workflow-runs/${run.id}`);
}
