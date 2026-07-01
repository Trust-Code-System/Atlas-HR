/**
 * Atlas AI action agent — the "Copilot that does things, with your approval".
 *
 * The agent NEVER executes on its own. It *proposes* structured actions
 * (`AgentAction`) that a human reviews and explicitly approves in the UI; only
 * then is `executeAgentAction` called from a guarded endpoint. Every execution
 * re-checks permissions server-side and writes an audit-log entry.
 *
 * Supported actions are deliberately limited to safe, reversible workspace
 * operations: creating tasks (org-level or assigned to a person), posting an
 * announcement, filing a leave request, approving/rejecting a pending leave
 * request, and sending an in-app notification. Sending external email,
 * terminations, pay changes, deletions, and bulk operations are intentionally
 * NOT proposable here.
 *
 * Every action carries the entity ids it operates on (resolved from names at
 * plan time, see plan-actions.ts) so execution is deterministic; it also keeps
 * the human-readable names for display and audit. The executor still
 * re-verifies every id belongs to the caller's org before writing.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Permission } from "@/lib/auth/permissions-shared";
import { logActivity } from "@/lib/activity/log";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const taskItemSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  due_at: isoDate.optional(),
});

export const LEAVE_TYPES = [
  "annual",
  "sick",
  "personal",
  "maternity",
  "paternity",
  "bereavement",
  "unpaid",
  "other",
] as const;

export const agentActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_tasks"),
    summary: z.string().min(2).max(300),
    tasks: z.array(taskItemSchema).min(1).max(25),
  }),
  z.object({
    type: z.literal("assign_task"),
    summary: z.string().min(2).max(300),
    employee_id: z.string().uuid(),
    employee_name: z.string().min(1).max(200),
    assigned_to: z.string().uuid().nullable().optional(),
    title: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    due_at: isoDate.optional(),
  }),
  z.object({
    type: z.literal("create_announcement"),
    summary: z.string().min(2).max(300),
    title: z.string().min(2).max(200),
    body: z.string().min(1).max(5000),
  }),
  z.object({
    type: z.literal("create_leave_request"),
    summary: z.string().min(2).max(300),
    employee_id: z.string().uuid(),
    employee_name: z.string().min(1).max(200),
    leave_type: z.enum(LEAVE_TYPES),
    start_date: isoDate,
    end_date: isoDate,
    reason: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal("decide_leave"),
    summary: z.string().min(2).max(300),
    leave_request_id: z.string().uuid(),
    decision: z.enum(["approve", "reject"]),
    employee_name: z.string().min(1).max(200),
    leave_type: z.string().max(60),
    start_date: isoDate,
    end_date: isoDate,
  }),
  z.object({
    type: z.literal("send_notification"),
    summary: z.string().min(2).max(300),
    recipient_user_id: z.string().uuid(),
    recipient_name: z.string().min(1).max(200),
    title: z.string().min(2).max(200),
    body: z.string().min(1).max(2000),
  }),
]);

export type AgentAction = z.infer<typeof agentActionSchema>;
export type AgentActionType = AgentAction["type"];

/** Permissions that allow EXECUTING each action type (any one is sufficient). */
export const AGENT_ACTION_PERMISSIONS: Record<AgentActionType, Permission[]> = {
  create_tasks: ["manage_employees", "all_hr", "approve_team"],
  assign_task: ["manage_employees", "all_hr", "approve_team"],
  create_announcement: ["manage_settings", "all_hr", "manage_admins"],
  create_leave_request: ["manage_employees", "all_hr", "approve_team", "approve_all"],
  decide_leave: ["approve_team", "approve_all", "all_hr", "manage_employees"],
  send_notification: ["manage_employees", "all_hr", "approve_team", "manage_settings"],
};

/** Human-readable labels for the UI. */
export const AGENT_ACTION_LABELS: Record<AgentActionType, string> = {
  create_tasks: "Create workspace tasks",
  assign_task: "Assign a task to someone",
  create_announcement: "Post an announcement",
  create_leave_request: "File a leave request",
  decide_leave: "Approve / reject leave",
  send_notification: "Send a notification",
};

export interface ExecuteResult {
  ok: boolean;
  type: AgentActionType;
  created: number;
  detail: string;
}

