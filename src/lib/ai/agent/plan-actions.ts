/**
 * Atlas AI action planner (shared).
 *
 * Turns a natural-language instruction into a set of PROPOSED, fully-resolved
 * `AgentAction`s for a human to approve. The language model only ever emits
 * "soft" actions that reference people by NAME; this module resolves those
 * names to concrete employee / user / leave-request ids against the caller's
 * own (RLS-scoped) data, so the resulting proposals are deterministic and the
 * execute step never has to guess who was meant. Anything that can't be
 * resolved unambiguously is dropped (and surfaced in `note`), never guessed.
 *
 * Nothing is executed here — execution happens only via the guarded
 * /api/ai/agent/execute endpoint after explicit approval.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";
import { hasAnyPermission } from "@/lib/auth/permissions";
import {
  AGENT_ACTION_PERMISSIONS,
  AGENT_ACTION_LABELS,
  LEAVE_TYPES,
  type AgentAction,
  type AgentActionType,
} from "@/lib/ai/agent/agent-actions";

export interface PlanContext {
  supabase: SupabaseClient<Database>;
  orgId: string;
  isAdmin: boolean;
}

export interface PlanResult {
  actions: AgentAction[];
  labels: Record<AgentActionType, string>;
  note?: string;
}

/**
 * Cheap pre-filter: does this text plausibly ask Atlas to *do* something? Used
 * by the copilot route to skip the planner model-call for plainly
 * informational chat. Deliberately permissive — the planner itself is the real
 * authority on whether an actionable step exists.
 */
const ACTION_HINT =
  /\b(create|add|make|set up|assign|give|post|announce|publish|notify|message|remind|tell|file|request|book|submit|approve|reject|decline|deny|schedule|draft a task|to-?do|task)\b/i;

export function looksActionable(text: string): boolean {
  return ACTION_HINT.test(text);
}

