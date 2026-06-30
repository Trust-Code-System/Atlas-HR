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
import { searchOrgKnowledge } from "@/lib/ai/kb/retrieve";

export interface HrToolContext {
  supabase: SupabaseClient<Database>;
  orgId: string;
  /** Whether the viewer is an HR admin/owner (affects how results are framed). */
  isAdmin: boolean;
  /**
   * Column-level gate for salary/compensation. RLS protects rows, not columns —
   * a manager can see a report's employee row but must NOT see its salary unless
   * granted `view_compensation`. Computed server-side from the live permissions.
   */
  canViewCompensation?: boolean;
  /** Whether the viewer may see performance-review data across the org. */
  canViewPerformance?: boolean;
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
  end_date: string | null;
  country: string | null;
};

async function loadDirectory(ctx: HrToolContext): Promise<DirEmployee[]> {
  const { data } = await ctx.supabase
    .from("employees")
    .select(
      "id, full_name, job_title, department, manager_id, status, employment_type, start_date, end_date, country",
    )
    .eq("org_id", ctx.orgId)
    .order("full_name");
  return (data ?? []) as DirEmployee[];
}

/** Months between an ISO date and today (approx, for tenure/probation maths). */
function monthsSince(iso: string | null): number | null {
  if (!iso) return null;
  const start = new Date(`${iso}T00:00:00Z`).getTime();
  if (Number.isNaN(start)) return null;
  return Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24 * 30.44));
}

/** Month-day (MM-DD) of an ISO date, for anniversary windows. */
function monthDay(iso: string | null): string | null {
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(5) : null;
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
  {
    name: "attendance_summary",
    description:
      "Summarise time & attendance over a recent window from logged time entries: total hours, breakdown by category (regular/overtime/sick/holiday/training), overtime and sick-leave totals, and the people with the most sick or overtime hours. Use for 'how's attendance', 'who's logging the most overtime', 'how much sick leave this month'. Note: entries are logged time, not a definitive absence record.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days (default 30, max 365)." },
      },
    },
  },
  {
    name: "turnover_stats",
    description:
      "Workforce stability metrics: current active headcount, leavers (terminated) in a recent window, an annualised turnover rate, average tenure of active staff, and a department breakdown of leavers. Use for 'what's our turnover', 'attrition rate', 'average tenure', 'which team is losing the most people'.",
    input_schema: {
      type: "object",
      properties: {
        months: { type: "number", description: "Look-back window in months for leavers (default 12, max 36)." },
      },
    },
  },
  {
    name: "recruiting_overview",
    description:
      "Snapshot of hiring: open / on-hold / draft / closed job counts, total candidates in the active pipeline, candidate counts by stage (applied/screening/interview/offer/hired/rejected), and recently posted roles. Use for 'how's hiring going', 'how many open roles', 'how many candidates in interview'.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_candidates",
    description:
      "List job applicants, optionally filtered by job title and/or pipeline stage. Returns candidate name, the role they applied to, stage, source and applied date. Use for 'who's in the interview stage', 'candidates for the Engineer role', 'show recent applicants'.",
    input_schema: {
      type: "object",
      properties: {
        job: { type: "string", description: "Job-title filter (case-insensitive substring)." },
        stage: {
          type: "string",
          enum: ["applied", "screening", "interview", "offer", "hired", "rejected"],
          description: "Pipeline stage filter.",
        },
        limit: { type: "number", description: `Max rows (default 25, max ${MAX_ROWS}).` },
      },
    },
  },
  {
    name: "performance_overview",
    description:
      "Summarise performance management: active and recent review cycles, review completion (pending/in-progress/submitted/acknowledged) per cycle, average rating, and counts of high performers and people needing support. Optionally focus on one employee's review history. Requires performance-view permission. Use for 'how are reviews going', 'average performance rating', 'who are our top performers'.",
    input_schema: {
      type: "object",
      properties: {
        employee_name: { type: "string", description: "Optional: focus on one employee's review history." },
      },
    },
  },
  {
    name: "compensation_overview",
    description:
      "Aggregate compensation analysis: number of staff with recorded salary, total annual payroll, average / median / min / max salary, and a per-department salary breakdown — plus the latest payroll run summary. Requires compensation-view permission; refuses otherwise without leaking figures. Use for 'what's our total payroll', 'average salary by department', 'pay range in Engineering'.",
    input_schema: {
      type: "object",
      properties: {
        department: { type: "string", description: "Optional exact department filter." },
      },
    },
  },
  {
    name: "search_company_documents",
    description:
      "Full-text search THIS organisation's own uploaded documents (handbook, policies, contracts) and return the most relevant passages with their document titles. Use this to verify what the company's actual written policy says before answering a policy/procedure question — and cite the document you relied on. If it returns nothing, the company has not uploaded a document covering it.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for (e.g. 'notice period', 'remote work eligibility')." },
      },
      required: ["query"],
    },
  },
  {
    name: "upcoming_milestones",
    description:
      "Upcoming people milestones in the next N days: work anniversaries, employees finishing a standard 6-month probation, and brand-new hires who recently started. Use for 'whose work anniversary is coming up', 'who's finishing probation soon', 'any new joiners'.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-ahead window in days (default 30, max 120)." },
      },
    },
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