/** Confirm an employee id is in this org (RLS already scopes, this is defence-in-depth). */
async function assertEmployeeInOrg(
  supabase: SupabaseClient<Database>,
  orgId: string,
  employeeId: string,
): Promise<void> {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) throw new Error("That employee is not in your organisation.");
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

  if (action.type === "assign_task") {
    await assertEmployeeInOrg(supabase, orgId, action.employee_id);
    const { data, error } = await supabase
      .from("employee_tasks")
      .insert({
        org_id: orgId,
        employee_id: action.employee_id,
        assigned_to: action.assigned_to ?? null,
        title: action.title,
        description: action.description ?? null,
        due_at: action.due_at ? new Date(`${action.due_at}T00:00:00Z`).toISOString() : null,
        task_type: "custom",
        status: "pending",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity({
      orgId,
      resourceType: "task",
      resourceId: data.id,
      resourceDisplayName: action.title,
      action: "created",
      after: { title: action.title, assigned_to: action.employee_name },
      reason: "Approved Atlas AI action",
      source: "web",
    }).catch(() => {});
    return {
      ok: true,
      type: action.type,
      created: 1,
      detail: `Task assigned to ${action.employee_name}.`,
    };
  }

  if (action.type === "create_leave_request") {
    await assertEmployeeInOrg(supabase, orgId, action.employee_id);
    if (action.end_date < action.start_date) {
      throw new Error("End date must be on or after the start date.");
    }
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: action.employee_id,
        leave_type: action.leave_type,
        start_date: action.start_date,
        end_date: action.end_date,
        reason: action.reason ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity({
      orgId,
      resourceType: "leave_request",
      resourceId: data.id,
      resourceDisplayName: `${action.leave_type} leave for ${action.employee_name}`,
      action: "requested",
      after: {
        employee: action.employee_name,
        leave_type: action.leave_type,
        start_date: action.start_date,
        end_date: action.end_date,
      },
      reason: "Approved Atlas AI action",
      source: "web",
    }).catch(() => {});
    return {
      ok: true,
      type: action.type,
      created: 1,
      detail: `Leave request filed for ${action.employee_name} (pending approval).`,
    };
  }

  if (action.type === "decide_leave") {
    // Re-verify the request belongs to this org via its employee (leave_requests
    // has no org_id of its own).
    const { data: req } = await supabase
      .from("leave_requests")
      .select("id, employee_id, status")
      .eq("id", action.leave_request_id)
      .maybeSingle();
    if (!req) throw new Error("That leave request no longer exists.");
    await assertEmployeeInOrg(supabase, orgId, req.employee_id);
    if (req.status !== "pending") {
      throw new Error(`That request has already been ${req.status}.`);
    }
    const approve = action.decision === "approve";
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: approve ? "approved" : "rejected",
        approver_id: userId,
        approved_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", action.leave_request_id);
    if (error) throw new Error(error.message);
    await logActivity({
      orgId,
      resourceType: "leave_request",
      resourceId: action.leave_request_id,
      resourceDisplayName: `${action.leave_type} leave for ${action.employee_name}`,
      action: approve ? "approved" : "rejected",
      after: { decision: action.decision, employee: action.employee_name },
      reason: "Approved Atlas AI action",
      source: "web",
    }).catch(() => {});
    return {
      ok: true,
      type: action.type,
      created: 1,
      detail: `Leave for ${action.employee_name} ${approve ? "approved" : "rejected"}.`,
    };
  }

  if (action.type === "send_notification") {
    // Confirm the recipient is a member of this org (linked to an employee).
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("org_id", orgId)
      .eq("linked_user_id", action.recipient_user_id)
      .maybeSingle();
    if (!emp) throw new Error("That recipient is not in your organisation.");
    const { error } = await supabase.from("notifications").insert({
      user_id: action.recipient_user_id,
      type: "atlas_message",
      title: action.title,
      body: action.body,
      link: null,
    });
    if (error) throw new Error(error.message);
    await logActivity({
      orgId,
      resourceType: "workspace",
      resourceId: emp.id,
      resourceDisplayName: `Notification to ${action.recipient_name}`,
      action: "created",
      after: { recipient: action.recipient_name, title: action.title },
      reason: "Approved Atlas AI action",
      source: "web",
    }).catch(() => {});
    return {
      ok: true,
      type: action.type,
      created: 1,
      detail: `Notification sent to ${action.recipient_name}.`,
    };
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
