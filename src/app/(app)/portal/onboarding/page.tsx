import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { LifecycleRun, LifecycleTask } from "@/types/database";
import { OnboardingPortalClient } from "./onboarding-portal-client";
import { AccountLinkNotice } from "../account-link-notice";

export const metadata: Metadata = { title: "My Onboarding | Atlas HR" };

export default async function PortalOnboardingPage() {
  const employee = await getMyEmployee();
  const orgData = await getCurrentOrg();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
        <AccountLinkNotice isAdmin={orgData?.isAdmin ?? false} orgName={orgData?.org.name ?? "this workspace"} />
      </div>
    );
  }

  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("lifecycle_runs")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const allRuns = (runs ?? []) as LifecycleRun[];
  const runIds  = allRuns.map((r) => r.id);

  const { data: tasks } = runIds.length
    ? await supabase
        .from("lifecycle_tasks")
        .select("*")
        .in("run_id", runIds)
        .order("due_at", { ascending: true })
    : { data: [] };

  const allTasks = (tasks ?? []) as LifecycleTask[];

  const templateIds = [...new Set(allRuns.map((r) => r.template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from("lifecycle_templates").select("id, name").in("id", templateIds)
    : { data: [] };

  const templateMap: Record<string, string> = {};
  for (const t of templates ?? []) templateMap[t.id] = t.name;

  const activeCount    = allRuns.filter((r) => r.status === "in_progress").length;
  const completedCount = allRuns.filter((r) => r.status === "completed").length;
  const totalTasks     = allTasks.length;
  const doneTasks      = allTasks.filter((t) => t.status === "completed" || t.status === "skipped").length;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">My Onboarding</h1>
              <p className="text-blue-300 text-sm mt-0.5">{employee.full_name}</p>
            </div>
          </div>
          {allRuns.length > 0 && (
            <div className="flex gap-5 shrink-0">
              {activeCount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active</p>
                  <p className="font-mono text-2xl font-bold text-white tabular-nums">{activeCount}</p>
                </div>
              )}
              {totalTasks > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tasks done</p>
                  <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{doneTasks}/{totalTasks}</p>
                </div>
              )}
              {completedCount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Completed</p>
                  <p className="font-mono text-2xl font-bold text-white tabular-nums">{completedCount}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <OnboardingPortalClient runs={allRuns} tasks={allTasks} templateMap={templateMap} />
    </div>
  );
}
