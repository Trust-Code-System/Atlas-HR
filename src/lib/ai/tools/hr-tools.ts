/**
 * Live HR data tools for the Atlas AI copilot (agentic tool-use).
 *
 * These give the assistant read-only access to the workspace's structured HR
 * data — headcount, employees, leave, time, documents, recruiting — so it can
 * answer questions like "who's on leave next week?" or "how many people are in
 * Engineering?" with real numbers instead of disclaiming that it has no access.
 *
 * SECURITY: every tool runs on the caller's RLS-scoped Supabase client and is
 * additionally org-scoped in code. Row-Level Security is the real boundary:
 *   - admins/HR see the whole org,
 *   - managers see their direct reports,
 *   - employees see only their own record.
 * Nothing here uses the service-role client. All tools are read-only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ToolDef } from "@/lib/ai/provider";

export interface HrToolContext {
  supabase: SupabaseClient<Database>;
  orgId: string;
  /** Whether the viewer is an HR admin/owner (affects how results are framed). */
  isAdmin: boolean;
}

const MAX_ROWS = 50;

/** Today as an ISO date (YYYY-MM-DD), server local. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The org's employees, as visible to the caller under RLS. Loaded once per
 * request and reused across tool calls. For an admin this is the whole org; for
 * a manager it is their reports; for an employee it is just themselves.
 */
type DirEmployee = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  manager_id: string | null;
  status: string;
  employment_type: string | null;
  start_date: string | null;
  country: string | null;
};

async function loadDirectory(ctx: HrToolContext): Promise<DirEmployee[]> {
  const { data } = await ctx.supabase
    .from("employees")
    .select(
      "id, full_name, job_title, department, manager_id, status, employment_type, start_date, country",
    )
    .eq("org_id", ctx.orgId)
    .order("full_name");
  return (data ?? []) as DirEmployee[];
}

// ---------------------------------------------------------------------------
// Tool definitions advertised to the model.
// ---------------------------------------------------------------------------

