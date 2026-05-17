import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { WORKFLOW_BUNDLES } from "@/lib/public-resource-data";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workflow Runs | Atlas HR" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { pill: "bg-slate-100 text-slate-500 border border-slate-200",     dot: "bg-slate-400" },
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   "text-red-600 font-semibold",
  medium: "text-amber-600",
  low:    "text-navy-400",
};

export default async function WorkflowRunsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .order("created_at", { ascending: false });

  const allRuns = runs ?? [];
  const runIds = allRuns.map((run) => run.id);
  const { data: tasks } = runIds.length
    ? await supabase
        .from("employee_tasks")
        .select("id, related_resource_id, status")
        .eq("org_id", orgCtx.org.id)
        .eq("related_resource_type", "workflow_run")
        .in("related_resource_id", runIds)
    : { data: [] };

  const taskStats = Object.fromEntries(
    runIds.map((id) => {
      const related = (tasks ?? []).filter((task) => task.related_resource_id === id);
      return [id, { total: related.length, done: related.filter((task) => task.status === "completed").length }];
    })
  );

  const inProgress = allRuns.filter((run) => run.status === "in_progress").length;
  const completed  = allRuns.filter((run) => run.status === "completed").length;
  const cancelled  = allRuns.filter((run) => run.status === "cancelled").length;

  const kpis = [
    { label: "Total runs",   value: allRuns.length, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "In progress",  value: inProgress,     strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Completed",    value: completed,       strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Cancelled",    value: cancelled,       strip: "from-slate-300 to-slate-400",  grad: "from-slate-400 to-slate-500",  icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Runs</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name}
                {inProgress > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                    {inProgress} in progress
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/copilot?workflow=onboarding"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Open Atlas AI workflows
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Runs table */}
      {allRuns.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-navy-200 bg-navy-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-navy-400">
            <div className="col-span-5">Workflow</div>
            <div className="col-span-2 hidden md:block">Priority</div>
            <div className="col-span-2 hidden sm:block">Tasks</div>
            <div className="col-span-2 hidden lg:block">Due</div>
            <div className="col-span-7 sm:col-span-3 lg:col-span-1">Status</div>
          </div>
          <div className="divide-y divide-navy-100">
            {allRuns.map((run) => {
              const stats = taskStats[run.id] ?? { total: 0, done: 0 };
              const sv = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.in_progress;
              return (
                <Link
                  key={run.id}
                  href={`/workflow-runs/${run.id}`}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-blue-50/30 group"
                >
                  <div className="col-span-5 min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-800 group-hover:text-blue-700 transition-colors">{run.title}</p>
                    <p className="mt-0.5 truncate text-xs text-navy-400 font-mono">{run.workflow_slug}</p>
                  </div>
                  <div className={`col-span-2 hidden text-sm capitalize md:block ${PRIORITY_STYLE[run.priority] ?? "text-navy-600"}`}>
                    {run.priority}
                  </div>
                  <div className="col-span-2 hidden font-mono text-sm text-navy-700 font-semibold sm:block">
                    {stats.done}/{stats.total}
                  </div>
                  <div className="col-span-2 hidden font-mono text-sm text-navy-500 lg:block">
                    {run.due_at ? new Date(run.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </div>
                  <div className="col-span-7 sm:col-span-3 lg:col-span-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${sv.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                      {run.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-navy-900 mb-1">No workflow runs yet</h2>
          <p className="mt-2 text-sm text-navy-500 max-w-xs mx-auto">Launch a workflow from the library to create a saved checklist.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {WORKFLOW_BUNDLES.slice(0, 3).map((workflow) => (
              <Link
                key={workflow.slug}
                href={`/copilot?workflow=${workflow.slug}`}
                className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 hover:border-blue-300 transition-colors"
              >
                {workflow.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
