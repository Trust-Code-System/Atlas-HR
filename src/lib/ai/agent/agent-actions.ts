/**
 * Atlas AI action agent — the "Copilot that does things, with your approval".
 *
 * The agent NEVER executes on its own. It *proposes* structured actions
 * (`AgentAction`) that a human reviews and explicitly approves in the UI; only
 * then is `executeAgentAction` called from a guarded endpoint. Every execution
 * re-checks permissions server-side and writes an audit-log entry.
 *
 * Supported actions are deliberately limited to safe, reversible workspace
 * creates (tasks, announcements). Sending external email, terminations, pay
 * changes, deletions, and bulk operations are intentionally NOT proposable here.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Permission } from "@/lib/auth/permissions-shared";
import { logActivity } from "@/lib/activity/log";

const taskItemSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const agentActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_tasks"),
    summary: z.string().min(2).max(300),
    tasks: z.array(taskItemSchema).min(1).max(25),
  }),
  z.object({
    type: z.literal("create_announcement"),
    summary: z.string().min(2).max(300),
    title: z.string().min(2).max(200),
    body: z.string().min(1).max(5000),
  }),
]);

export type AgentAction = z.infer<typeof agentActionSchema>;
export type AgentActionType = AgentAction["type"];

/** Permissions that allow EXECUTING each action type (any one is sufficient). */
export const AGENT_ACTION_PERMISSIONS: Record<AgentActionType, Permission[]> = {
  create_tasks: ["manage_employees", "all_hr", "approve_team"],
  create_announcement: ["manage_settings", "all_hr", "manage_admins"],
};

/** Human-readable labels for the UI. */
export const AGENT_ACTION_LABELS: Record<AgentActionType, string> = {
  create_tasks: "Create workspace tasks",
  create_announcement: "Post an announcement",
};

export interface ExecuteResult {
  ok: boolean;
  type: AgentActionType;
  created: number;
  detail: string;
}

/**
 * Execute a single approved action. The caller MUST have already verified the
 * user is permitted (see the execute route); this performs the write and audit.
 */
export async function executeAgentAction(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  action: AgentAction,
): Promise<ExecuteResult> {
  if (action.type === "create_tasks") {
    const rows = action.tasks.map((t) => ({
      org_id: orgId,
      title: t.title,
      description: t.description ?? null,
      due_at: t.due_at ? new Date(`${t.due_at}T00:00:00Z`).toISOString() : null,
      task_type: "custom" as const,
      status: "pending" as const,
      created_by: userId,
      employee_id: null,
    }));
    const { data, error } = await supabase.from("employee_tasks").insert(rows).select("id");
    if (error) throw new Error(error.message);
    const created = data?.length ?? 0;
    await logActivity({
      orgId,
      resourceType: "task",
      resourceId: data?.[0]?.id ?? "bulk",
      resourceDisplayName: `${created} task(s) created by Atlas AI`,
      action: "created",
      after: { count: created, titles: action.tasks.map((t) => t.title) },
      reason: "Approved Atlas AI action",
      source: "web",
    }).catch(() => {});
    return { ok: true, type: action.type, created, detail: `Created ${created} task(s).` };
  }

  // create_announcement
  const { data, error } = await supabase
    .from("workspace_announcements")
    .insert({
      org_id: orgId,
      title: action.title,
      body: action.body,
      published_by: userId,
      published_at: new Date().toISOString(),
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logActivity({
    orgId,
    resourceType: "workspace",
    resourceId: data.id,
    resourceDisplayName: action.title,
    action: "created",
    after: { title: action.title },
    reason: "Approved Atlas AI action",
    source: "web",
  }).catch(() => {});
  return { ok: true, type: action.type, created: 1, detail: "Announcement posted." };
}