export const HR_TOOLS: ToolDef[] = [
  {
    name: "org_overview",
    description:
      "Get a high-level snapshot of the organisation right now: total headcount, breakdown by status / department / employment type, how many people are on leave today, pending leave approvals, open job positions, and recent hires (last 30 days). Use this for any 'how many', 'headcount', or 'overview' style question.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_employees",
    description:
      "List employees, optionally filtered. Returns name, job title, department, status, employment type and start date. Use for 'who is in X department', 'list contractors', 'who joined recently', etc.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text name or job-title filter (case-insensitive)." },
        department: { type: "string", description: "Exact department name filter." },
        status: { type: "string", enum: ["active", "on_leave", "terminated"], description: "Employment status filter." },
        limit: { type: "number", description: `Max rows (default 25, max ${MAX_ROWS}).` },
      },
    },
  },
  {
    name: "get_employee",
    description:
      "Get the full profile for one employee, looked up by id or by name. Includes job, department, manager, employment details, start/end dates and their most recent leave requests. Use when asked about a specific person.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Employee UUID, if known." },
        name: { type: "string", description: "Full or partial name (used if id is not given)." },
      },
    },
  },
  {
    name: "whos_on_leave",
    description:
      "Find who is on leave during a date range. Defaults to today if no dates are given. Returns each person, leave type, dates and status. Use for 'who's off this week', 'is anyone on leave on Friday', team coverage questions.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "ISO date YYYY-MM-DD (default: today)." },
        end_date: { type: "string", description: "ISO date YYYY-MM-DD (default: same as start)." },
        status: { type: "string", enum: ["approved", "pending", "all"], description: "Which requests to include (default approved)." },
      },
    },
  },
  {
    name: "list_leave_requests",
    description:
      "List leave requests, optionally by status. Use for 'what leave is pending approval', 'show approved leave', etc.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled", "all"], description: "Status filter (default pending)." },
        limit: { type: "number", description: `Max rows (default 25, max ${MAX_ROWS}).` },
      },
    },
  },
  {
    name: "documents_expiring",
    description:
      "List employee documents that are expiring soon (e.g. visas, certifications, contracts). Use for compliance questions like 'what documents are expiring', 'whose visa runs out soon'.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-ahead window in days (default 30)." },
      },
    },
  },
  {
    name: "pending_approvals",
    description:
      "Summarise everything currently awaiting HR/manager action: pending leave requests and submitted (unapproved) timesheets, with counts. Use for 'what needs my approval', 'what's pending'.",
    input_schema: { type: "object", properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Executor.
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

function clampLimit(input: Json, fallback = 25): number {
  const n = typeof input.limit === "number" ? input.limit : fallback;
  return Math.max(1, Math.min(MAX_ROWS, Math.floor(n)));
}

function countBy<T>(rows: T[], key: (r: T) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r) ?? "unspecified";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

async function runOrgOverview(ctx: HrToolContext, dir: DirEmployee[]): Promise<Json> {
  const ids = dir.map((e) => e.id);
  const t = today();

  const [openJobsRes, onLeaveRes, pendingLeaveRes] = await Promise.all([
    ctx.supabase.from("jobs").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "open"),
    ids.length
      ? ctx.supabase
          .from("leave_requests")
          .select("employee_id, leave_type, start_date, end_date")
          .in("employee_id", ids)
          .eq("status", "approved")
          .lte("start_date", t)
          .gte("end_date", t)
      : Promise.resolve({ data: [] as { employee_id: string }[] }),
    ids.length
      ? ctx.supabase.from("leave_requests").select("id", { count: "exact", head: true }).in("employee_id", ids).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  const active = dir.filter((e) => e.status === "active");
  const recentHires = dir.filter((e) => e.start_date && e.start_date >= addDays(t, -30));

  return {
    headcount_total: dir.length,
    active_count: active.length,
    by_status: countBy(dir, (e) => e.status),
    by_department: countBy(active, (e) => e.department),
    by_employment_type: countBy(active, (e) => e.employment_type),
    on_leave_today: (("data" in onLeaveRes && onLeaveRes.data) || []).length,
    pending_leave_approvals: ("count" in pendingLeaveRes ? pendingLeaveRes.count : 0) ?? 0,
    open_positions: openJobsRes.count ?? 0,
    recent_hires_30d: recentHires.length,
    as_of: t,
  };
}

function runListEmployees(input: Json, dir: DirEmployee[]): Json {
  const q = typeof input.query === "string" ? input.query.toLowerCase() : null;
  const dept = typeof input.department === "string" ? input.department.toLowerCase() : null;
  const status = typeof input.status === "string" ? input.status : null;
  const limit = clampLimit(input);

  let rows = dir;
  if (status) rows = rows.filter((e) => e.status === status);
  if (dept) rows = rows.filter((e) => (e.department ?? "").toLowerCase() === dept);
  if (q) rows = rows.filter((e) => e.full_name.toLowerCase().includes(q) || (e.job_title ?? "").toLowerCase().includes(q));

  return {
    count: rows.length,
    showing: Math.min(rows.length, limit),
    employees: rows.slice(0, limit).map((e) => ({
      id: e.id,
      name: e.full_name,
      job_title: e.job_title,
      department: e.department,
      status: e.status,
      employment_type: e.employment_type,
      start_date: e.start_date,
    })),
  };
}

async function runGetEmployee(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  let id = typeof input.id === "string" ? input.id : null;
  if (!id && typeof input.name === "string") {
    const name = input.name.toLowerCase();
    const matches = dir.filter((e) => e.full_name.toLowerCase().includes(name));
    if (matches.length === 0) return { error: `No employee found matching "${input.name}".` };
    if (matches.length > 1)
      return {
        ambiguous: true,
        matches: matches.slice(0, 10).map((e) => ({ id: e.id, name: e.full_name, job_title: e.job_title })),
        note: "Multiple matches — ask the user which one, or call again with an id.",
      };
    id = matches[0].id;
  }
  if (!id) return { error: "Provide an employee id or name." };

  const { data: emp } = await ctx.supabase
    .from("employees")
    .select("*")
    .eq("org_id", ctx.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!emp) return { error: "Employee not found or not visible to you." };

  const managerName = emp.manager_id ? dir.find((e) => e.id === emp.manager_id)?.full_name ?? null : null;
  const { data: leave } = await ctx.supabase
    .from("leave_requests")
    .select("leave_type, start_date, end_date, status")
    .eq("employee_id", id)
    .order("start_date", { ascending: false })
    .limit(5);

  return {
    id: emp.id,
    name: emp.full_name,
    email: emp.email,
    job_title: emp.job_title,
    department: emp.department,
    manager: managerName,
    status: emp.status,
    employment_type: emp.employment_type,
    country: emp.country,
    start_date: emp.start_date,
    end_date: emp.end_date,
    phone: emp.phone,
    recent_leave: leave ?? [],
  };
}

async function runWhosOnLeave(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  const start = typeof input.start_date === "string" ? input.start_date : today();
  const end = typeof input.end_date === "string" ? input.end_date : start;
  const status = typeof input.status === "string" ? input.status : "approved";
  const ids = dir.map((e) => e.id);
  if (ids.length === 0) return { range: { start, end }, on_leave: [] };
  const nameById = new Map(dir.map((e) => [e.id, e.full_name]));

  // Overlap test: request starts on/before range end AND ends on/after range start.
  let query = ctx.supabase
    .from("leave_requests")
    .select("employee_id, leave_type, start_date, end_date, status")
    .in("employee_id", ids)
    .lte("start_date", end)
    .gte("end_date", start);
  if (status !== "all") query = query.eq("status", status as "approved" | "pending");
  const { data } = await query;

  return {
    range: { start, end },
    status,
    count: (data ?? []).length,
    on_leave: (data ?? []).map((l) => ({
      employee: nameById.get(l.employee_id) ?? "Unknown",
      leave_type: l.leave_type,
      start_date: l.start_date,
      end_date: l.end_date,
      status: l.status,
    })),
  };
}

async function runListLeaveRequests(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  const status = typeof input.status === "string" ? input.status : "pending";
  const limit = clampLimit(input);
  const ids = dir.map((e) => e.id);
  if (ids.length === 0) return { count: 0, requests: [] };
  const nameById = new Map(dir.map((e) => [e.id, e.full_name]));

  let query = ctx.supabase
    .from("leave_requests")
    .select("id, employee_id, leave_type, start_date, end_date, reason, status")
    .in("employee_id", ids)
    .order("start_date", { ascending: false })
    .limit(limit);
  if (status !== "all") query = query.eq("status", status as "pending" | "approved" | "rejected" | "cancelled");
  const { data } = await query;

  return {
    status,
    count: (data ?? []).length,
    requests: (data ?? []).map((l) => ({
      id: l.id,
      employee: nameById.get(l.employee_id) ?? "Unknown",
      leave_type: l.leave_type,
      start_date: l.start_date,
      end_date: l.end_date,
      reason: l.reason,
      status: l.status,
    })),
  };
}

async function runDocumentsExpiring(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  const days = typeof input.days === "number" ? Math.max(1, Math.floor(input.days)) : 30;
  const cutoff = addDays(today(), days);
  const ids = dir.map((e) => e.id);
  if (ids.length === 0) return { window_days: days, count: 0, documents: [] };
  const nameById = new Map(dir.map((e) => [e.id, e.full_name]));

  const { data } = await ctx.supabase
    .from("employee_documents")
    .select("employee_id, doc_type, file_name, expires_at, ai_enabled")
    .in("employee_id", ids)
    .not("expires_at", "is", null)
    .lte("expires_at", cutoff)
    .order("expires_at", { ascending: true })
    .limit(MAX_ROWS);

  // §28: respect the per-document AI flag.
  const visible = (data ?? []).filter((d) => d.ai_enabled !== false);
  return {
    window_days: days,
    count: visible.length,
    documents: visible.map((d) => ({
      employee: nameById.get(d.employee_id) ?? "Unknown",
      doc_type: d.doc_type,
      file_name: d.file_name,
      expires_at: d.expires_at,
    })),
  };
}

async function runPendingApprovals(ctx: HrToolContext, dir: DirEmployee[]): Promise<Json> {
  const ids = dir.map((e) => e.id);
  if (ids.length === 0) return { pending_leave: 0, submitted_timesheets: 0 };

  const [leaveRes, tsRes] = await Promise.all([
    ctx.supabase.from("leave_requests").select("id", { count: "exact", head: true }).in("employee_id", ids).eq("status", "pending"),
    ctx.supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "submitted"),
  ]);

  return {
    pending_leave: leaveRes.count ?? 0,
    submitted_timesheets: tsRes.count ?? 0,
  };
}

/**
 * Builds a tool runner bound to the request's context. Returns a function the
 * provider's agentic loop calls with (name, input); the result is JSON
 * stringified for the model. The employee directory is loaded once and shared.
 */
export function makeHrToolRunner(ctx: HrToolContext) {
  let dirPromise: Promise<DirEmployee[]> | null = null;
  const directory = () => (dirPromise ??= loadDirectory(ctx));

  return async function runTool(name: string, input: Json): Promise<string> {
    let result: Json;
    try {
      const dir = await directory();
      switch (name) {
        case "org_overview":
          result = await runOrgOverview(ctx, dir);
          break;
        case "list_employees":
          result = runListEmployees(input, dir);
          break;
        case "get_employee":
          result = await runGetEmployee(ctx, input, dir);
          break;
        case "whos_on_leave":
          result = await runWhosOnLeave(ctx, input, dir);
          break;
        case "list_leave_requests":
          result = await runListLeaveRequests(ctx, input, dir);
          break;
        case "documents_expiring":
          result = await runDocumentsExpiring(ctx, input, dir);
          break;
        case "pending_approvals":
          result = await runPendingApprovals(ctx, dir);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }
    } catch (err) {
      result = { error: `Tool failed: ${(err as Error).message}` };
    }
    return JSON.stringify(result);
  };
}
