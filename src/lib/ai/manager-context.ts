/**
 * Manager Assistant context (§19).
 *
 * Resolves the signed-in user to their employee record, finds their direct
 * reports, and gathers what's currently pending for that team — leave awaiting
 * approval, submitted timesheets, open tasks, and open disciplinary cases.
 *
 * Used by the Manager Assistant page and the /api/ai/manager-brief route.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ManagerReport {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  status: string;
}

export interface ManagerContext {
  manages: boolean;
  managerEmployeeId: string | null;
  reports: ManagerReport[];
  pendingLeave: Array<{ employee: string; leave_type: string; start_date: string; end_date: string; reason: string | null }>;
  pendingTimesheets: Array<{ employee: string; date: string; hours: number; category: string }>;
  openTasks: Array<{ employee: string | null; title: string; status: string; due_at: string | null }>;
  openCases: Array<{ employee: string; title: string; type: string; severity: string; status: string }>;
}

export async function getManagerContext(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  userEmail: string | null
): Promise<ManagerContext> {
  const empty: ManagerContext = {
    manages: false, managerEmployeeId: null, reports: [],
    pendingLeave: [], pendingTimesheets: [], openTasks: [], openCases: [],
  };

  // Resolve the manager's own employee record.
  let { data: me } = await supabase
    .from("employees")
    .select("id")
    .eq("org_id", orgId)
    .eq("linked_user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!me && userEmail) {
    ({ data: me } = await supabase
      .from("employees")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", userEmail)
      .limit(1)
      .maybeSingle());
  }
  if (!me) return empty;

  const { data: reportRows } = await supabase
    .from("employees")
    .select("id, full_name, job_title, department, status")
    .eq("org_id", orgId)
    .eq("manager_id", me.id)
    .order("full_name");
  const reports = (reportRows ?? []) as ManagerReport[];
  if (reports.length === 0) {
    return { ...empty, managerEmployeeId: me.id };
  }

  const reportIds = reports.map((r) => r.id);
  const nameById = new Map(reports.map((r) => [r.id, r.full_name]));

  const [leave, timesheets, tasks, cases] = await Promise.all([
    supabase.from("leave_requests").select("employee_id, leave_type, start_date, end_date, reason, status").in("employee_id", reportIds).eq("status", "pending"),
    supabase.from("time_entries").select("employee_id, date, hours, category, status").in("employee_id", reportIds).eq("status", "submitted"),
    supabase.from("employee_tasks").select("employee_id, title, status, due_at").in("employee_id", reportIds).in("status", ["pending", "in_progress"]),
    supabase.from("disciplinary_cases").select("employee_id, title, type, severity, status").in("employee_id", reportIds).in("status", ["open", "under_review"]),
  ]);

  return {
    manages: true,
    managerEmployeeId: me.id,
    reports,
    pendingLeave: (leave.data ?? []).map((l) => ({
      employee: nameById.get(l.employee_id) ?? "Report",
      leave_type: l.leave_type, start_date: l.start_date, end_date: l.end_date, reason: l.reason ?? null,
    })),
    pendingTimesheets: (timesheets.data ?? []).map((t) => ({
      employee: nameById.get(t.employee_id) ?? "Report",
      date: t.date, hours: t.hours, category: t.category,
    })),
    openTasks: (tasks.data ?? []).map((t) => ({
      employee: t.employee_id ? nameById.get(t.employee_id) ?? null : null,
      title: t.title, status: t.status, due_at: t.due_at,
    })),
    openCases: (cases.data ?? []).map((c) => ({
      employee: nameById.get(c.employee_id) ?? "Report",
      title: c.title, type: c.type, severity: c.severity, status: c.status,
    })),
  };
}