const softTask = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** What the model is allowed to emit — name-based, no ids. */
const softActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_tasks"),
    summary: z.string().min(1).max(300),
    tasks: z.array(softTask).min(1).max(25),
  }),
  z.object({
    type: z.literal("assign_task"),
    summary: z.string().min(1).max(300),
    assignee_name: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  z.object({
    type: z.literal("create_announcement"),
    summary: z.string().min(1).max(300),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
  }),
  z.object({
    type: z.literal("create_leave_request"),
    summary: z.string().min(1).max(300),
    employee_name: z.string().min(1).max(200),
    leave_type: z.string().max(60).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal("decide_leave"),
    summary: z.string().min(1).max(300),
    employee_name: z.string().min(1).max(200),
    decision: z.enum(["approve", "reject"]),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  z.object({
    type: z.literal("send_notification"),
    summary: z.string().min(1).max(300),
    recipient_name: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
  }),
]);
type SoftAction = z.infer<typeof softActionSchema>;
const softPlanSchema = z.object({ actions: z.array(softActionSchema).max(10) });

type DirRow = { id: string; full_name: string; linked_user_id: string | null };
type PendingLeave = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
};

function normaliseLeaveType(raw: string | undefined): (typeof LEAVE_TYPES)[number] {
  const v = (raw ?? "").toLowerCase().trim();
  return (LEAVE_TYPES as readonly string[]).includes(v)
    ? (v as (typeof LEAVE_TYPES)[number])
    : "other";
}

/** Find the single best directory match for a name; null if none or ambiguous. */
function matchEmployee(dir: DirRow[], name: string): DirRow | null {
  const q = name.toLowerCase().trim();
  if (!q) return null;
  const exact = dir.filter((e) => e.full_name.toLowerCase() === q);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  const partial = dir.filter((e) => e.full_name.toLowerCase().includes(q));
  return partial.length === 1 ? partial[0] : null;
}

function buildSystemPrompt(dir: DirRow[], pending: PendingLeave[]): string {
  const roster =
    dir.length > 0
      ? dir.slice(0, 200).map((e) => `- ${e.full_name}`).join("\n")
      : "(no employees visible)";
  const pendingList =
    pending.length > 0
      ? pending
          .map((p) => {
            const who = dir.find((e) => e.id === p.employee_id)?.full_name ?? "Unknown";
            return `- ${who}: ${p.leave_type} ${p.start_date} → ${p.end_date}`;
          })
          .join("\n")
      : "(none pending)";

  return `You are Atlas AI's action planner. Convert the user's request into concrete, safe, reversible workspace actions for a human to approve. You do NOT execute anything.

Refer to people only by their exact name as it appears in the roster below. Never invent people, ids, or leave requests.

Roster (people you may reference):
${roster}

Pending leave requests (for approve/reject):
${pendingList}

Allowed action types:
- "create_tasks": one or more general workspace to-dos not tied to a person. Each task: short "title", optional "description", optional "due_at" (YYYY-MM-DD).
- "assign_task": a single to-do assigned to one named person ("assignee_name"), with "title", optional "description", optional "due_at".
- "create_announcement": a single company announcement with "title" and "body".
- "create_leave_request": file leave for one named person ("employee_name"), with "leave_type" (annual, sick, personal, maternity, paternity, bereavement, unpaid, other), "start_date", "end_date" (YYYY-MM-DD), optional "reason".
- "send_notification": an in-app message to one named person ("recipient_name"), with "title" and "body".
- "decide_leave": approve or reject ONE pending leave request, identified by "employee_name" (+ optional "start_date"/"end_date" to disambiguate) and "decision" ("approve" | "reject"). Only use a person who appears in the pending list.

Rules:
- Never propose terminations, pay changes, deletions, sending external email, or bulk personal-data changes — those are out of scope.
- Only propose actions clearly implied by the request. If nothing actionable is present, return an empty list.
- Keep titles short and imperative. Infer due dates only if the user mentions timing; otherwise omit due_at.
- Respond with ONLY valid JSON, no prose, in exactly this shape:
{"actions":[ { "type":"...", "summary":"...", ... } ]}`;
}

/** Resolve one soft action to a strict, id-bearing AgentAction (or null if unresolvable). */
function resolveAction(
  soft: SoftAction,
  dir: DirRow[],
  pending: PendingLeave[],
  unresolved: string[],
): AgentAction | null {
  switch (soft.type) {
    case "create_tasks":
      return { type: "create_tasks", summary: soft.summary, tasks: soft.tasks };
    case "create_announcement":
      return {
        type: "create_announcement",
        summary: soft.summary,
        title: soft.title,
        body: soft.body,
      };
    case "assign_task": {
      const emp = matchEmployee(dir, soft.assignee_name);
      if (!emp) {
        unresolved.push(soft.assignee_name);
        return null;
      }
      return {
        type: "assign_task",
        summary: soft.summary,
        employee_id: emp.id,
        employee_name: emp.full_name,
        assigned_to: emp.linked_user_id,
        title: soft.title,
        description: soft.description,
        due_at: soft.due_at,
      };
    }
    case "create_leave_request": {
      const emp = matchEmployee(dir, soft.employee_name);
      if (!emp) {
        unresolved.push(soft.employee_name);
        return null;
      }
      return {
        type: "create_leave_request",
        summary: soft.summary,
        employee_id: emp.id,
        employee_name: emp.full_name,
        leave_type: normaliseLeaveType(soft.leave_type),
        start_date: soft.start_date,
        end_date: soft.end_date,
        reason: soft.reason,
      };
    }
    case "send_notification": {
      const emp = matchEmployee(dir, soft.recipient_name);
      if (!emp || !emp.linked_user_id) {
        unresolved.push(soft.recipient_name);
        return null;
      }
      return {
        type: "send_notification",
        summary: soft.summary,
        recipient_user_id: emp.linked_user_id,
        recipient_name: emp.full_name,
        title: soft.title,
        body: soft.body,
      };
    }
    case "decide_leave": {
      const emp = matchEmployee(dir, soft.employee_name);
      if (!emp) {
        unresolved.push(soft.employee_name);
        return null;
      }
      let candidates = pending.filter((p) => p.employee_id === emp.id);
      if (candidates.length > 1 && soft.start_date) {
        candidates = candidates.filter((p) => p.start_date === soft.start_date);
      }
      if (candidates.length !== 1) {
        unresolved.push(soft.employee_name);
        return null;
      }
      const req = candidates[0];
      return {
        type: "decide_leave",
        summary: soft.summary,
        leave_request_id: req.id,
        decision: soft.decision,
        employee_name: emp.full_name,
        leave_type: req.leave_type,
        start_date: req.start_date,
        end_date: req.end_date,
      };
    }
  }
}

export async function planAgentActions(
  ctx: PlanContext,
  instruction: string,
): Promise<PlanResult> {
  // Load the data needed to resolve names → ids, scoped by RLS to what this
  // user may see.
  const { data: dirData } = await ctx.supabase
    .from("employees")
    .select("id, full_name, linked_user_id")
    .eq("org_id", ctx.orgId)
    .order("full_name");
  const dir: DirRow[] = (dirData ?? []) as DirRow[];

  let pending: PendingLeave[] = [];
  if (dir.length > 0) {
    const { data: leaveData } = await ctx.supabase
      .from("leave_requests")
      .select("id, employee_id, leave_type, start_date, end_date")
      .eq("status", "pending")
      .in(
        "employee_id",
        dir.map((e) => e.id),
      );
    pending = (leaveData ?? []) as PendingLeave[];
  }

  const raw = await runCompletion({
    system: buildSystemPrompt(dir, pending),
    prompt: instruction,
    maxTokens: 2000,
  });
  const json = extractJson<unknown>(raw);
  const parsed = softPlanSchema.safeParse(json);
  if (!parsed.success || parsed.data.actions.length === 0) {
    return {
      actions: [],
      labels: AGENT_ACTION_LABELS,
      note: "No actionable steps detected — this looks informational.",
    };
  }

  // Resolve names → ids, dropping anything ambiguous.
  const unresolved: string[] = [];
  const resolved = parsed.data.actions
    .map((a) => resolveAction(a, dir, pending, unresolved))
    .filter((a): a is AgentAction => a !== null);

  // Permission-filter: keep only the action types this user is allowed to run.
  const allowedByType = new Map<AgentActionType, boolean>();
  for (const type of Object.keys(AGENT_ACTION_PERMISSIONS) as AgentActionType[]) {
    allowedByType.set(
      type,
      ctx.isAdmin || (await hasAnyPermission(ctx.orgId, AGENT_ACTION_PERMISSIONS[type])),
    );
  }
  const permittedCount = resolved.length;
  const actions = resolved.filter((a) => allowedByType.get(a.type));

  let note: string | undefined;
  if (actions.length === 0) {
    if (permittedCount > 0) {
      note = "You don't have permission to perform the suggested actions.";
    } else if (unresolved.length > 0) {
      note = `Couldn't match ${unresolved.join(", ")} to someone in your workspace.`;
    } else {
      note = "No actionable steps detected — this looks informational.";
    }
  } else if (unresolved.length > 0) {
    note = `Couldn't match ${unresolved.join(", ")} to someone in your workspace — left those out.`;
  }

  return { actions, labels: AGENT_ACTION_LABELS, note };
}
