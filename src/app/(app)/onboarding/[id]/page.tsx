import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TaskChecklist, ProgressBar } from "./task-checklist";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Onboarding Run" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",         dot: "bg-blue-500" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { pill: "bg-slate-100 text-slate-500 border border-slate-200",      dot: "bg-slate-400" },
};

export default async function OnboardingRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("lifecycle_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (!run) notFound();

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("id", run.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) notFound();

  const { data: template } = await supabase
    .from("lifecycle_templates")
    .select("id, name")
    .eq("id", run.template_id)
    .single();

  const { data: tasks } = await supabase
    .from("lifecycle_tasks")
    .select("*")
    .eq("run_id", id)
    .order("due_at", { ascending: true });

  const allTasks  = tasks ?? [];
  const completed = allTasks.filter((t) => t.status === "completed" || t.status === "skipped").length;
  const total     = allTasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const sv        = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.in_progress;
  const startDate = new Date(run.reference_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/onboarding" className="hover:text-white transition-colors">Onboarding</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{employee.full_name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{employee.full_name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {run.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-blue-300 text-sm">
                {template?.name ?? "—"} · Started {startDate}
              </p>
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tasks</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{completed}/{total}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Complete</p>
                <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{pct}%</p>
              </div>
            </div>
          </div>
          {total > 0 && (
            <div className="mt-4">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <ProgressBar pct={pct} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task checklist */}
      <TaskChecklist tasks={allTasks} isAdmin={orgCtx.isAdmin} runStatus={run.status} />
    </div>
  );
}
