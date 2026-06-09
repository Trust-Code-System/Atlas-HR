import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily evaluator for user-defined AI workflows (§22). Runs each active
 * automation_workflows row over a bounded catalogue of triggers, performing
 * real actions (in-app notifications / HR tasks) with simple dedupe so repeated
 * daily runs don't spam.
 *
 * Secure with CRON_SECRET (Bearer or x-cron-secret), matching the other crons.
 */

const ADMIN_ROLES = ["workspace_owner", "hr_admin", "hr_manager"];

type Admin = ReturnType<typeof createAdminClient>;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface Match { employeeId: string; label: string; due: string | null }

async function findMatches(admin: Admin, orgId: string, trigger: string, days: number): Promise<Match[]> {
  // Roster for this org (also gives us the id→name map and org scoping).
  const { data: emps } = await admin
    .from("employees")
    .select("id, full_name, manager_id, end_date, start_date, status")
    .eq("org_id", orgId);
  const roster = emps ?? [];
  const nameById = new Map(roster.map((e) => [e.id, e.full_name]));
  const today = new Date().toISOString().slice(0, 10);

  if (trigger === "contract_ending") {
    return roster
      .filter((e) => e.status !== "terminated" && e.end_date && e.end_date >= today && e.end_date <= daysFromNow(days))
      .map((e) => ({ employeeId: e.id, label: e.full_name, due: e.end_date }));
  }
  if (trigger === "new_hire") {
    return roster
      .filter((e) => e.start_date && e.start_date >= daysAgo(days) && e.start_date <= today)
      .map((e) => ({ employeeId: e.id, label: e.full_name, due: e.start_date }));
  }
  if (trigger === "document_expiring") {
    const ids = roster.map((e) => e.id);
    if (ids.length === 0) return [];
    const { data: docs } = await admin
      .from("employee_documents")
      .select("employee_id, doc_type, expires_at")
      .in("employee_id", ids)
      .gte("expires_at", today)
      .lte("expires_at", daysFromNow(days));
    return (docs ?? []).map((d) => ({
      employeeId: d.employee_id,
      label: `${nameById.get(d.employee_id) ?? "Employee"} — ${d.doc_type}`,
      due: d.expires_at,
    }));
  }
  if (trigger === "leave_pending") {
    const ids = roster.map((e) => e.id);
    if (ids.length === 0) return [];
    const { data: lv } = await admin
      .from("leave_requests")
      .select("employee_id, status, created_at")
      .in("employee_id", ids)
      .eq("status", "pending")
      .lte("created_at", `${daysAgo(days)}T23:59:59Z`);
    return (lv ?? []).map((l) => ({ employeeId: l.employee_id, label: nameById.get(l.employee_id) ?? "Employee", due: null }));
  }
  return [];
}

async function orgAdminUserIds(admin: Admin, orgId: string): Promise<string[]> {
  const { data } = await admin.from("org_members").select("user_id, roles").eq("org_id", orgId);
  return (data ?? [])
    .filter((m) => Array.isArray(m.roles) && (m.roles as string[]).some((r) => ADMIN_ROLES.includes(r)))
    .map((m) => m.user_id as string)
    .filter(Boolean);
}

async function notify(admin: Admin, userId: string, type: string, title: string, body: string, link: string) {
  // Dedupe: same user + automation type + subject link in the last 45 days.
  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("link", link)
    .gte("created_at", `${daysAgo(45)}T00:00:00Z`)
    .limit(1)
    .maybeSingle();
  if (existing) return;
  await admin.from("notifications").insert({ user_id: userId, type, title, body, link });
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-cron-secret");
  if (!cronSecret) return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}` && secretHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let processed = 0;
  let actions = 0;

  try {
    const { data: workflows } = await admin
      .from("automation_workflows")
      .select("*")
      .eq("is_active", true);

    for (const wf of workflows ?? []) {
      processed += 1;
      const matches = (await findMatches(admin, wf.org_id, wf.trigger_type, wf.trigger_days)).slice(0, 200);
      if (matches.length === 0) continue;

      const cfg = (wf.action_config ?? {}) as { task_title?: string | null; message?: string | null };
      const notifType = `auto_${wf.id}`;

      for (const m of matches) {
        const link = `/org/people/${m.employeeId}`;
        const baseMsg = cfg.message?.trim() || `${wf.name}: ${m.label}`;

        if (wf.action_type === "create_task") {
          const ref = `${wf.id}:${m.employeeId}`;
          const { data: dupe } = await admin
            .from("employee_tasks")
            .select("id")
            .eq("org_id", wf.org_id)
            .eq("related_resource_type", "automation")
            .eq("related_resource_id", ref)
            .in("status", ["pending", "in_progress"])
            .limit(1)
            .maybeSingle();
          if (dupe) continue;
          await admin.from("employee_tasks").insert({
            org_id: wf.org_id,
            employee_id: m.employeeId,
            title: (cfg.task_title?.trim() || wf.name).slice(0, 200),
            description: baseMsg.slice(0, 1000),
            task_type: "custom",
            related_resource_type: "automation",
            related_resource_id: ref,
            due_at: m.due ? new Date(m.due).toISOString() : null,
            status: "pending",
          });
          actions += 1;
        } else if (wf.action_type === "notify_hr") {
          const adminIds = await orgAdminUserIds(admin, wf.org_id);
          for (const uid of adminIds) {
            await notify(admin, uid, notifType, wf.name, baseMsg, link);
          }
          actions += 1;
        } else if (wf.action_type === "notify_manager") {
          const { data: emp } = await admin.from("employees").select("manager_id").eq("id", m.employeeId).maybeSingle();
          if (!emp?.manager_id) continue;
          const { data: mgr } = await admin.from("employees").select("linked_user_id").eq("id", emp.manager_id).maybeSingle();
          if (mgr?.linked_user_id) {
            await notify(admin, mgr.linked_user_id, notifType, wf.name, baseMsg, link);
            actions += 1;
          }
        }
      }

      await admin.from("automation_workflows").update({ last_run_at: new Date().toISOString() }).eq("id", wf.id);
    }

    return NextResponse.json({ ok: true, processed, actions });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_cron_automations" } });
    return NextResponse.json({ error: "Automation run failed", processed, actions }, { status: 500 });
  }
}