function clampNum(input: Json, key: string, def: number, min: number, max: number): number {
  const v = input[key];
  const n = typeof v === "number" ? Math.floor(v) : def;
  return Math.max(min, Math.min(max, n));
}

function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** The next future occurrence (this year or next) of an ISO date's month/day. */
function nextAnniversaryIso(startIso: string): string {
  const start = new Date(`${startIso}T00:00:00Z`);
  const now = new Date(`${today()}T00:00:00Z`);
  const ann = new Date(Date.UTC(now.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  if (ann.getTime() < now.getTime()) ann.setUTCFullYear(ann.getUTCFullYear() + 1);
  return ann.toISOString().slice(0, 10);
}

async function runAttendanceSummary(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  const days = clampNum(input, "days", 30, 1, 365);
  const cutoff = addDays(today(), -days);
  const nameById = new Map(dir.map((e) => [e.id, e.full_name]));

  const { data } = await ctx.supabase
    .from("time_entries")
    .select("employee_id, hours, category, date")
    .eq("org_id", ctx.orgId)
    .gte("date", cutoff);
  const rows = data ?? [];

  const byCategory: Record<string, number> = {};
  const sickByEmp: Record<string, number> = {};
  const overtimeByEmp: Record<string, number> = {};
  let totalHours = 0;
  for (const r of rows) {
    byCategory[r.category] = round((byCategory[r.category] ?? 0) + r.hours, 1);
    totalHours += r.hours;
    if (r.category === "sick") sickByEmp[r.employee_id] = (sickByEmp[r.employee_id] ?? 0) + r.hours;
    if (r.category === "overtime") overtimeByEmp[r.employee_id] = (overtimeByEmp[r.employee_id] ?? 0) + r.hours;
  }

  const topBy = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, hours]) => ({ employee: nameById.get(id) ?? "Unknown", hours: round(hours, 1) }));

  return {
    window_days: days,
    entries: rows.length,
    total_hours: round(totalHours, 1),
    hours_by_category: byCategory,
    overtime_hours: round(byCategory.overtime ?? 0, 1),
    sick_hours: round(byCategory.sick ?? 0, 1),
    top_overtime: topBy(overtimeByEmp),
    top_sick: topBy(sickByEmp),
    note: "Time entries reflect logged time, not a definitive attendance/absence record. Treat patterns as signals, not facts.",
  };
}

function runTurnoverStats(input: Json, dir: DirEmployee[]): Json {
  const months = clampNum(input, "months", 12, 1, 36);
  const cutoff = addDays(today(), -Math.round(months * 30.44));

  const active = dir.filter((e) => e.status === "active");
  const leavers = dir.filter((e) => e.status === "terminated" && e.end_date && e.end_date >= cutoff);

  const tenures = active.map((e) => monthsSince(e.start_date)).filter((n): n is number => n !== null);
  const avgTenureMonths = tenures.length ? round(tenures.reduce((a, b) => a + b, 0) / tenures.length, 1) : null;

  // Simple annualised rate: leavers over the window vs current active headcount.
  const annualisedRate =
    active.length > 0 ? round((leavers.length / active.length) * (12 / months) * 100, 1) : null;

  return {
    window_months: months,
    active_headcount: active.length,
    leavers_in_window: leavers.length,
    annualised_turnover_rate_pct: annualisedRate,
    average_tenure_months: avgTenureMonths,
    average_tenure_years: avgTenureMonths !== null ? round(avgTenureMonths / 12, 1) : null,
    leavers_by_department: countBy(leavers, (e) => e.department),
    note: "Annualised rate is an estimate from leavers in the window against current active headcount.",
  };
}

async function runRecruitingOverview(ctx: HrToolContext): Promise<Json> {
  const { data: jobs } = await ctx.supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });
  const jobRows = jobs ?? [];
  const jobIds = jobRows.map((j) => j.id);

  let apps: { stage: string; job_id: string }[] = [];
  if (jobIds.length) {
    const { data } = await ctx.supabase.from("job_applications").select("stage, job_id").in("job_id", jobIds);
    apps = data ?? [];
  }

  const activePipeline = apps.filter((a) => a.stage !== "hired" && a.stage !== "rejected");
  const recent = addDays(today(), -30);

  return {
    jobs_by_status: countBy(jobRows, (j) => j.status),
    open_positions: jobRows.filter((j) => j.status === "open").length,
    total_candidates: apps.length,
    active_pipeline: activePipeline.length,
    candidates_by_stage: countBy(apps, (a) => a.stage),
    recently_posted: jobRows
      .filter((j) => j.created_at >= recent)
      .slice(0, 10)
      .map((j) => ({ title: j.title, status: j.status, posted: j.created_at.slice(0, 10) })),
  };
}

