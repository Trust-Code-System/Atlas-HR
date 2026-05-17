import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getWorkflowBundle, getWorkflowLaunchTarget } from "@/lib/public-resource-data";
import { updateWorkflowRunStatus, updateWorkflowRunTaskStatus } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workflow Run" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { pill: "bg-slate-100 text-slate-500 border border-slate-200",     dot: "bg-slate-400" },
};

const TASK_STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending:     { pill: "bg-amber-50 text-amber-700 border border-amber-200",      dot: "bg-amber-400" },
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",         dot: "bg-blue-500" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { pill: "bg-slate-100 text-slate-500 border border-slate-200",     dot: "bg-slate-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      "bg-navy-100 text-navy-600 border border-navy-200",
  medium:   "bg-amber-50 text-amber-700 border border-amber-200",
  high:     "bg-red-50 text-red-700 border border-red-200",
  critical: "bg-red-100 text-red-800 border border-red-300",
};

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgCtx.org.id)
    .maybeSingle();

  if (!run) notFound();

  const { data: tasks } = await supabase
    .from("employee_tasks")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .eq("related_resource_type", "workflow_run")
    .eq("related_resource_id", run.id)
    .order("due_at", { ascending: true });

  const workflow = getWorkflowBundle(run.workflow_slug);
  const launch = getWorkflowLaunchTarget(run.workflow_slug);
  const completed = (tasks ?? []).filter((task) => task.status === "completed").length;
  const total = (tasks ?? []).length;
  const sv = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.in_progress;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/workflow-runs" className="hover:text-white transition-colors">Workflow Runs</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{run.title}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{run.title}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {run.status.replace("_", " ")}
                </span>
                {run.priority && (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_COLORS[run.priority] ?? PRIORITY_COLORS.medium}`}>
                    {run.priority}
                  </span>
                )}
              </div>
              <p className="text-blue-300 text-sm">
                {run.workflow_slug}
              </p>
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tasks</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{total}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Done</p>
                <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{completed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main: run summary + workflow steps */}
        <section className="rounded-2xl border border-navy-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-navy-600 mb-0">{run.summary}</p>

          {workflow && (
            <div className="mt-5 rounded-xl bg-navy-50 border border-navy-100 p-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-3">Workflow steps</h2>
              <ol className="space-y-2 text-sm leading-6 text-navy-700">
                {workflow.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-navy-200 text-navy-600 text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-3">Next action</h2>
            <p className="text-sm leading-6 text-blue-900 mb-4">{launch.note}</p>
            <Link
              href={run.next_step_url ?? launch.href}
              className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              {launch.label}
            </Link>
          </section>

          <section className="rounded-2xl border border-navy-200 bg-white p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-3">Run status</h2>
            <div className="flex flex-col gap-2">
              <form action={updateWorkflowRunStatus}>
                <input type="hidden" name="run_id" value={run.id} />
                <input type="hidden" name="status" value="completed" />
                <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  Mark complete
                </button>
              </form>
              <form action={updateWorkflowRunStatus}>
                <input type="hidden" name="run_id" value={run.id} />
                <input type="hidden" name="status" value="cancelled" />
                <button type="submit" className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                  Cancel run
                </button>
              </form>
            </div>
          </section>
        </aside>
      </div>

      {/* Tasks checklist */}
      <section className="rounded-2xl border border-navy-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-navy-200 bg-navy-50/80 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Saved action checklist</h2>
          <span className="text-xs font-bold text-navy-500 bg-navy-100 border border-navy-200 rounded-full px-2.5 py-1">
            {completed}/{total}
          </span>
        </div>
        {(tasks ?? []).length > 0 ? (
          <div className="divide-y divide-navy-100">
            {(tasks ?? []).map((task) => {
              const ts = TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.pending;
              return (
                <div key={task.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_140px_130px_200px] md:items-center hover:bg-navy-50/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm leading-6 text-navy-500">{task.description}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 w-fit text-[10px] font-bold px-2.5 py-1 rounded-full ${ts.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${ts.dot}`} />
                    {task.status.replace("_", " ")}
                  </span>
                  <span className="font-mono text-xs text-navy-400">
                    {task.due_at
                      ? new Date(task.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "No due date"}
                  </span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {task.status === "completed" ? (
                      <form action={updateWorkflowRunTaskStatus}>
                        <input type="hidden" name="run_id" value={run.id} />
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="status" value="pending" />
                        <button type="submit" className="rounded-lg border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                          Reopen
                        </button>
                      </form>
                    ) : (
                      <form action={updateWorkflowRunTaskStatus}>
                        <input type="hidden" name="run_id" value={run.id} />
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                          Complete
                        </button>
                      </form>
                    )}
                    {task.status !== "cancelled" && (
                      <form action={updateWorkflowRunTaskStatus}>
                        <input type="hidden" name="run_id" value={run.id} />
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button type="submit" className="rounded-lg border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50 transition-colors">
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-navy-400">
            No saved actions were created for this run.
          </div>
        )}
      </section>
    </div>
  );
}
