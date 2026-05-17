import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Onboarding | Atlas HR" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  in_progress: { pill: "bg-blue-50 text-blue-700 border border-blue-200",         dot: "bg-blue-500" },
  completed:   { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { pill: "bg-navy-100 text-navy-500 border border-navy-200",         dot: "bg-navy-400" },
};

const TYPE_LABEL: Record<string, string> = {
  onboarding:  "Onboarding",
  offboarding: "Offboarding",
};

const TYPE_STYLE: Record<string, string> = {
  onboarding:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  offboarding: "bg-amber-50 text-amber-700 border border-amber-200",
};

export default async function OnboardingPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("lifecycle_runs")
    .select("*")
    .order("started_at", { ascending: false });

  const allRuns = runs ?? [];
  const employeeIds = [...new Set(allRuns.map((r) => r.employee_id))];
  const templateIds = [...new Set(allRuns.map((r) => r.template_id))];

  const [{ data: employees }, { data: templates }] = await Promise.all([
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds).eq("org_id", orgCtx.org.id)
      : Promise.resolve({ data: [] }),
    templateIds.length
      ? supabase.from("lifecycle_templates").select("id, name, type").in("id", templateIds)
      : Promise.resolve({ data: [] }),
  ]);

  const employeeMap = Object.fromEntries((employees ?? []).map((e) => [e.id, e as { id: string; full_name: string }]));
  const templateMap = Object.fromEntries((templates ?? []).map((t) => [t.id, t]));

  const orgRuns = allRuns.filter((r) => employeeMap[r.employee_id]);
  const inProgress = orgRuns.filter((r) => r.status === "in_progress").length;
  const completed  = orgRuns.filter((r) => r.status === "completed").length;

  const kpis = [
    { label: "Total runs",   value: orgRuns.length, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { label: "In progress",  value: inProgress,      strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Completed",    value: completed,        strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Active today", value: inProgress,       strip: "from-violet-400 to-purple-500",grad: "from-violet-500 to-purple-600",icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Onboarding</h1>
              <p className="text-blue-300 text-sm mt-0.5">{orgCtx.org.name} · Employee lifecycle runs</p>
            </div>
          </div>
          {orgCtx.isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/onboarding/templates"
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-colors ring-1 ring-white/15">
                Templates
              </Link>
              <Link href="/onboarding/new"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors ring-1 ring-white/15">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Start run
              </Link>
            </div>
          )}
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
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {orgRuns.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-4">Employee</div>
              <div className="col-span-3">Template</div>
              <div className="col-span-2 hidden sm:block">Type</div>
              <div className="col-span-2 hidden md:block">Start date</div>
              <div className="col-span-3 sm:col-span-1">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {orgRuns.map((run) => {
                const emp  = employeeMap[run.employee_id];
                const tmpl = templateMap[run.template_id];
                const sv   = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.in_progress;
                const ts   = TYPE_STYLE[run.type] ?? "bg-navy-50 text-navy-600 border border-navy-200";
                return (
                  <Link
                    key={run.id}
                    href={`/onboarding/${run.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors group"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-blue-700 transition-colors">
                        {emp?.full_name ?? "Unknown"}
                      </p>
                    </div>
                    <div className="col-span-3 text-sm text-navy-600 truncate">{tmpl?.name ?? "—"}</div>
                    <div className="col-span-2 hidden sm:block">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${ts}`}>
                        {TYPE_LABEL[run.type] ?? run.type}
                      </span>
                    </div>
                    <div className="col-span-2 hidden md:block font-mono text-sm text-navy-600">
                      {new Date(run.reference_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                        {run.status === "in_progress" ? "Active" : run.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No onboarding runs yet</h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">Start a run to track a new employee's onboarding journey.</p>
            {orgCtx.isAdmin && (
              <Link href="/onboarding/new"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Start run
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