async function runListCandidates(ctx: HrToolContext, input: Json): Promise<Json> {
  const jobFilter = typeof input.job === "string" ? input.job.toLowerCase() : null;
  const stage = typeof input.stage === "string" ? input.stage : null;
  const limit = clampLimit(input);

  const { data: jobs } = await ctx.supabase.from("jobs").select("id, title").eq("org_id", ctx.orgId);
  const jobRows = jobs ?? [];
  const titleById = new Map(jobRows.map((j) => [j.id, j.title]));
  let jobIds = jobRows.map((j) => j.id);
  if (jobFilter) jobIds = jobRows.filter((j) => j.title.toLowerCase().includes(jobFilter)).map((j) => j.id);
  if (jobIds.length === 0) return { count: 0, candidates: [] };

  let query = ctx.supabase
    .from("job_applications")
    .select("candidate_name, job_id, stage, source, applied_at")
    .in("job_id", jobIds)
    .order("applied_at", { ascending: false })
    .limit(limit);
  if (stage) query = query.eq("stage", stage as "applied" | "screening" | "interview" | "offer" | "hired" | "rejected");
  const { data } = await query;

  return {
    count: (data ?? []).length,
    candidates: (data ?? []).map((a) => ({
      name: a.candidate_name,
      role: titleById.get(a.job_id) ?? "Unknown role",
      stage: a.stage,
      source: a.source,
      applied: a.applied_at?.slice(0, 10) ?? null,
    })),
  };
}

async function runPerformanceOverview(ctx: HrToolContext, input: Json, dir: DirEmployee[]): Promise<Json> {
  if (ctx.canViewPerformance === false) {
    return { error: "You don't have permission to view performance-review data." };
  }
  const { data: cycles } = await ctx.supabase
    .from("performance_cycles")
    .select("id, name, type, status, start_date, end_date")
    .eq("org_id", ctx.orgId)
    .order("start_date", { ascending: false });
  const cycleRows = cycles ?? [];
  if (cycleRows.length === 0) return { cycles: [], note: "No performance cycles have been created yet." };

  const cycleIds = cycleRows.map((c) => c.id);
  const nameByCycle = new Map(cycleRows.map((c) => [c.id, c.name]));
  const { data: reviews } = await ctx.supabase
    .from("performance_reviews")
    .select("cycle_id, employee_id, status, rating")
    .in("cycle_id", cycleIds);
  const reviewRows = reviews ?? [];

  // Single-employee focus.
  if (typeof input.employee_name === "string" && input.employee_name.trim()) {
    const name = input.employee_name.toLowerCase();
    const emp = dir.find((e) => e.full_name.toLowerCase().includes(name));
    if (!emp) return { error: `No employee found matching "${input.employee_name}".` };
    const own = reviewRows.filter((r) => r.employee_id === emp.id);
    return {
      employee: emp.full_name,
      review_count: own.length,
      reviews: own.map((r) => ({
        cycle: nameByCycle.get(r.cycle_id) ?? "Unknown cycle",
        status: r.status,
        rating: r.rating,
      })),
    };
  }

  const ratings = reviewRows.map((r) => r.rating).filter((n): n is number => typeof n === "number");
  const avgRating = ratings.length ? round(ratings.reduce((a, b) => a + b, 0) / ratings.length, 2) : null;

  return {
    active_cycles: cycleRows.filter((c) => c.status === "active").map((c) => ({ name: c.name, type: c.type })),
    cycles: cycleRows.slice(0, 6).map((c) => {
      const inCycle = reviewRows.filter((r) => r.cycle_id === c.id);
      return {
        name: c.name,
        status: c.status,
        period: `${c.start_date} → ${c.end_date}`,
        reviews: inCycle.length,
        by_status: countBy(inCycle, (r) => r.status),
      };
    }),
    total_reviews: reviewRows.length,
    average_rating: avgRating,
    high_performers: ratings.filter((r) => r >= 4).length,
    needs_support: ratings.filter((r) => r <= 2).length,
  };
}

async function runCompensationOverview(ctx: HrToolContext, input: Json): Promise<Json> {
  if (!ctx.canViewCompensation) {
    return { error: "You don't have permission to view compensation data." };
  }
  const deptFilter = typeof input.department === "string" ? input.department : null;

  let query = ctx.supabase
    .from("employees")
    .select("salary, salary_currency, department, status")
    .eq("org_id", ctx.orgId)
    .eq("status", "active")
    .not("salary", "is", null);
  if (deptFilter) query = query.eq("department", deptFilter);
  const { data } = await query;
  const rows = (data ?? []).filter((r) => typeof r.salary === "number") as {
    salary: number;
    salary_currency: string;
    department: string | null;
  }[];

  if (rows.length === 0) {
    return { count_with_salary: 0, note: "No active employees have a recorded salary in scope." };
  }

  const salaries = rows.map((r) => r.salary);
  const currencies = Array.from(new Set(rows.map((r) => r.salary_currency)));
  const byDept: Record<string, { count: number; avg: number; min: number; max: number }> = {};
  for (const r of rows) {
    const k = r.department ?? "Unspecified";
    const bucket = (byDept[k] ??= { count: 0, avg: 0, min: r.salary, max: r.salary });
    bucket.count += 1;
    bucket.avg += r.salary;
    bucket.min = Math.min(bucket.min, r.salary);
    bucket.max = Math.max(bucket.max, r.salary);
  }
  for (const k of Object.keys(byDept)) byDept[k].avg = round(byDept[k].avg / byDept[k].count);

  const { data: lastRun } = await ctx.supabase
    .from("payroll_runs")
    .select("name, pay_period_start, pay_period_end, status, total_gross, total_net, currency")
    .eq("org_id", ctx.orgId)
    .order("pay_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    count_with_salary: rows.length,
    currencies,
    total_annual_payroll: round(salaries.reduce((a, b) => a + b, 0)),
    average_salary: round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
    median_salary: median(salaries),
    min_salary: Math.min(...salaries),
    max_salary: Math.max(...salaries),
    by_department: byDept,
    latest_payroll_run: lastRun ?? null,
    note:
      currencies.length > 1
        ? "Multiple currencies present — totals mix currencies and are indicative only."
        : undefined,
  };
}

async function runSearchCompanyDocuments(ctx: HrToolContext, input: Json): Promise<Json> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) return { error: "Provide a search query." };
  const hits = await searchOrgKnowledge(ctx.supabase, ctx.orgId, query, 6);
  if (hits.length === 0) {
    return {
      query,
      matches: [],
      note: "No matching passages in the company's uploaded documents. Do not invent a policy — say it isn't documented and suggest contacting HR.",
    };
  }
  return {
    query,
    matches: hits.map((h) => ({ document: h.docTitle, passage: h.content })),
  };
}

function runUpcomingMilestones(input: Json, dir: DirEmployee[]): Json {
  const days = clampNum(input, "days", 30, 1, 120);
  const horizon = addDays(today(), days);
  const t = today();
  const active = dir.filter((e) => e.status === "active" && e.start_date);

  const anniversaries: { employee: string; date: string; years: number }[] = [];
  const probationEnds: { employee: string; date: string }[] = [];
  const newHires: { employee: string; start_date: string }[] = [];
  const recentCutoff = addDays(t, -30);

  for (const e of active) {
    const start = e.start_date!;
    const months = monthsSince(start) ?? 0;

    // Work anniversaries (1+ years) falling within the window.
    if (months >= 11) {
      const ann = nextAnniversaryIso(start);
      if (ann >= t && ann <= horizon) {
        anniversaries.push({ employee: e.full_name, date: ann, years: new Date(`${ann}T00:00:00Z`).getUTCFullYear() - new Date(`${start}T00:00:00Z`).getUTCFullYear() });
      }
    }
    // Standard 6-month probation ending within the window.
    const probationEnd = addMonthsIso(start, 6);
    if (probationEnd >= t && probationEnd <= horizon) {
      probationEnds.push({ employee: e.full_name, date: probationEnd });
    }
    // Brand-new joiners (started in the last 30 days).
    if (start >= recentCutoff && start <= t) {
      newHires.push({ employee: e.full_name, start_date: start });
    }
  }

  const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);
  return {
    window_days: days,
    work_anniversaries: anniversaries.sort(byDate),
    probation_ending: probationEnds.sort(byDate),
    new_hires_30d: newHires.sort((a, b) => a.start_date.localeCompare(b.start_date)),
    note: "Probation end assumes a standard 6-month probation; confirm against the actual contract.",
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
        case "attendance_summary":
          result = await runAttendanceSummary(ctx, input, dir);
          break;
        case "turnover_stats":
          result = runTurnoverStats(input, dir);
          break;
        case "recruiting_overview":
          result = await runRecruitingOverview(ctx);
          break;
        case "list_candidates":
          result = await runListCandidates(ctx, input);
          break;
        case "performance_overview":
          result = await runPerformanceOverview(ctx, input, dir);
          break;
        case "compensation_overview":
          result = await runCompensationOverview(ctx, input);
          break;
        case "search_company_documents":
          result = await runSearchCompanyDocuments(ctx, input);
          break;
        case "upcoming_milestones":
          result = runUpcomingMilestones(input, dir);
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
